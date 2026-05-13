const AuditLog = require('../models/AuditLog');

const logAudit = async ({
    actorId,
    projectId = null,
    entityType,
    entityId = null,
    action,
    meta = {},
    ip = ''
}) => {
    try {
        await AuditLog.create({
            actorId,
            projectId,
            entityType,
            entityId,
            action,
            meta,
            ip: typeof ip === 'string' ? ip.slice(0, 64) : ''
        });
    } catch (err) {
        console.error('Audit log failed:', err.message);
    }
};

module.exports = { logAudit };
