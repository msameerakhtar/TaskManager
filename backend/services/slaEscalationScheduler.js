const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendSlackWebhook, sendProjectEmail } = require('./integrationService');

const HOUR_MS = 60 * 60 * 1000;

const notifyUser = async (userId, task, type, title, message) => {
    if (!userId) return;
    await Notification.create({
        userId,
        taskId: task._id,
        type,
        title,
        message
    });
};

const runSlaEscalationJob = async () => {
    const projects = await Project.find({ 'enterprise.sla.enabled': true }).lean();
    for (const project of projects) {
        const ent = project.enterprise || {};
        const sla = ent.sla || {};
        const hoursAfterDue = Number(sla.escalateHoursAfterDue) || 24;
        const repeatHours = Number(sla.repeatEscalationHours) || 24;
        const now = Date.now();

        const overdueTasks = await Task.find({
            projectId: project._id,
            status: { $ne: 'done' },
            dueDate: { $lt: new Date(now - hoursAfterDue * HOUR_MS) }
        });

        const adminMembers = (project.members || []).filter((m) => m.role === 'admin');
        const adminIds = adminMembers.map((m) => m.userId.toString());
        const slackUrl = ent.integrations?.slackWebhookUrl || '';
        const emailAdmins = !!ent.integrations?.emailAlertsToAdmins;

        let adminEmails = [];
        if (emailAdmins && adminIds.length) {
            const admins = await User.find({ _id: { $in: adminIds } }).select('email').lean();
            adminEmails = admins.map((u) => u.email).filter(Boolean);
        }

        for (const task of overdueTasks) {
            const due = new Date(task.dueDate).getTime();
            if (now - due < hoursAfterDue * HOUR_MS) continue;

            const lastEsc = task.lastEscalationAt ? new Date(task.lastEscalationAt).getTime() : 0;
            if (lastEsc && now - lastEsc < repeatHours * HOUR_MS) continue;

            task.escalationLevel = (task.escalationLevel || 0) + 1;
            task.lastEscalationAt = new Date();
            if (!task.slaBreachedAt) task.slaBreachedAt = new Date();
            await task.save();

            const title = 'SLA escalation';
            const message = `"${task.title}" is overdue (level ${task.escalationLevel}). Project: ${project.name}`;

            const targets = new Set();
            if (task.assigneeId) targets.add(task.assigneeId.toString());
            targets.add(task.userId.toString());
            adminIds.forEach((id) => targets.add(id));

            for (const uid of targets) {
                await notifyUser(uid, task, 'sla_escalation', title, message);
            }

            if (slackUrl) {
                await sendSlackWebhook(slackUrl, `*${title}*\n${message}`).catch(() => {});
            }
            if (adminEmails.length) {
                for (const to of adminEmails) {
                    await sendProjectEmail({
                        to,
                        subject: `[${project.name}] ${title}`,
                        text: message
                    }).catch(() => {});
                }
            }
        }
    }
};

module.exports = { runSlaEscalationJob };
