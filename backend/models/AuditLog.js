const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
        index: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    entityType: {
        type: String,
        required: true,
        enum: ['task', 'project', 'approval', 'member', 'integration', 'api_key']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    action: {
        type: String,
        required: true
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip: {
        type: String,
        default: ''
    }
}, { timestamps: true });

auditLogSchema.index({ projectId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
