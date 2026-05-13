const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { runSlaEscalationJob } = require('./slaEscalationScheduler');

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
        await Notification.create({
            userId: task.userId,
            taskId: task._id,
            type: 'due_soon',
            title: 'Task Due Soon',
            message: `"${task.title}" is due within 24 hours.`
        });

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
