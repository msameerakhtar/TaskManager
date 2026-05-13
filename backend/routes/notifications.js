const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

router.use(authMiddleware);

// @route GET /api/notifications
router.get('/', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const skip = (page - 1) * limit;
        const query = { userId: req.user.id };

        const [rawNotifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({ path: 'taskId', select: 'projectId' })
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ ...query, isRead: false })
        ]);

        const notifications = rawNotifications.map((n) => {
            const taskDoc = n.taskId && typeof n.taskId === 'object' && n.taskId._id
                ? n.taskId
                : null;
            return {
                ...n,
                taskId: taskDoc ? taskDoc._id : (n.taskId || null),
                projectId: taskDoc?.projectId ? taskDoc.projectId.toString() : null
            };
        });

        const hasMore = skip + notifications.length < total;
        res.json({
            notifications,
            meta: {
                page,
                limit,
                total,
                unreadCount,
                hasMore
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        if (notification.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();
        res.json(notification);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ updatedCount: result.modifiedCount || 0 });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
