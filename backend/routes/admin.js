const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const Role = require('../models/Role');
const cache = require('../utils/cache');

// ── Super Admin middleware ──────────────────────────────────────────────────
const superAdminMiddleware = (req, res, next) => {
    if (req.user && req.user.systemRole === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
};

router.use(authMiddleware);
router.use(superAdminMiddleware);

// ── GET /api/admin/stats ────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const projectsCount = await Project.countDocuments();
        const tasksCount = await Task.countDocuments();
        res.json({ usersCount, projectsCount, tasksCount });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/chart-data ───────────────────────────────────────────────
router.get('/chart-data', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const usersGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const projectsGrowth = await Project.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const tasksStatus = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const growthData = [];
        const currDate = new Date(sixMonthsAgo);
        for (let i = 0; i < 6; i++) {
            const m = currDate.getMonth() + 1;
            const y = currDate.getFullYear();
            const uMatch = usersGrowth.find(g => g._id.month === m && g._id.year === y);
            const pMatch = projectsGrowth.find(g => g._id.month === m && g._id.year === y);
            growthData.push({
                name: `${monthNames[m - 1]} ${y.toString().slice(-2)}`,
                Users: uMatch ? uMatch.count : 0,
                Workspaces: pMatch ? pMatch.count : 0
            });
            currDate.setMonth(currDate.getMonth() + 1);
        }

        const statuses = ['todo', 'in_progress', 'done'];
        const taskData = statuses.map(s => {
            const match = tasksStatus.find(t => t._id === s);
            return {
                name: s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done',
                value: match ? match.count : 0
            };
        });

        res.json({ growthData, taskData });
    } catch (error) {
        console.error('Chart Data Error:', error);
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
        res.json(users);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// ── PATCH /api/admin/users/:id/suspend ─────────────────────────────────────
router.patch('/users/:id/suspend', async (req, res) => {
    try {
        const userToSuspend = await User.findById(req.params.id);
        if (!userToSuspend) return res.status(404).json({ message: 'User not found' });
        if (userToSuspend.systemRole === 'superadmin') {
            return res.status(400).json({ message: 'Cannot suspend a superadmin' });
        }

        userToSuspend.isSuspended = !userToSuspend.isSuspended;
        await userToSuspend.save();

        if (req.app.get('io')) {
            req.app.get('io').to('room:superadmin').emit('user:updated');
            if (userToSuspend.isSuspended) {
                req.app.get('io').to(`user:${userToSuspend._id}`).emit('user:suspended');
            }
        }

        res.json({
            message: userToSuspend.isSuspended ? 'User suspended successfully' : 'User unblocked successfully',
            isSuspended: userToSuspend.isSuspended
        });
    } catch (error) {
        console.error('Suspend Error:', error);
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/workspaces ───────────────────────────────────────────────
router.get('/workspaces', async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('ownerId', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(projects);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/workspaces/:id/enterprise ───────────────────────────────
// Super Admin reads enterprise config of any workspace
router.get('/workspaces/:id/enterprise', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'fullName email')
            .lean();
        if (!project) return res.status(404).json({ message: 'Workspace not found' });
        res.json({
            _id: project._id,
            name: project.name,
            owner: project.ownerId,
            enterprise: project.enterprise || {}
        });
    } catch (error) {
        console.error('Admin get enterprise error:', error);
        res.status(500).send('Server Error');
    }
});

// ── PATCH /api/admin/workspaces/:id/enterprise ─────────────────────────────
// Super Admin overrides enterprise config of any workspace
router.patch('/workspaces/:id/enterprise', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Workspace not found' });

        const { enterprise } = req.body;
        if (!enterprise || typeof enterprise !== 'object') {
            return res.status(400).json({ message: 'enterprise object is required.' });
        }

        // Deep merge — preserves existing keys not in request
        project.enterprise = {
            requireApprovalForCompletion:
                enterprise.requireApprovalForCompletion !== undefined
                    ? enterprise.requireApprovalForCompletion
                    : project.enterprise?.requireApprovalForCompletion ?? false,
            sla: {
                enabled: enterprise.sla?.enabled !== undefined
                    ? enterprise.sla.enabled
                    : project.enterprise?.sla?.enabled ?? false,
                escalateHoursAfterDue: enterprise.sla?.escalateHoursAfterDue !== undefined
                    ? Number(enterprise.sla.escalateHoursAfterDue)
                    : project.enterprise?.sla?.escalateHoursAfterDue ?? 24,
                repeatEscalationHours: enterprise.sla?.repeatEscalationHours !== undefined
                    ? Number(enterprise.sla.repeatEscalationHours)
                    : project.enterprise?.sla?.repeatEscalationHours ?? 24,
            },
            integrations: {
                slackWebhookUrl: enterprise.integrations?.slackWebhookUrl !== undefined
                    ? enterprise.integrations.slackWebhookUrl
                    : project.enterprise?.integrations?.slackWebhookUrl ?? '',
                emailAlertsToAdmins: enterprise.integrations?.emailAlertsToAdmins !== undefined
                    ? enterprise.integrations.emailAlertsToAdmins
                    : project.enterprise?.integrations?.emailAlertsToAdmins ?? false,
            }
        };

        await project.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
            req.app.get('io').to('room:superadmin').emit('project:updated', { projectId: project._id });
        }

        res.json({ message: 'Enterprise settings updated successfully', enterprise: project.enterprise });
    } catch (error) {
        console.error('Admin patch enterprise error:', error);
        res.status(500).send('Server Error');
    }
});

// ── DELETE /api/admin/workspaces/:id ───────────────────────────────────────
router.delete('/workspaces/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        await Task.deleteMany({ projectId: project._id });
        await Project.findByIdAndDelete(project._id);

        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id, deleted: true });
            req.app.get('io').to('room:superadmin').emit('project:deleted', { projectId: project._id });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/audit ────────────────────────────────────────────────────
