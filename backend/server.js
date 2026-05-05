const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { startReminderScheduler } = require('./services/reminderScheduler');
const Project = require('./models/Project');

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
app.set('io', io);
const projectPresence = new Map();

const emitPresence = (projectId) => {
    const onlineUsers = projectPresence.get(projectId) || new Set();
    io.to(`project:${projectId}`).emit('presence:update', {
        projectId,
        onlineCount: onlineUsers.size
    });
};
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' }
});
app.use('/api', apiLimiter);

// Import Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');
const notificationRoutes = require('./routes/notifications');
const projectRoutes = require('./routes/projects');
const insightsRoutes = require('./routes/insights');
const calendarRoutes = require('./routes/calendar');
const enterpriseRoutes = require('./routes/enterprise');

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/uploads', express.static(uploadsDir));

app.get('/', (req, res) => {
    res.send('Task Manager API is running...');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Unauthorized'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Unauthorized'));
    }
});

io.on('connection', (socket) => {
    socket.joinedProjects = new Set();

    socket.on('project:join', async ({ projectId }) => {
        if (!projectId) return;
        const project = await Project.findById(projectId).lean();
        if (!project) return;
        const isMember = project.members.some((m) => m.userId.toString() === socket.user.id);
        if (!isMember) return;
        socket.join(`project:${projectId}`);
        socket.joinedProjects.add(projectId);
        const users = projectPresence.get(projectId) || new Set();
        users.add(socket.user.id);
        projectPresence.set(projectId, users);
        emitPresence(projectId);
    });

    socket.on('project:leave', ({ projectId }) => {
        if (!projectId) return;
        socket.leave(`project:${projectId}`);
        socket.joinedProjects.delete(projectId);
        const users = projectPresence.get(projectId);
        if (users) {
            users.delete(socket.user.id);
            if (users.size === 0) {
                projectPresence.delete(projectId);
            } else {
                projectPresence.set(projectId, users);
            }
            emitPresence(projectId);
        }
    });

    socket.on('disconnect', () => {
        for (const projectId of socket.joinedProjects || []) {
            const users = projectPresence.get(projectId);
            if (!users) continue;
            users.delete(socket.user.id);
            if (users.size === 0) {
                projectPresence.delete(projectId);
            } else {
                projectPresence.set(projectId, users);
            }
            emitPresence(projectId);
        }
    });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 30,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
})
    .then(() => {
        console.log('✅ MongoDB Connected Successfully to local/cloud instance');
        startReminderScheduler();
    })
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

const PORT = process.env.PORT || 5000;
const server = httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const shutdown = async () => {
    console.log('Shutting down server gracefully...');
    server.close(async () => {
        try {
            io.close();
            await mongoose.connection.close(false);
        } finally {
            process.exit(0);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
