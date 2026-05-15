const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Middleware to ensure user is superadmin
const superAdminMiddleware = (req, res, next) => {
    if (req.user && req.user.systemRole === 'superadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }
};

router.use(authMiddleware);
router.use(superAdminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const projectsCount = await Project.countDocuments();
        const tasksCount = await Task.countDocuments();
        res.json({ usersCount, projectsCount, tasksCount });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// GET /api/admin/chart-data
router.get('/chart-data', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Aggregate Users Growth
        const usersGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Aggregate Projects Growth
        const projectsGrowth = await Project.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Aggregate Tasks Status
        const tasksStatus = await Task.aggregate([
            { $group: {
                _id: "$status",
                count: { $sum: 1 }
            }}
        ]);

        // Format Growth Data into a uniform array of last 6 months
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let growthData = [];
        let currDate = new Date(sixMonthsAgo);
        for(let i = 0; i < 6; i++) {
            const m = currDate.getMonth() + 1;
            const y = currDate.getFullYear();
            
            const uMatch = usersGrowth.find(g => g._id.month === m && g._id.year === y);
            const pMatch = projectsGrowth.find(g => g._id.month === m && g._id.year === y);
            
            growthData.push({
                name: `${monthNames[m-1]} ${y.toString().slice(-2)}`,
                Users: uMatch ? uMatch.count : 0,
                Workspaces: pMatch ? pMatch.count : 0
            });
            currDate.setMonth(currDate.getMonth() + 1);
        }

        // Format Task Status Data
        const statuses = ['todo', 'in-progress', 'done'];
        const taskData = statuses.map(s => {
            const match = tasksStatus.find(t => t._id === s);
            return {
                name: s === 'todo' ? 'To Do' : s === 'in-progress' ? 'In Progress' : 'Done',
                value: match ? match.count : 0
            };
        });

        res.json({ growthData, taskData });
    } catch (error) {
        console.error('Chart Data Error:', error);
        res.status(500).send('Server Error');
    }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
        res.json(users);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', async (req, res) => {
    try {
        const userToSuspend = await User.findById(req.params.id);
        if (!userToSuspend) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (userToSuspend.systemRole === 'superadmin') {
            return res.status(400).json({ message: 'Cannot suspend a superadmin' });
        }
        
        userToSuspend.isSuspended = !userToSuspend.isSuspended;
        await userToSuspend.save();
        
        if (req.app.get('io')) {
            req.app.get('io').to('room:superadmin').emit('user:updated');
            // If suspending, we can optionally emit to the user to force logout
            if (userToSuspend.isSuspended) {
                req.app.get('io').to(`user:${userToSuspend._id}`).emit('user:suspended');
            }
        }
        
        res.json({ message: userToSuspend.isSuspended ? 'User suspended successfully' : 'User unblocked successfully', isSuspended: userToSuspend.isSuspended });
    } catch (error) {
        console.error('Suspend Error:', error);
        res.status(500).send('Server Error');
    }
});

// GET /api/admin/workspaces
router.get('/workspaces', async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('ownerId', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();
        res.json(projects);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// DELETE /api/admin/workspaces/:id
router.delete('/workspaces/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        
        await Task.deleteMany({ projectId: project._id });
        await Project.findByIdAndDelete(project._id);

        if (req.app.get('io')) {
            req.app.get('io').to(`project:${project._id}`).emit('project:updated', { projectId: project._id, deleted: true });
            req.app.get('io').to('room:superadmin').emit('project:deleted', { projectId: project._id });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
