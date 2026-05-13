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
