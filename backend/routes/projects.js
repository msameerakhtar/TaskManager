const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const { hashKey } = require('../middleware/exportAuth');
const { sendSlackWebhook, sendProjectEmail } = require('../services/integrationService');
const { logAudit } = require('../services/auditService');
const { memberUserIdString } = require('../utils/projectAccess');

router.use(authMiddleware);

const getUserRoleInProject = (project, userId) => {
    const uid = String(userId);
    if (project.ownerId && String(project.ownerId) === uid) return 'admin';
    const member = project.members.find((m) => memberUserIdString(m) === uid);
    return member ? member.role : null;
};

// GET /api/projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({
            'members.userId': req.user.id
        }).sort({ createdAt: -1 }).populate('members.userId', 'fullName email').lean();
        res.json(projects);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Project name is required.' });
    }
    try {
        const project = await Project.create({
            name: name.trim(),
            ownerId: req.user.id,
            members: [{ userId: req.user.id, role: 'admin' }]
        });
        const populated = await Project.findById(project._id).populate('members.userId', 'fullName email');
        if (req.app.get('io')) {
            req.app.get('io').to(`user:${req.user.id}`).emit('project:updated', { projectId: project._id });
            req.app.get('io').to('room:superadmin').emit('project:created', { projectId: project._id });
        }
        res.status(201).json(populated);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects/:id/members
router.post('/:id/members', async (req, res) => {
    const { email, role = 'member' } = req.body;
    if (!email || !email.trim()) {
        return res.status(400).json({ message: 'Member email is required.' });
    }
    if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
    }
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const callerRole = getUserRoleInProject(project, req.user.id);
        if (callerRole !== 'admin') {
            return res.status(403).json({ message: 'Only project admins can add members.' });
        }

        const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        const exists = project.members.some((m) => m.userId.toString() === targetUser._id.toString());
        if (exists) return res.status(400).json({ message: 'User is already in this project.' });

        project.members.push({ userId: targetUser._id, role });
        await project.save();
        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
            req.app.get('io').to(`user:${targetUser._id}`).emit('project:updated', { projectId: project._id });
        }
        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'member',
            entityId: targetUser._id,
            action: 'invited',
            meta: { email: targetUser.email, role },
            ip: req.ip
        });
        const populated = await Project.findById(project._id).populate('members.userId', 'fullName email');
        res.json(populated);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// PATCH /api/projects/:id/members/:userId
router.patch('/:id/members/:userId', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can change roles' });
        }

        if (String(project.ownerId) === req.params.userId) {
            return res.status(400).json({ message: 'Cannot change owner role' });
        }

        const memberIndex = project.members.findIndex(m => m.userId.toString() === req.params.userId);
        if (memberIndex === -1) return res.status(404).json({ message: 'Member not found' });

        project.members[memberIndex].role = role;
        await project.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
        }
        const populated = await Project.findById(project._id).populate('members.userId', 'fullName email');
        res.json(populated);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const callerRole = getUserRoleInProject(project, req.user.id);
        if (callerRole !== 'admin' && req.user.id !== req.params.userId) {
            return res.status(403).json({ message: 'Not authorized to remove this member' });
        }

        if (String(project.ownerId) === req.params.userId) {
            return res.status(400).json({ message: 'Cannot remove the project owner' });
        }

        project.members = project.members.filter(m => m.userId.toString() !== req.params.userId);
        await project.save();

        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
            req.app.get('io').to(`user:${req.params.userId}`).emit('project:updated', { projectId: project._id, deleted: true });
        }
        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
        
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can rename projects' });
        }

        project.name = name.trim();
        await project.save();
        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
        }
        res.json({ message: 'Project renamed', project });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete projects' });
        }

        const Task = require('../models/Task');
        const ApprovalRequest = require('../models/ApprovalRequest');
        const ApiKey = require('../models/ApiKey');
        const AuditLog = require('../models/AuditLog');

        await Task.deleteMany({ projectId: project._id });
        await ApprovalRequest.deleteMany({ projectId: project._id });
        await ApiKey.deleteMany({ projectId: project._id });
        await AuditLog.deleteMany({ projectId: project._id });

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

