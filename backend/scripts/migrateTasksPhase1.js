const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');

dotenv.config();

const normalizeStatus = (status) => {
    if (status === 'pendiente') return 'todo';
    if (status === 'completada') return 'done';
    if (['todo', 'in_progress', 'done'].includes(status)) return status;
    return 'todo';
};

const normalizePriority = (priority) => {
    if (['low', 'medium', 'high'].includes(priority)) return priority;
    return 'medium';
};

const getFallbackDueDate = (task) => {
    if (task.createdAt) {
        const fallback = new Date(task.createdAt);
        fallback.setDate(fallback.getDate() + 7);
        return fallback;
    }
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
};

const runMigration = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing in environment.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for task migration.');

    const tasks = await Task.find({});
    let updatedCount = 0;

    for (const task of tasks) {
        let shouldUpdate = false;

        const nextStatus = normalizeStatus(task.status);
        if (nextStatus !== task.status) {
            task.status = nextStatus;
            shouldUpdate = true;
        }

        const nextPriority = normalizePriority(task.priority);
        if (nextPriority !== task.priority) {
            task.priority = nextPriority;
            shouldUpdate = true;
        }

        if (!task.dueDate || Number.isNaN(new Date(task.dueDate).getTime())) {
            task.dueDate = getFallbackDueDate(task);
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            await task.save();
            updatedCount += 1;
        }
    }

    console.log(`Migration complete. Updated tasks: ${updatedCount}/${tasks.length}`);
    await mongoose.disconnect();
};

runMigration()
    .then(() => {
        process.exit(0);
    })
    .catch(async (error) => {
        console.error('Task migration failed:', error.message);
        try {
            await mongoose.disconnect();
        } catch {
            // Ignore disconnect errors in failure path.
        }
        process.exit(1);
    });
