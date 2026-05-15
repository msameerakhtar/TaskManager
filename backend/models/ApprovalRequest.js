const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['completion', 'deletion'],
        default: 'completion'
    },
    comment: {
        type: String,
        default: ''
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

approvalRequestSchema.index({ projectId: 1, status: 1, createdAt: -1 });
approvalRequestSchema.index({ taskId: 1, status: 1 });

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
