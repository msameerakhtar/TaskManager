const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        required: true
    },
    estimatedHours: {
        type: Number,
        default: 2,
        min: 0.5,
        max: 200
    },
    completedAt: {
        type: Date,
        default: null
    },
    recurrence: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: undefined
        }
    },
    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    labels: [{
        text: { type: String, required: true },
        color: { type: String, default: '#e0e0e0' }
    }],
    notes: [{
        content: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    subtasks: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        isCompleted: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    activityLog: [{
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        action: {
            type: String,
            required: true
        },
        detail: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [{
        originalName: String,
        fileName: String,
        filePath: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    reminder: {
        dueSoonSentAt: {
            type: Date,
            default: null
        }
    },
    approvalStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    deletionStatus: {
        type: String,
        enum: ['none', 'pending', 'rejected'],
        default: 'none'
    },
    slaBreachedAt: {
        type: Date,
        default: null
    },
    escalationLevel: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    lastEscalationAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

taskSchema.index({ userId: 1, status: 1, dueDate: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ projectId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
