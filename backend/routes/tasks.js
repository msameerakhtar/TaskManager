const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

// Sabhi routes authMiddleware use karenge (Protected)
router.use(authMiddleware);

// @route   GET api/tasks
// @desc    Get all tasks for logged in user
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Create a new task
router.post('/', async (req, res) => {
    const { title, description, status } = req.body;

    try {
        const newTask = new Task({
            userId: req.user.id,
            title,
            description,
            status
        });

        const task = await newTask.save();
        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update a task
router.put('/:id', async (req, res) => {
    const { title, description, status } = req.body;

    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Check user ownership
        if (task.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: { title, description, status } },
            { new: true }
        );

        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Check user ownership
        if (task.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
