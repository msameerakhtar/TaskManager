const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { runSlaEscalationJob } = require('./slaEscalationScheduler');
const { sendProjectEmail } = require('./integrationService');

const DUE_WINDOW_HOURS = 24;

const runDueSoonReminderJob = async () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + DUE_WINDOW_HOURS * 60 * 60 * 1000);

    const dueSoonTasks = await Task.find({
        status: { $ne: 'done' },
        dueDate: { $gte: now, $lte: cutoff },
        $or: [
            { 'reminder.dueSoonSentAt': null },
            { 'reminder.dueSoonSentAt': { $exists: false } }
        ]
    });

    for (const task of dueSoonTasks) {
        // In-app notification to task creator
        await Notification.create({
            userId: task.userId,
            taskId: task._id,
            type: 'due_soon',
            title: 'Task Due Soon',
            message: `"${task.title}" is due within 24 hours.`
        });
        // Note: Notification model's post('save') hook auto-emits 'notification:new' to user:${task.userId}

        // Email reminder to assignee (if assigned), otherwise to creator
        const emailTargetId = task.assigneeId || task.userId;
        const assignee = await User.findById(emailTargetId).select('email fullName').lean();

        if (assignee && assignee.email) {
            await sendProjectEmail({
                to: assignee.email,
                subject: `Task Manager — Reminder: "${task.title}" is due tomorrow`,
                text: `Hi ${assignee.fullName || 'there'},\n\nThis is a friendly reminder that your task is due within 24 hours.\n\nTask: "${task.title}"\nDue Date: ${new Date(task.dueDate).toDateString()}\n\nPlease log in to Task Manager to update your progress.\n\nBest regards,\nTask Manager Team`
            }).catch(err => console.error('[Email] Due-soon reminder failed:', err));
        }

        task.reminder = { ...(task.reminder || {}), dueSoonSentAt: new Date() };
        await task.save();
    }
};

const startReminderScheduler = () => {
    // Runs every 15 minutes.
    cron.schedule('*/15 * * * *', async () => {
        try {
            await runDueSoonReminderJob();
        } catch (error) {
            console.error('Reminder job failed:', error.message);
        }
    });

    cron.schedule('0 * * * *', async () => {
        try {
            await runSlaEscalationJob();
        } catch (error) {
            console.error('SLA escalation job failed:', error.message);
        }
    });
};

module.exports = { startReminderScheduler, runDueSoonReminderJob };
