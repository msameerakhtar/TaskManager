const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const contactRoutes = require('./routes/contacts');

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contacts', contactRoutes);

app.get('/', (req, res) => {
    res.send('Task Manager API is running...');
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully to local/cloud instance'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
