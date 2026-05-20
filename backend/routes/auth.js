const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const verifyRecaptcha = require('../middleware/recaptcha');
const Project = require('../models/Project');
const { sendProjectEmail } = require('../services/integrationService');
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
// @desc    Register user with OTP verification
router.post('/signup', upload.single('avatar'), verifyRecaptcha, async (req, res) => {
    const { fullName, email, password } = req.body;
    let avatarUrl = "";
    if (req.file) {
        avatarUrl = req.file.path;
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            fullName,
            email,
            password,
            avatarUrl,
            otpCode,
            otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
            isVerified: false
        });

        await user.save();
        
        if (req.app.get('io')) {
            req.app.get('io').to('room:superadmin').emit('user:created', { user: { id: user._id, fullName, email } });
        }

        // Send OTP via email securely
        await sendProjectEmail({
            to: email,
            subject: 'Task Manager — Verify Your Email Address',
            text: `Hi ${fullName},\n\nWelcome to Task Manager! Please use the following 6-digit OTP code to verify your email address:\n\n${otpCode}\n\nThis code is valid for 15 minutes.\n\nBest regards,\nTask Manager Team`
        }).catch(err => {
            console.error('SMTP OTP Signup failed to send:', err);
        });

        res.status(201).json({ 
            isVerified: false,
            email,
            message: 'OTP verification code has been sent to your email. Please verify to activate your workspace.'
        });
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
// @desc    Authenticate user & check OTP verification status
router.post('/login', verifyRecaptcha, async (req, res) => {
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

        // Only enforce OTP on newly registered accounts that have an active otpCode and are isVerified = false
        if (user.isVerified === false && user.otpCode) {
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = newOtp;
            user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
            await user.save();

            await sendProjectEmail({
                to: user.email,
                subject: 'Task Manager — Verify Your Email Address',
                text: `Hi ${user.fullName},\n\nYour new verification OTP code is:\n\n${newOtp}\n\nThis code is valid for 15 minutes.\n\nBest regards,\nTask Manager Team`
            }).catch(err => console.error('SMTP OTP Login resend failed:', err));

            return res.status(403).json({ 
                isVerified: false, 
                email: user.email,
                message: 'Your email address is not verified. A new OTP verification code has been sent to your email.' 
            });
        }

        const payload = { id: user._id, systemRole: user.systemRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, systemRole: user.systemRole } });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and activate user + create initial workspace
router.post('/verify-otp', async (req, res) => {
    const { email, otpCode } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified. Please login.' });
        }

        if (!user.otpCode || !user.otpExpiresAt) {
            return res.status(400).json({ message: 'No active OTP found. Please request a new one.' });
        }

        if (new Date() > user.otpExpiresAt) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (user.otpCode !== otpCode.trim()) {
            return res.status(400).json({ message: 'Incorrect OTP verification code.' });
        }

        // Activate User
        user.isVerified = true;
        user.otpCode = null;
        user.otpExpiresAt = null;
        await user.save();

        // Create Workspace Project now that user is verified
        const project = await Project.create({
            name: `${user.fullName.split(' ')[0]}'s Workspace`,
            ownerId: user._id,
            members: [{ userId: user._id, role: 'admin' }]
        });

        const payload = { id: user._id, systemRole: user.systemRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                systemRole: user.systemRole
            },
            message: 'Email verified successfully! Workspace initialized.'
        });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST api/auth/resend-otp
// @desc    Resend OTP to user's email
router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified.' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otpCode;
        user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await user.save();

        await sendProjectEmail({
            to: email,
            subject: 'Task Manager — Verify Your Email Address',
            text: `Hi ${user.fullName},\n\nYour new verification OTP code is:\n\n${otpCode}\n\nThis code is valid for 15 minutes.\n\nBest regards,\nTask Manager Team`
        });

        res.json({ message: 'A new OTP verification code has been sent to your email.' });
    } catch (err) {
        console.error('Resend OTP Error:', err);
        res.status(500).json({ message: 'Server Error' });
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
