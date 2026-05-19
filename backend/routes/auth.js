const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
// const verifyRecaptcha = require('../middleware/recaptcha');
const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage Engine for Cloudinary
const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'taskmanager-avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 250, height: 250, crop: 'fill' }],
    },
});

const upload = multer({ 
    storage: cloudStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// @route   POST api/auth/signup
// @desc    Register user
router.post('/signup', /*verifyRecaptcha,*/ async (req, res) => {
    const { fullName, email, password, avatarUrl } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            fullName,
            email,
            password,
            avatarUrl
        });

        await user.save();
        
        if (req.app.get('io')) {
            req.app.get('io').to('room:superadmin').emit('user:created', { user: { id: user._id, fullName, email } });
        }

        await Project.create({
            name: `${fullName.split(' ')[0]}'s Workspace`,
            ownerId: user._id,
            members: [{ userId: user._id, role: 'admin' }]
        });

        const payload = { id: user._id, systemRole: user.systemRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ token, user: { id: user._id, fullName, email, avatarUrl, systemRole: user.systemRole } });
    } catch (err) {
        console.error('FULL SIGNUP ERROR:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ 
            message: 'Backend Error: ' + err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', /*verifyRecaptcha,*/ async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended by the administrator.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { id: user._id, systemRole: user.systemRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, systemRole: user.systemRole } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
});

// @route   GET api/auth/me
// @desc    Get current user (Protected)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/upload-avatar
// @desc    Upload user avatar
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const avatarUrl = req.file.path; // Secured Cloudinary image URL
        
        res.json({ avatarUrl });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { fullName, avatarUrl } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (fullName) user.fullName = fullName;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();
        res.json({ id: user._id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, systemRole: user.systemRole });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/change-password
// @desc    Change user password
router.put('/change-password', authMiddleware, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
