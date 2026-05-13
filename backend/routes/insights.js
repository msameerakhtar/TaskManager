const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { isProjectMember } = require('../utils/projectAccess');

router.use(authMiddleware);

router.get('/workload/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate('members.userId', 'fullName email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tasks = await Task.find({ projectId: project._id, status: { $ne: 'done' } }).lean();
        const now = new Date();

        const workload = project.members.map((member) => {
            const userDoc = member.userId;
            const memberId = userDoc?._id ?? userDoc;
            if (!memberId) {
                return {
                    userId: null,
                    name: 'Unknown member',
                    role: member.role || 'member',
                    activeTasks: 0,
                    estimatedHours: 0,
                    overdueCount: 0,
                    overloaded: false
                };
            }
            const memberIdStr = memberId.toString();
            const assigned = tasks.filter((t) => t.assigneeId && t.assigneeId.toString() === memberIdStr);
            const estimatedHours = assigned.reduce((sum, t) => sum + (Number(t.estimatedHours) || 2), 0);
            const overdueCount = assigned.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
            const name = userDoc.fullName || userDoc.email || 'Member';
            return {
                userId: memberId,
                name,
                role: member.role,
                activeTasks: assigned.length,
                estimatedHours,
                overdueCount,
                overloaded: estimatedHours > 30 || overdueCount > 3
            };
        });
        res.json({ workload });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

router.get('/productivity/:projectId', async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const tasks = await Task.find({ projectId: project._id }).lean();
        const now = new Date();
        const completedTasks = tasks.filter((t) => t.status === 'done' && t.completedAt);
        const overdueTasks = tasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now);
        const avgCompletionHours = completedTasks.length
            ? Math.round(
                completedTasks.reduce((sum, t) => {
                    const started = new Date(t.createdAt).getTime();
                    const completed = new Date(t.completedAt).getTime();
                    return sum + (completed - started) / (1000 * 60 * 60);
                }, 0) / completedTasks.length
            )
            : 0;

        const trendDays = 7;
        const completionTrend = Array.from({ length: trendDays }).map((_, idx) => {
            const date = new Date();
            date.setDate(date.getDate() - (trendDays - idx - 1));
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const count = completedTasks.filter((t) => {
                const completedAt = new Date(t.completedAt);
                return completedAt >= start && completedAt < end;
            }).length;
            return { date: start.toISOString().slice(0, 10), completed: count };
        });

        res.json({
            summary: {
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                overdueTasks: overdueTasks.length,
                avgCompletionHours
            },
            completionTrend
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
