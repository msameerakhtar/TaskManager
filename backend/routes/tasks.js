const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const Project = require('../models/Project');
const User = require('../models/User');
const ApprovalRequest = require('../models/ApprovalRequest');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const { logAudit } = require('../services/auditService');
const { sendSlackWebhook, sendProjectEmail } = require('../services/integrationService');
const { isProjectMember, memberUserIdString } = require('../utils/projectAccess');

// Sabhi routes authMiddleware use karenge (Protected)
router.use(authMiddleware);

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_RECURRENCE = ['daily', 'weekly', 'monthly'];
const DAILY_CAPACITY_HOURS = 6;

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage Engine for Cloudinary (Auto-resource type supports PDFs, Images, DOCX, ZIPs)
const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'taskmanager-attachments',
        resource_type: 'auto', // Supports raw files like PDFs, ZIPs, DOCX, and images
    },
});

const upload = multer({
    storage: cloudStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const getNextRecurringDate = (dueDate, frequency) => {
    if (frequency === 'daily') return addDays(dueDate, 1);
    if (frequency === 'weekly') return addDays(dueDate, 7);
    if (frequency === 'monthly') {
        const d = new Date(dueDate);
        d.setMonth(d.getMonth() + 1);
        return d;
    }
    return null;
};

const getProjectRole = (project, userId) => {
    const uid = String(userId);
    if (project.ownerId && String(project.ownerId) === uid) return 'admin';
    const member = project.members.find((m) => memberUserIdString(m) === uid);
    return member ? member.role : null;
};

const suggestPriority = ({ dueDate, estimatedHours = 2, currentLoad = 0 }) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysLeft = Math.max(Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const pressureScore = (estimatedHours + currentLoad) / DAILY_CAPACITY_HOURS;

    if (daysLeft <= 1 || pressureScore >= 3) return 'high';
    if (daysLeft <= 3 || pressureScore >= 1.5) return 'medium';
    return 'low';
};

const suggestDeadline = ({ dueDate, estimatedHours = 2, bookedHours = 0 }) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.max(Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 1);
    const availableHours = daysUntilDue * DAILY_CAPACITY_HOURS;
    const requiredHours = bookedHours + estimatedHours;

    if (requiredHours <= availableHours) {
        return { feasible: true, suggestedDueDate: due, extraDays: 0 };
    }

    const extraDays = Math.ceil((requiredHours - availableHours) / DAILY_CAPACITY_HOURS);
    const suggestedDueDate = addDays(due, extraDays);
    return { feasible: false, suggestedDueDate, extraDays };
};

const emitProjectTaskEvent = (req, projectId, action, task) => {
    const io = req.app.get('io');
    if (!io || !projectId) return;
    io.to(`project:${projectId}`).emit('task:changed', {
        action,
        projectId: projectId.toString(),
        taskId: task?._id?.toString() || task?.id || null
    });
    io.to('room:superadmin').emit('task:changed'); // Global event for Super Admin charts
};

const normalizeStatus = (status) => {
    if (!status) return undefined;
    if (status === 'pendiente') return 'todo';
    if (status === 'completada') return 'done';
    return status;
};

const validateTaskPayload = async (payload, userId, isUpdate = false) => {
    const errors = [];
    const normalizedStatus = normalizeStatus(payload.status);
    const taskData = {};
    let project = null;
    const shouldAutoPriority = payload.autoPriority === true;

    if (!isUpdate || payload.projectId !== undefined) {
        if (!payload.projectId) {
            errors.push('Project is required.');
        } else {
            project = await Project.findById(payload.projectId);
            if (!project) {
                errors.push('Project not found.');
            } else if (!isProjectMember(project, userId)) {
                errors.push('You are not a member of the selected project.');
            } else {
                taskData.projectId = project._id;
            }
        }
    }

    if (!isUpdate || payload.assigneeId !== undefined) {
        if (!payload.assigneeId) {
            taskData.assigneeId = null;
        } else if (!project && !payload.projectId) {
            const assignee = await User.findById(payload.assigneeId);
            if (!assignee) {
                errors.push('Assignee not found.');
            } else {
                taskData.assigneeId = assignee._id;
            }
        } else if (project) {
            const inProject = project.members.some((m) => m.userId.toString() === payload.assigneeId);
            if (!inProject) {
                errors.push('Assignee must be a member of the selected project.');
            } else {
                taskData.assigneeId = payload.assigneeId;
            }
        }
    }

    if (!isUpdate || payload.title !== undefined) {
        if (!payload.title || !payload.title.trim()) {
            errors.push('Title is required.');
        } else {
            taskData.title = payload.title.trim();
        }
    }

    if (!isUpdate || payload.description !== undefined) {
        taskData.description = payload.description ? payload.description.trim() : '';
    }

    if (!isUpdate || payload.status !== undefined) {
        if (!normalizedStatus || !VALID_STATUSES.includes(normalizedStatus)) {
            errors.push('Status must be one of: todo, in_progress, done.');
        } else {
            taskData.status = normalizedStatus;
        }
    }

    if (!isUpdate || payload.priority !== undefined) {
        if (shouldAutoPriority && !payload.priority) {
            // Priority will be auto-suggested after load analysis.
        } else if (!payload.priority || !VALID_PRIORITIES.includes(payload.priority)) {
            errors.push('Priority must be one of: low, medium, high.');
        } else {
            taskData.priority = payload.priority;
        }
    }

    if (!isUpdate || payload.estimatedHours !== undefined) {
        const hours = Number(payload.estimatedHours);
        if (Number.isNaN(hours) || hours <= 0) {
            errors.push('Estimated hours must be a positive number.');
        } else {
            taskData.estimatedHours = hours;
        }
    }

    if (!isUpdate || payload.dueDate !== undefined) {
        if (!payload.dueDate) {
            errors.push('Due date is required.');
        } else {
            const parsedDate = new Date(payload.dueDate);
            if (Number.isNaN(parsedDate.getTime())) {
                errors.push('Due date must be a valid date.');
            } else {
                taskData.dueDate = parsedDate;
            }
        }
    }

    if (!isUpdate || payload.recurrence !== undefined) {
        const recurrence = payload.recurrence || { enabled: false };
        if (recurrence.enabled) {
            if (!recurrence.frequency || !VALID_RECURRENCE.includes(recurrence.frequency)) {
                errors.push('Recurrence frequency must be one of: daily, weekly, monthly.');
            } else {
                taskData.recurrence = { enabled: true, frequency: recurrence.frequency };
            }
        } else {
            taskData.recurrence = { enabled: false };
        }
    }

    if (!isUpdate || payload.notes !== undefined) {
        if (payload.notes === undefined) {
            // no-op
        } else if (!Array.isArray(payload.notes)) {
            errors.push('Notes must be an array.');
        } else {
            const sanitizedNotes = payload.notes
                .map((note) => ({
                    content: typeof note.content === 'string' ? note.content.trim() : '',
                    createdAt: note.createdAt ? new Date(note.createdAt) : new Date()
                }))
                .filter((note) => note.content);
            taskData.notes = sanitizedNotes;
        }
    }

    if (!isUpdate || payload.subtasks !== undefined) {
        if (payload.subtasks === undefined) {
            // no-op
        } else if (!Array.isArray(payload.subtasks)) {
            errors.push('Subtasks must be an array.');
        } else {
            const sanitizedSubtasks = payload.subtasks
                .map((st) => ({
                    title: typeof st.title === 'string' ? st.title.trim() : '',
                    isCompleted: !!st.isCompleted,
                    createdAt: st.createdAt ? new Date(st.createdAt) : new Date(),
                    _id: st._id || undefined
                }))
                .filter((st) => st.title);
            taskData.subtasks = sanitizedSubtasks;
        }
    }

    if (!isUpdate || payload.blockedBy !== undefined) {
        if (payload.blockedBy === undefined) {
            // no-op
        } else if (!Array.isArray(payload.blockedBy)) {
            errors.push('BlockedBy must be an array of task IDs.');
        } else {
            taskData.blockedBy = payload.blockedBy;
        }
    }

    if (!isUpdate || payload.labels !== undefined) {
        if (payload.labels === undefined) {
            // no-op
        } else if (!Array.isArray(payload.labels)) {
            errors.push('Labels must be an array.');
        } else {
            const sanitizedLabels = payload.labels
                .map(lbl => ({
                    text: typeof lbl.text === 'string' ? lbl.text.trim() : '',
                    color: typeof lbl.color === 'string' ? lbl.color.trim() : '#e0e0e0'
                }))
                .filter(lbl => lbl.text);
            taskData.labels = sanitizedLabels;
        }
    }

    return { errors, taskData };
};

// @route   GET api/tasks
// @desc    Get all tasks for logged in user
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
        const query = {};
        if (req.query.projectId) {
            const project = await Project.findById(req.query.projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });
            if (!isProjectMember(project, req.user.id)) {
                return res.status(403).json({ message: 'Not authorized for this project.' });
            }
            query.projectId = project._id;
        } else {
            const projects = await Project.find({ 'members.userId': req.user.id }).select('_id').lean();
            query.projectId = { $in: projects.map((p) => p._id) };
        }
        const tasks = await Task.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('assigneeId', 'fullName email')
            .populate('comments.userId', 'fullName email')
            .populate('activityLog.actorId', 'fullName email')
            .populate('blockedBy', 'title status')
            .lean();
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks
// @desc    Create a new task
router.post('/', async (req, res) => {
    const { errors, taskData } = await validateTaskPayload(req.body, req.user.id);
    if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(' ') });
    }

    try {
        const { hasPermission } = require('../utils/rbac');
        const project = await Project.findById(taskData.projectId);
        const allowed = await hasPermission(project, req.user.id, 'tasks:create');
        if (!allowed) {
            return res.status(403).json({ message: 'You do not have permission to create tasks in this project.' });
        }

        if (req.body.autoPriority === true && !taskData.priority) {
            const openTasks = await Task.find({
                projectId: taskData.projectId,
                assigneeId: taskData.assigneeId || null,
                status: { $ne: 'done' }
            }).lean();
            const bookedHours = openTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 2), 0);
            taskData.priority = suggestPriority({
                dueDate: taskData.dueDate,
                estimatedHours: taskData.estimatedHours || 2,
                currentLoad: bookedHours
            });
        }

        const newTask = new Task({
            userId: req.user.id,
            ...taskData,
            activityLog: [{
                actorId: req.user.id,
                action: 'created',
                detail: 'Task created'
            }]
        });

        const task = await newTask.save();
        emitProjectTaskEvent(req, task.projectId, 'created', task);
        await logAudit({
            actorId: req.user.id,
            projectId: task.projectId,
            entityType: 'task',
            entityId: task._id,
            action: 'created',
            meta: { title: task.title },
            ip: req.ip
        });

        // Email: Task Assigned — only if assignee is someone else (not creator)
        if (task.assigneeId && task.assigneeId.toString() !== req.user.id.toString()) {
            const [assignee, creator] = await Promise.all([
                User.findById(task.assigneeId).select('email fullName').lean(),
                User.findById(req.user.id).select('fullName').lean()
            ]);
            if (assignee && assignee.email) {
                sendProjectEmail({
                    to: assignee.email,
                    subject: `Task Manager — New Task Assigned: "${task.title}"`,
                    text: `Hi ${assignee.fullName || 'there'},\n\nA new task has been assigned to you by ${creator?.fullName || 'an admin'}.\n\nTask: "${task.title}"\nPriority: ${task.priority}\nDue Date: ${new Date(task.dueDate).toDateString()}\n\nPlease log in to Task Manager to view the details.\n\nBest regards,\nTask Manager Team`
                }).catch(err => console.error('[Email] Task assigned failed:', err));
            }
        }

        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update a task
