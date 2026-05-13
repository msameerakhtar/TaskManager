const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: {
        type: [projectMemberSchema],
        default: []
    },
    workflowStatuses: {
        type: [String],
        default: ['todo', 'in_progress', 'done']
    },
    enterprise: {
        requireApprovalForCompletion: { type: Boolean, default: false },
        sla: {
            enabled: { type: Boolean, default: false },
            escalateHoursAfterDue: { type: Number, default: 24, min: 1, max: 720 },
            repeatEscalationHours: { type: Number, default: 24, min: 1, max: 720 }
        },
        integrations: {
            slackWebhookUrl: { type: String, default: '', trim: true },
            emailAlertsToAdmins: { type: Boolean, default: false }
        }
    }
}, { timestamps: true });

projectSchema.index({ ownerId: 1, createdAt: -1 });
projectSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Project', projectSchema);
