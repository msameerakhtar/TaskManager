const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const Project = require('../models/Project');
const { isProjectMember } = require('../utils/projectAccess');

const hashKey = (raw) => crypto.createHash('sha256').update(raw, 'utf8').digest('hex');

/**
 * Sets req.exportContext = { projectId, userId?, fromApiKey: boolean }
 * Requires query.projectId (or body) — caller validates match for API key.
 */
const exportAuth = async (req, res, next) => {
    const projectId = req.query.projectId || req.body?.projectId;
    if (!projectId) {
        return res.status(400).json({ message: 'projectId is required.' });
    }

    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader) {
        const keyHash = hashKey(apiKeyHeader);
        const record = await ApiKey.findOne({ keyHash, projectId }).lean();
        if (!record) {
            return res.status(401).json({ message: 'Invalid API key for this project.' });
        }
        if (!record.scopes.includes('export:read')) {
            return res.status(403).json({ message: 'API key missing export:read scope.' });
        }
        await ApiKey.updateOne({ _id: record._id }, { $set: { lastUsedAt: new Date() } });
        req.exportContext = { projectId: record.projectId.toString(), fromApiKey: true };
        return next();
    }

    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token or API key, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        const project = await Project.findById(projectId);
        if (!project || !isProjectMember(project, decoded.id)) {
            return res.status(403).json({ message: 'Not authorized for this project.' });
        }
        req.exportContext = { projectId, userId: decoded.id, fromApiKey: false };
        return next();
    } catch {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { exportAuth, hashKey };
