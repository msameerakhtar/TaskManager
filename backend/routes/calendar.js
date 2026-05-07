const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { isProjectMember } = require('../utils/projectAccess');

router.use(authMiddleware);

const formatIcsDate = (date) => {
    const d = new Date(date);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
};

router.get('/project/:projectId.ics', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tasks = await Task.find({ projectId: project._id, dueDate: { $exists: true } }).lean();
        const events = tasks.map((task) => {
            const dueDate = new Date(task.dueDate);
            const endDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
            return [
                'BEGIN:VEVENT',
                `UID:task-${task._id}@taskmanager`,
                `DTSTAMP:${formatIcsDate(new Date())}`,
                `DTSTART:${formatIcsDate(dueDate)}`,
                `DTEND:${formatIcsDate(endDate)}`,
                `SUMMARY:${(task.title || 'Task').replace(/,/g, '\\,')}`,
                `DESCRIPTION:${(task.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
                'END:VEVENT'
            ].join('\r\n');
        });

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//TaskManager//EN',
            ...events,
            'END:VCALENDAR'
        ].join('\r\n');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}.ics"`);
        res.send(ics);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.get('/project/:projectId/links', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const token = req.header('x-auth-token');
    const icsUrl = `${baseUrl}/api/calendar/project/${req.params.projectId}.ics?token=${token}`;
    const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(icsUrl)}`;
    const outlookCalendarUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(icsUrl)}&name=${encodeURIComponent('TaskManager Project Calendar')}`;
    res.json({ icsUrl, googleCalendarUrl, outlookCalendarUrl });
});

module.exports = router;