// GET /api/projects/:id/dashboard-stats — admin only
router.get('/:id/dashboard-stats', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('members.userId', 'fullName email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        if (getUserRoleInProject(project, req.user.id) !== 'admin' && req.user.systemRole !== 'superadmin') {
            return res.status(403).json({ message: 'Only admins can view workspace insights.' });
        }

        const Task = require('../models/Task');
        const mongoose = require('mongoose');
        const projectIdObj = new mongoose.Types.ObjectId(req.params.id);

        // Task Status Distribution
        const statusDistribution = await Task.aggregate([
            { $match: { projectId: projectIdObj } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const taskData = ['todo', 'in_progress', 'done'].map(s => {
            const match = statusDistribution.find(t => t._id === s);
            return {
                name: s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done',
                value: match ? match.count : 0
            };
        });

        // Workload Data (Tasks per assignee)
        const workloadRaw = await Task.aggregate([
            { $match: { projectId: projectIdObj, status: { $ne: 'done' } } },
            { $group: { _id: '$assigneeId', count: { $sum: 1 } } }
        ]);

        const workloadData = workloadRaw.map(w => {
            const memberObj = project.members.find(m => m.userId && m.userId._id.toString() === (w._id ? w._id.toString() : 'unassigned'));
            let name = 'Unassigned';
            if (memberObj && memberObj.userId) {
                name = memberObj.userId.fullName || memberObj.userId.email;
            } else if (w._id && w._id.toString() === project.ownerId.toString()) {
                name = 'Owner'; // In case owner is not in members array but has tasks
            }
            return {
                name,
                Tasks: w.count
            };
        }).filter(item => item.name !== 'Owner' || item.Tasks > 0); // Cleanup

        const tasksCount = await Task.countDocuments({ projectId: projectIdObj });

        res.json({
            membersCount: (project.members?.length || 0) + 1, // +1 for owner
            tasksCount,
            taskData,
            workloadData
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).send('Server Error');
    }
});

// GET /api/projects/:id/member-stats — for any member
router.get('/:id/member-stats', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        const role = getUserRoleInProject(project, req.user.id);
        if (!role && req.user.systemRole !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const Task = require('../models/Task');
        const mongoose = require('mongoose');
        const projectIdObj = new mongoose.Types.ObjectId(req.params.id);
        const userIdObj = new mongoose.Types.ObjectId(req.user.id);

        // Filter only tasks assigned to this user
        const matchStage = { projectId: projectIdObj, assigneeId: userIdObj };

        // Overall stats
        const totalTasks = await Task.countDocuments(matchStage);
        const pendingTasks = await Task.countDocuments({ ...matchStage, status: { $ne: 'done' } });

        // Task Status Distribution
        const statusRaw = await Task.aggregate([
            { $match: matchStage },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const taskData = ['todo', 'in_progress', 'done'].map(s => {
            const match = statusRaw.find(t => t._id === s);
            return {
                name: s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done',
                value: match ? match.count : 0
            };
        });

        // Task Priority Distribution
        const priorityRaw = await Task.aggregate([
            { $match: matchStage },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const priorityData = ['low', 'medium', 'high'].map(p => {
            const match = priorityRaw.find(t => t._id === p);
            return {
                name: p === 'low' ? 'Low' : p === 'medium' ? 'Medium' : 'High',
                Tasks: match ? match.count : 0
            };
        });

        res.json({
            totalTasks,
            pendingTasks,
            taskData,
            priorityData
        });
    } catch (error) {
        console.error('Member Stats Error:', error);
        res.status(500).send('Server Error');
    }
});

// PATCH /api/projects/:id/enterprise — admin only
router.patch('/:id/enterprise', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update enterprise settings.' });
        }

        const { enterprise } = req.body;
        if (!enterprise || typeof enterprise !== 'object') {
            return res.status(400).json({ message: 'enterprise object is required.' });
        }

        project.enterprise = {
            ...project.enterprise,
            ...enterprise,
            sla: { ...project.enterprise?.sla, ...enterprise.sla },
            integrations: { ...project.enterprise?.integrations, ...enterprise.integrations }
        };

        await project.save();
        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'project',
            entityId: project._id,
            action: 'enterprise_updated',
            meta: { keys: Object.keys(enterprise) },
            ip: req.ip
        });

        const populated = await Project.findById(project._id).populate('members.userId', 'fullName email');
        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id });
        }
        res.json(populated);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects/:id/integrations/test-slack
router.post('/:id/integrations/test-slack', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can test integrations.' });
        }
        const url = (req.body.url || project.enterprise?.integrations?.slackWebhookUrl || '').trim();
        const result = await sendSlackWebhook(url, req.body.message || `Test from Task Manager — ${project.name}`);
        if (!result.ok) {
            return res.status(400).json({ message: result.error || 'Slack request failed' });
        }
        res.json({ ok: true });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects/:id/integrations/test-email
router.post('/:id/integrations/test-email', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can test integrations.' });
        }
        const me = await User.findById(req.user.id).select('email').lean();
        const to = (req.body.to || me?.email || '').trim();
        if (!to) return res.status(400).json({ message: 'No recipient email.' });
        const r = await sendProjectEmail({
            to,
            subject: `Task Manager test — ${project.name}`,
            text: 'This is a test email from your workspace integrations.'
        });
        res.json({ ok: true, mocked: r.mocked === true });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/projects/:id/api-keys
router.post('/:id/api-keys', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create API keys.' });
        }

        const label = (req.body.label || 'Export key').trim().slice(0, 80);
        const raw = `tm_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = hashKey(raw);
        const keyPrefix = raw.slice(0, 12);

        const doc = await ApiKey.create({
            projectId: project._id,
            label,
            keyPrefix,
            keyHash,
            scopes: ['export:read'],
            createdBy: req.user.id
        });

        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'api_key',
            entityId: doc._id,
            action: 'created',
            meta: { label, keyPrefix },
            ip: req.ip
        });

        res.status(201).json({
            id: doc._id,
            label: doc.label,
            keyPrefix: doc.keyPrefix,
            key: raw,
            message: 'Copy this key now; it will not be shown again.'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/projects/:id/api-keys
router.get('/:id/api-keys', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can list API keys.' });
        }

        const keyDocs = await ApiKey.find({ projectId: project._id })
            .sort({ createdAt: -1 })
            .select('label keyPrefix scopes createdAt lastUsedAt')
            .lean();
        res.json(keyDocs);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE /api/projects/:id/api-keys/:keyId
router.delete('/:id/api-keys/:keyId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (getUserRoleInProject(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can revoke API keys.' });
        }

        const deleted = await ApiKey.findOneAndDelete({
            _id: req.params.keyId,
            projectId: project._id
        });
        if (!deleted) return res.status(404).json({ message: 'API key not found.' });

        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'api_key',
            entityId: deleted._id,
            action: 'revoked',
            meta: { label: deleted.label },
            ip: req.ip
        });

        res.json({ message: 'API key revoked.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
