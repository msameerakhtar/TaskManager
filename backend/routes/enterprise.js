const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const authMiddleware = require('../middleware/authMiddleware');
const { exportAuth } = require('../middleware/exportAuth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const ApprovalRequest = require('../models/ApprovalRequest');
const { logAudit } = require('../services/auditService');
const { isProjectMember, memberUserIdString } = require('../utils/projectAccess');

const getRole = (project, userId) => {
    const uid = String(userId);
    if (project.ownerId && String(project.ownerId) === uid) return 'admin';
    const m = project.members.find((x) => memberUserIdString(x) === uid);
    return m ? m.role : null;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const getNextRecurringDate = (dueDate, frequency) => {
    if (frequency === 'daily') return addDays(dueDate, 1);
    if (frequency === 'weekly') return addDays(dueDate, 7);
    if (frequency === 'monthly') {
        const d = new Date(dueDate);
        d.setMonth(d.getMonth() + 1);
        return d;
    }
    return null;
};

const csvEscape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

// Exports: JWT or x-api-key (export routes registered before session-only middleware)
router.get('/exports/tasks.csv', exportAuth, async (req, res) => {
    try {
        const { projectId } = req.exportContext;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!req.exportContext.fromApiKey) {
            if (!isProjectMember(project, req.user.id)) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const tasks = await Task.find({ projectId })
            .sort({ createdAt: -1 })
            .populate('assigneeId', 'fullName email')
            .lean();

        const headers = ['title', 'status', 'priority', 'dueDate', 'assignee', 'createdAt', 'approvalStatus', 'escalationLevel'];
        const lines = [headers.join(',')];
        for (const t of tasks) {
            const row = [
                csvEscape(t.title),
                csvEscape(t.status),
                csvEscape(t.priority),
                csvEscape(t.dueDate ? new Date(t.dueDate).toISOString() : ''),
                csvEscape(t.assigneeId?.fullName || t.assigneeId?.email || ''),
                csvEscape(t.createdAt ? new Date(t.createdAt).toISOString() : ''),
                csvEscape(t.approvalStatus || 'none'),
                csvEscape(t.escalationLevel ?? 0)
            ];
            lines.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="tasks-${projectId}.csv"`);
        res.send(lines.join('\n'));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/exports/audit.csv', exportAuth, async (req, res) => {
    try {
        const { projectId } = req.exportContext;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (req.exportContext.fromApiKey) {
            return res.status(403).json({ message: 'Audit CSV requires user session.' });
        }
        if (getRole(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can export audit logs.' });
        }

        const logs = await AuditLog.find({ projectId })
            .sort({ createdAt: -1 })
            .limit(5000)
            .populate('actorId', 'fullName email')
            .lean();

        const headers = ['createdAt', 'actor', 'entityType', 'entityId', 'action', 'meta'];
        const lines = [headers.join(',')];
        for (const l of logs) {
            const row = [
                csvEscape(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
                csvEscape(l.actorId?.email || l.actorId?.fullName || ''),
                csvEscape(l.entityType),
                csvEscape(l.entityId?.toString() || ''),
                csvEscape(l.action),
                csvEscape(JSON.stringify(l.meta || {}))
            ];
            lines.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="audit-${projectId}.csv"`);
        res.send(lines.join('\n'));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/exports/report.pdf', exportAuth, async (req, res) => {
    try {
        const { projectId } = req.exportContext;
        const project = await Project.findById(projectId).populate('members.userId', 'fullName email').lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!req.exportContext.fromApiKey) {
            if (!isProjectMember(project, req.user.id)) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const tasks = await Task.find({ projectId }).lean();
        const done = tasks.filter((t) => t.status === 'done').length;
        const open = tasks.length - done;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${projectId}.pdf"`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);
        doc.fontSize(20).text('Workspace report', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Project: ${project.name}`);
        doc.text(`Generated: ${new Date().toISOString()}`);
        doc.moveDown();
        doc.fontSize(14).text('Summary');
        doc.fontSize(11).text(`Total tasks: ${tasks.length}`);
        doc.text(`Open: ${open}`);
        doc.text(`Completed: ${done}`);
        doc.moveDown();
        doc.fontSize(14).text('Enterprise');
        const ent = project.enterprise || {};
        doc.fontSize(11).text(`Approval required to complete: ${ent.requireApprovalForCompletion ? 'yes' : 'no'}`);
        doc.text(`SLA monitoring: ${ent.sla?.enabled ? 'on' : 'off'}`);
        doc.end();
    } catch (err) {
        console.error(err.message);
        if (!res.headersSent) res.status(500).send('Server Error');
    }
});

router.use(authMiddleware);

// GET /api/enterprise/audit?projectId=&page=&limit=
router.get('/audit', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ message: 'projectId is required.' });
        const project = await Project.findById(projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (getRole(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can view audit logs.' });
        }

        const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 500);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            AuditLog.find({ projectId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('actorId', 'fullName email')
                .lean(),
            AuditLog.countDocuments({ projectId })
        ]);

        res.json({ items, meta: { page, limit, total } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET /api/enterprise/approvals/pending?projectId=
router.get('/approvals/pending', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ message: 'projectId is required.' });
        const project = await Project.findById(projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (getRole(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only admins can manage approvals.' });
        }

        const list = await ApprovalRequest.find({ projectId, status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('taskId', 'title status dueDate priority')
            .populate('requestedBy', 'fullName email')
            .lean();

        res.json(list);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST /api/enterprise/approvals/:requestId/approve
router.post('/approvals/:requestId/approve', async (req, res) => {
    try {
        const requestDoc = await ApprovalRequest.findById(req.params.requestId);
        if (!requestDoc || requestDoc.status !== 'pending') {
            return res.status(404).json({ message: 'Approval request not found or already processed.' });
        }

        const project = await Project.findById(requestDoc.projectId);
        if (!project || getRole(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only project admins can approve requests.' });
        }

        const task = await Task.findById(requestDoc.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found.' });

        // 1. Update Request Status
        requestDoc.status = 'approved';
        requestDoc.resolvedBy = req.user.id;
        requestDoc.resolvedAt = new Date();
        requestDoc.comment = (req.body?.comment || '').trim();
        await requestDoc.save();

        const io = req.app.get('io');

        if (requestDoc.type === 'deletion') {
            await Task.findByIdAndDelete(task._id);

            await logAudit({
                actorId: req.user.id,
                projectId: project._id,
                entityType: 'approval',
                entityId: requestDoc._id,
                action: 'approved',
                meta: { taskId: task._id.toString(), type: 'deletion' },
                ip: req.ip
            });

            if (io) {
                io.to(`project:${project._id}`).emit('task:changed', {
                    action: 'deleted',
                    projectId: project._id.toString(),
                    taskId: task._id.toString()
                });
            }

            return res.json({ success: true, request: requestDoc });
        }

        // 2. Update Task Status (Completion)
        task.status = 'done';
        task.completedAt = new Date();
        task.approvalStatus = 'approved';
        task.activityLog.push({
            actorId: req.user.id,
            action: 'approved',
            detail: 'Completion approved by admin'
        });
        await task.save();

        // 3. Handle Recurring Tasks
        if (task.recurrence?.enabled && task.recurrence?.frequency) {
            const nextDueDate = getNextRecurringDate(task.dueDate, task.recurrence.frequency);
            if (nextDueDate) {
                const nextTask = await Task.create({
                    userId: task.userId, // Creator remains same
                    projectId: task.projectId,
                    assigneeId: task.assigneeId,
                    title: task.title,
                    description: task.description,
                    status: 'todo',
                    priority: task.priority,
                    dueDate: nextDueDate,
                    estimatedHours: task.estimatedHours || 2,
                    recurrence: task.recurrence,
                    notes: task.notes || [],
                    attachments: [],
                    activityLog: [{
                        actorId: req.user.id,
                        action: 'created',
                        detail: 'Recurring task created automatically'
                    }]
                });
                
                if (io) {
                    io.to(`project:${project._id}`).emit('task:changed', {
                        action: 'created',
                        projectId: project._id.toString(),
                        taskId: nextTask._id.toString()
                    });
                }
            }
        }

        // 4. Audit Log
        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'approval',
            entityId: requestDoc._id,
            action: 'approved',
            meta: { taskId: task._id.toString() },
            ip: req.ip
        });

        // 5. Notify frontend via socket
        if (io) {
            io.to(`project:${project._id}`).emit('task:changed', {
                action: 'updated',
                projectId: project._id.toString(),
                taskId: task._id.toString()
            });
        }

        res.json({ success: true, request: requestDoc, task });
    } catch (err) {
        console.error('Approval Error Details:', err); // Detailed log
        res.status(500).json({ 
            message: 'Internal Server Error during approval', 
            error: err.message 
        });
    }
});

// POST /api/enterprise/approvals/:requestId/reject
router.post('/approvals/:requestId/reject', async (req, res) => {
    try {
        const requestDoc = await ApprovalRequest.findById(req.params.requestId);
        if (!requestDoc || requestDoc.status !== 'pending') {
            return res.status(404).json({ message: 'Approval request not found.' });
        }

        const project = await Project.findById(requestDoc.projectId);
        if (!project || getRole(project, req.user.id) !== 'admin') {
            return res.status(403).json({ message: 'Only project admins can reject.' });
        }

        const task = await Task.findById(requestDoc.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found.' });

        requestDoc.status = 'rejected';
        requestDoc.resolvedBy = req.user.id;
        requestDoc.resolvedAt = new Date();
        requestDoc.comment = (req.body?.comment || '').trim();
        await requestDoc.save();

        if (requestDoc.type === 'deletion') {
            task.deletionStatus = 'rejected';
            task.activityLog.push({
                actorId: req.user.id,
                action: 'rejected',
                detail: requestDoc.comment || 'Deletion rejected'
            });
            await task.save();
        } else {
            task.approvalStatus = 'rejected';
            task.completedAt = null;
            task.activityLog.push({
                actorId: req.user.id,
                action: 'rejected',
                detail: requestDoc.comment || 'Completion rejected'
            });
            await task.save();
        }

        await logAudit({
            actorId: req.user.id,
            projectId: project._id,
            entityType: 'approval',
            entityId: requestDoc._id,
            action: 'rejected',
            meta: { taskId: task._id.toString(), comment: requestDoc.comment },
            ip: req.ip
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`project:${project._id}`).emit('task:changed', {
                action: 'updated',
                projectId: project._id.toString(),
                taskId: task._id.toString()
            });
        }

        res.json({ request: requestDoc, task });
    } catch (err) {
        console.error('Rejection Error Details:', err);
        res.status(500).json({ 
            message: 'Internal Server Error during rejection', 
            error: err.message 
        });
    }
});

module.exports = router;