router.put('/:id', async (req, res) => {
    const { errors, taskData } = await validateTaskPayload(req.body, req.user.id, true);
    if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(' ') });
    }

    try {
        let task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { hasPermission } = require('../utils/rbac');
        const allowed = await hasPermission(project, req.user.id, 'tasks:edit');
        if (!allowed) {
            return res.status(403).json({ message: 'You do not have permission to edit tasks in this project.' });
        }

        const previousStatus = task.status;
        const previousAssigneeId = task.assigneeId;  // Track old assignee for re-assign email
        const previousBlockedByIds = [...(task.blockedBy || [])]; // Track old blocked-by for task blocked email
        const wantsDone = taskData.status === 'done' && previousStatus !== 'done';
        const requireApproval = !!(project.enterprise && project.enterprise.requireApprovalForCompletion);
        
        // Prevent marking as done if there are incomplete dependencies
        if (wantsDone && task.blockedBy && task.blockedBy.length > 0) {
            const incompleteDependencies = await Task.find({
                _id: { $in: task.blockedBy },
                status: { $ne: 'done' }
            }).select('title').lean();
            
            if (incompleteDependencies.length > 0) {
                const depNames = incompleteDependencies.map(t => `"${t.title}"`).join(', ');
                return res.status(400).json({ 
                    message: `Cannot mark as done. This task is blocked by: ${depNames}. Please complete them first.` 
                });
            }
        }

        if (wantsDone && requireApproval) {
            delete taskData.status;
        }

        if (req.body.autoPriority === true && !taskData.priority && taskData.dueDate) {
            const openTasks = await Task.find({
                projectId: task.projectId,
                assigneeId: taskData.assigneeId || task.assigneeId || null,
                status: { $ne: 'done' },
                _id: { $ne: task._id }
            }).lean();
            const bookedHours = openTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 2), 0);
            taskData.priority = suggestPriority({
                dueDate: taskData.dueDate,
                estimatedHours: taskData.estimatedHours || task.estimatedHours || 2,
                currentLoad: bookedHours
            });
        }

        Object.assign(task, taskData);
        if (task.status === 'done' && !task.completedAt) {
            task.completedAt = new Date();
        } else if (task.status !== 'done') {
            task.completedAt = null;
        }

        if (wantsDone && requireApproval && task.status !== 'done') {
            const existing = await ApprovalRequest.findOne({ taskId: task._id, status: 'pending' });
            if (!existing) {
                await ApprovalRequest.create({
                    projectId: task.projectId,
                    taskId: task._id,
                    requestedBy: req.user.id
                });
            }
            task.approvalStatus = 'pending';
            task.activityLog.push({
                actorId: req.user.id,
                action: 'completion_requested',
                detail: 'Completion pending admin approval'
            });
            await task.save();

            const adminMembers = project.members.filter((m) => m.role === 'admin');
            const io = req.app.get('io');
            for (const m of adminMembers) {
                await Notification.create({
                    userId: m.userId,
                    taskId: task._id,
                    type: 'approval_request',
                    title: 'Approval required',
                    message: `Task "${task.title}" needs approval to mark done.`
                });
                // Note: Notification model's post('save') hook auto-emits 'notification:new'
            }
            const slackUrl = project.enterprise?.integrations?.slackWebhookUrl;
            if (slackUrl) {
                await sendSlackWebhook(slackUrl, `Approval required: "${task.title}" (project: ${project.name})`).catch(() => {});
            }

            await logAudit({
                actorId: req.user.id,
                projectId: task.projectId,
                entityType: 'approval',
                entityId: task._id,
                action: 'requested',
                meta: { title: task.title },
                ip: req.ip
            });

            emitProjectTaskEvent(req, task.projectId, 'updated', task);
            const payload = task.toObject();
            return res.json({ ...payload, requiresApproval: true });
        }

        if (previousStatus === 'done' && task.status !== 'done') {
            task.approvalStatus = 'none';
        }
        if (task.status === 'done' && previousStatus !== 'done' && !requireApproval) {
            task.approvalStatus = 'none';
        }

        task.activityLog.push({
            actorId: req.user.id,
            action: 'updated',
            detail: 'Task updated'
        });
        await task.save();

        await logAudit({
            actorId: req.user.id,
            projectId: task.projectId,
            entityType: 'task',
            entityId: task._id,
            action: 'updated',
            meta: { status: task.status, title: task.title },
            ip: req.ip
        });

        // Email: Assignee changed (Re-assigned or Removed)
        if (taskData.assigneeId !== undefined) {
            const oldAssigneeId = previousAssigneeId ? previousAssigneeId.toString() : null;
            const newAssigneeId = task.assigneeId ? task.assigneeId.toString() : null;
            const actorId = req.user.id.toString();

            // New assignee is different from old one
            if (newAssigneeId && newAssigneeId !== oldAssigneeId && newAssigneeId !== actorId) {
                const [newAssignee, actor] = await Promise.all([
                    User.findById(newAssigneeId).select('email fullName').lean(),
                    User.findById(actorId).select('fullName').lean()
                ]);
                if (newAssignee && newAssignee.email) {
                    sendProjectEmail({
                        to: newAssignee.email,
                        subject: `Task Manager — Task Re-assigned to You: "${task.title}"`,
                        text: `Hi ${newAssignee.fullName || 'there'},\n\nThe task "${task.title}" has been assigned to you by ${actor?.fullName || 'an admin'}.\n\nPriority: ${task.priority}\nDue Date: ${new Date(task.dueDate).toDateString()}\n\nPlease log in to Task Manager to view the details.\n\nBest regards,\nTask Manager Team`
                    }).catch(err => console.error('[Email] Re-assign email failed:', err));
                }
            }

            // Old assignee was removed (unassigned)
            if (oldAssigneeId && !newAssigneeId && oldAssigneeId !== actorId) {
                const [oldAssignee, actor] = await Promise.all([
                    User.findById(oldAssigneeId).select('email fullName').lean(),
                    User.findById(actorId).select('fullName').lean()
                ]);
                if (oldAssignee && oldAssignee.email) {
                    sendProjectEmail({
                        to: oldAssignee.email,
                        subject: `Task Manager — You have been unassigned from: "${task.title}"`,
                        text: `Hi ${oldAssignee.fullName || 'there'},\n\nYou have been removed from the task "${task.title}" by ${actor?.fullName || 'an admin'}.\n\nBest regards,\nTask Manager Team`
                    }).catch(err => console.error('[Email] Unassign email failed:', err));
                }
            }
        }

        // Email: Task Completed — notify task creator/admin when task marked as done
        if (previousStatus !== 'done' && task.status === 'done' && !requireApproval) {
            const creatorId = task.userId ? task.userId.toString() : null;
            const actorId = req.user.id.toString();
            // Only notify if someone else (not the creator themselves) completed it
            if (creatorId && creatorId !== actorId) {
                const [creator, completer] = await Promise.all([
                    User.findById(creatorId).select('email fullName').lean(),
                    User.findById(actorId).select('fullName').lean()
                ]);
                if (creator && creator.email) {
                    sendProjectEmail({
                        to: creator.email,
                        subject: `Task Manager — Task Completed: "${task.title}"`,
                        text: `Hi ${creator.fullName || 'there'},\n\nGreat news! The task "${task.title}" has been marked as completed by ${completer?.fullName || 'a team member'}.\n\nCompleted On: ${new Date().toDateString()}\n\nPlease log in to Task Manager to review the work.\n\nBest regards,\nTask Manager Team`
                    }).catch(err => console.error('[Email] Task completed email failed:', err));
                }
            }

            // Also notify all project admins (excluding the actor)
            const adminMembers = project.members.filter(m => m.role === 'admin' && m.userId.toString() !== actorId);
            if (adminMembers.length > 0) {
                const adminUsers = await User.find({
                    _id: { $in: adminMembers.map(m => m.userId) }
                }).select('email fullName').lean();

                const completer = await User.findById(actorId).select('fullName').lean();
                for (const admin of adminUsers) {
                    if (admin.email && admin._id.toString() !== creatorId) { // skip if admin is already the creator
                        sendProjectEmail({
                            to: admin.email,
                            subject: `Task Manager — Task Completed: "${task.title}"`,
                            text: `Hi ${admin.fullName || 'there'},\n\nThe task "${task.title}" in project "${project.name}" has been marked as completed by ${completer?.fullName || 'a team member'}.\n\nCompleted On: ${new Date().toDateString()}\n\nPlease log in to Task Manager to review.\n\nBest regards,\nTask Manager Team`
                        }).catch(err => console.error('[Email] Admin task completed email failed:', err));
                    }
                }
            }
        }

        // Email: Task Blocked — notify project admins when new blockedBy dependencies are added
        if (taskData.blockedBy !== undefined && Array.isArray(taskData.blockedBy) && taskData.blockedBy.length > 0) {
            const previousBlockedBy = (previousBlockedByIds || []).map(id => id.toString());
            const newlyBlocked = taskData.blockedBy.filter(id => !previousBlockedBy.includes(id.toString()));

            if (newlyBlocked.length > 0) {
                const [blocker, adminMembers] = await Promise.all([
                    User.findById(req.user.id).select('fullName').lean(),
                    User.find({
                        _id: { $in: project.members.filter(m => m.role === 'admin').map(m => m.userId) }
                    }).select('email fullName').lean()
                ]);

                const blockerNames = await Task.find({ _id: { $in: newlyBlocked } }).select('title').lean();
                const blockingTitles = blockerNames.map(t => `"${t.title}"`).join(', ');

                for (const admin of adminMembers) {
                    if (admin.email) {
                        sendProjectEmail({
                            to: admin.email,
                            subject: `Task Manager — Task Blocked: "${task.title}"`,
                            text: `Hi ${admin.fullName || 'there'},\n\nA task in project "${project.name}" has been marked as blocked.\n\nBlocked Task: "${task.title}"\nBlocked By: ${blockingTitles}\nReported By: ${blocker?.fullName || 'A team member'}\n\nPlease log in to Task Manager to resolve the dependency.\n\nBest regards,\nTask Manager Team`
                        }).catch(err => console.error('[Email] Task blocked email failed:', err));
                    }
                }
            }
        }

        // Auto-create next occurrence for recurring tasks when task is completed.
        if (previousStatus !== 'done' && task.status === 'done' && task.recurrence?.enabled && task.recurrence?.frequency) {
            const nextDueDate = getNextRecurringDate(task.dueDate, task.recurrence.frequency);
            if (nextDueDate) {
                const nextTask = await Task.create({
                    userId: task.userId,
                    projectId: task.projectId,
                    assigneeId: task.assigneeId,
                    title: task.title,
                    description: task.description,
                    status: 'todo',
                    priority: task.priority,
                    dueDate: nextDueDate,
                    recurrence: task.recurrence,
                    notes: task.notes || [],
                    attachments: []
                });
                emitProjectTaskEvent(req, task.projectId, 'created', nextTask);
            }
        }

        emitProjectTaskEvent(req, task.projectId, 'updated', task);
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

        const project = await Project.findById(task.projectId);
        if (!project) return res.status(403).json({ message: 'Not authorized' });

        const { hasPermission } = require('../utils/rbac');
        const canDelete = await hasPermission(project, req.user.id, 'tasks:delete');
        const isProjectAdmin = project.ownerId && String(project.ownerId) === String(req.user.id);
        const requireApproval = project.enterprise?.requireApprovalForCompletion && !isProjectAdmin;

        if (!canDelete && task.userId.toString() !== req.user.id && !requireApproval) {
            return res.status(403).json({ message: 'Only authorized users or task creators can delete this task.' });
        }

        if (requireApproval) {
            task.deletionStatus = 'pending';
            task.activityLog.push({
                actorId: req.user.id,
                action: 'deletion_requested',
                detail: 'Deletion pending admin approval'
            });
            await task.save();

            const ApprovalRequest = require('../models/ApprovalRequest');
            await ApprovalRequest.create({
                projectId: project._id,
                taskId: task._id,
                requestedBy: req.user.id,
                type: 'deletion',
                status: 'pending'
            });

            const Notification = require('../models/Notification');
            const adminMembers = project.members.filter((m) => m.role === 'admin');
            const ioInst = req.app.get('io');
            for (const m of adminMembers) {
                await Notification.create({
                    userId: m.userId,
                    taskId: task._id,
                    type: 'approval_request',
                    title: 'Approval required',
                    message: `Task "${task.title}" needs approval to be deleted.`
                });
                // Note: Notification model's post('save') hook auto-emits 'notification:new'
            }

            await logAudit({
                actorId: req.user.id,
                projectId: task.projectId,
                entityType: 'approval',
                entityId: task._id,
                action: 'requested',
                meta: { title: task.title, type: 'deletion' },
                ip: req.ip
            });

            emitProjectTaskEvent(req, task.projectId, 'updated', task);
            return res.json({ requiresApproval: true, message: 'Deletion sent for admin approval. Task stays active until approved.' });
        }

        await Task.findByIdAndDelete(req.params.id);
        emitProjectTaskEvent(req, task.projectId, 'deleted', task);
        await logAudit({
            actorId: req.user.id,
            projectId: task.projectId,
            entityType: 'task',
            entityId: task._id,
            action: 'deleted',
            meta: { title: task.title },
            ip: req.ip
        });
        res.json({ message: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks/:id/notes
// @desc    Add a note to a task
router.post('/:id/notes', async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Note content is required.' });
    }

    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        task.notes.push({ content: content.trim() });
        task.activityLog.push({
            actorId: req.user.id,
            action: 'note_added',
            detail: 'Added a note'
        });
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);
        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks/:id/attachments
// @desc    Upload task attachment
router.post('/:id/attachments', upload.single('attachment'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Attachment is required.' });
    }

    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        task.attachments.push({
            originalName: req.file.originalname,
            fileName: req.file.filename || req.file.originalname,
            filePath: req.file.path, // Secure Cloudinary URL (supports any file type)
            mimeType: req.file.mimetype,
            size: req.file.size
        });
        task.activityLog.push({
            actorId: req.user.id,
            action: 'attachment_added',
            detail: `Uploaded attachment ${req.file.originalname}`
        });
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);

        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST /api/tasks/:id/comments
router.post('/:id/comments', async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Comment text is required.' });
    }
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        task.comments.push({ userId: req.user.id, text: text.trim() });
        task.activityLog.push({
            actorId: req.user.id,
            action: 'comment_added',
            detail: 'Added a comment'
        });
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);

        // Email: Comment notification to assignee (if commenter is not the assignee)
        if (task.assigneeId && task.assigneeId.toString() !== req.user.id.toString()) {
            const [assignee, commenter] = await Promise.all([
                User.findById(task.assigneeId).select('email fullName').lean(),
                User.findById(req.user.id).select('fullName').lean()
            ]);
            if (assignee && assignee.email) {
                sendProjectEmail({
                    to: assignee.email,
                    subject: `Task Manager — New Comment on Your Task: "${task.title}"`,
                    text: `Hi ${assignee.fullName || 'there'},\n\n${commenter?.fullName || 'Someone'} added a comment on the task "${task.title}":\n\n"${text.trim()}"\n\nPlease log in to Task Manager to reply.\n\nBest regards,\nTask Manager Team`
                }).catch(err => console.error('[Email] Comment email failed:', err));
            }
        }

        res.status(201).json(task);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route POST /api/tasks/suggest/deadline
