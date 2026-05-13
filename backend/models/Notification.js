const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    type: {
        type: String,
        enum: ['due_soon', 'approval_request', 'sla_escalation', 'sla_breach'],
        default: 'due_soon'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ taskId: 1, type: 1, createdAt: -1 });

notificationSchema.post('save', function(doc) {
    if (global.io) {
        global.io.to(`user:${doc.userId}`).emit('notification:new', doc);
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