// Fetch paginated system-wide audit logs
router.get('/audit', async (req, res) => {
    try {
        const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 1000);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            AuditLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'fullName email')
                .populate('projectId', 'name')
                .lean(),
            AuditLog.countDocuments()
        ]);

        res.json({ items, meta: { page, limit, total } });
    } catch (error) {
        console.error('Fetch global audit logs error:', error);
        res.status(500).send('Server Error');
    }
});

// Helper for CSV escaping
const csvEscape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

// ── GET /api/admin/exports/audit.csv ────────────────────────────────────────
// Super Admin global CSV export of all system audit logs
router.get('/exports/audit.csv', async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(10000)
            .populate('actorId', 'fullName email')
            .populate('projectId', 'name')
            .lean();

        const headers = ['Timestamp', 'Workspace', 'Actor Email', 'Actor Name', 'Entity Type', 'Entity ID', 'Action', 'Metadata'];
        const lines = [headers.join(',')];

        for (const l of logs) {
            const row = [
                csvEscape(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
                csvEscape(l.projectId?.name || 'System-wide'),
                csvEscape(l.actorId?.email || ''),
                csvEscape(l.actorId?.fullName || ''),
                csvEscape(l.entityType),
                csvEscape(l.entityId?.toString() || ''),
                csvEscape(l.action),
                csvEscape(JSON.stringify(l.meta || {}))
            ];
            lines.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="global-system-audit-log.csv"');
        res.send(lines.join('\n'));
    } catch (error) {
        console.error('Export global audit CSV error:', error);
        res.status(500).send('Server Error');
    }
});

// ── GET /api/admin/rbac/roles ───────────────────────────────────────────────
// Fetch all platform and workspace roles
router.get('/rbac/roles', async (req, res) => {
    try {
        const roles = await Role.find().sort({ isSystemDefault: -1, scope: 1, name: 1 }).lean();
        res.json(roles);
    } catch (error) {
        console.error('Fetch RBAC roles error:', error);
        res.status(500).send('Server Error');
    }
});

// ── POST /api/admin/rbac/roles ──────────────────────────────────────────────
// Create a new custom role
router.post('/rbac/roles', async (req, res) => {
    try {
        const { name, scope, description, permissions } = req.body;
        if (!name || !scope) {
            return res.status(400).json({ message: 'Role name and scope are required.' });
        }

        const normalizedName = name.trim().toLowerCase();
        const existing = await Role.findOne({ name: normalizedName });
        if (existing) {
            return res.status(400).json({ message: 'A role with this name already exists.' });
        }

        const newRole = await Role.create({
            name: normalizedName,
            scope,
            description: description || '',
            permissions: Array.isArray(permissions) ? permissions : [],
            isSystemDefault: false
        });

        res.status(201).json({ message: 'Custom role created successfully', role: newRole });
    } catch (error) {
        console.error('Create custom role error:', error);
        res.status(500).send('Server Error');
    }
});

// ── PATCH /api/admin/rbac/roles/:id ──────────────────────────────────────────
// Update dynamic permissions of a role
router.patch('/rbac/roles/:id', async (req, res) => {
    try {
        const { permissions, description } = req.body;
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        if (Array.isArray(permissions)) {
            role.permissions = permissions;
        }
        if (typeof description === 'string') {
            role.description = description;
        }

        await role.save();
        
        // Invalidate permissions cache
        cache.del(`role:${role.name.toLowerCase()}`);

        const io = req.app.get('io');
        if (io) {
            io.emit('permissions:updated', { roleName: role.name });
        }
        res.json({ message: 'Role permissions updated successfully', role });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).send('Server Error');
    }
});

// ── DELETE /api/admin/rbac/roles/:id ─────────────────────────────────────────
// Delete a custom role (prevent system defaults deletion)
router.delete('/rbac/roles/:id', async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        if (role.isSystemDefault) {
            return res.status(400).json({ message: 'System default roles cannot be deleted.' });
        }

        // Invalidate permissions cache
        cache.del(`role:${role.name.toLowerCase()}`);

        await Role.findByIdAndDelete(role._id);
        res.json({ message: 'Custom role deleted successfully' });
    } catch (error) {
        console.error('Delete custom role error:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;