router.post('/suggest/deadline', async (req, res) => {
    const { projectId, assigneeId = null, dueDate, estimatedHours = 2 } = req.body;
    if (!projectId || !dueDate) {
        return res.status(400).json({ message: 'projectId and dueDate are required.' });
    }
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const openTasks = await Task.find({
            projectId,
            assigneeId,
            status: { $ne: 'done' }
        }).lean();
        const bookedHours = openTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 2), 0);
        const suggestion = suggestDeadline({
            dueDate,
            estimatedHours: Number(estimatedHours) || 2,
            bookedHours
        });
        res.json({
            feasible: suggestion.feasible,
            suggestedDueDate: suggestion.suggestedDueDate,
            extraDays: suggestion.extraDays,
            bookedHours
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route POST /api/tasks/suggest/priority
router.post('/suggest/priority', async (req, res) => {
    const { projectId, assigneeId = null, dueDate, estimatedHours = 2 } = req.body;
    if (!projectId || !dueDate) {
        return res.status(400).json({ message: 'projectId and dueDate are required.' });
    }
    try {
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const openTasks = await Task.find({
            projectId,
            assigneeId,
            status: { $ne: 'done' }
        }).lean();
        const currentLoad = openTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 2), 0);
        const priority = suggestPriority({
            dueDate,
            estimatedHours: Number(estimatedHours) || 2,
            currentLoad
        });
        res.json({ priority, currentLoad });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/tasks/:id/subtasks
// @desc    Add a subtask to a task
router.post('/:id/subtasks', async (req, res) => {
    const { title } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Subtask title is required.' });
    }

    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        task.subtasks.push({ title: title.trim(), isCompleted: false });
        task.activityLog.push({
            actorId: req.user.id,
            action: 'subtask_added',
            detail: `Added subtask: ${title.trim()}`
        });
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);
        res.status(201).json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id/subtasks/:subtaskId
// @desc    Update a subtask (toggle completion or edit title)
router.put('/:id/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

        if (req.body.title !== undefined) {
            subtask.title = req.body.title.trim();
        }
        if (req.body.isCompleted !== undefined) {
            const wasCompleted = subtask.isCompleted;
            subtask.isCompleted = req.body.isCompleted;
            if (wasCompleted !== req.body.isCompleted) {
                task.activityLog.push({
                    actorId: req.user.id,
                    action: req.body.isCompleted ? 'subtask_completed' : 'subtask_uncompleted',
                    detail: `${req.body.isCompleted ? 'Completed' : 'Uncompleted'} subtask: ${subtask.title}`
                });
            }
        }
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id/subtasks/:subtaskId
// @desc    Delete a subtask
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project || !isProjectMember(project, req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

        const title = subtask.title;
        task.subtasks.pull(req.params.subtaskId);
        task.activityLog.push({
            actorId: req.user.id,
            action: 'subtask_deleted',
            detail: `Deleted subtask: ${title}`
        });
        await task.save();
        emitProjectTaskEvent(req, task.projectId, 'updated', task);
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
