const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/auth/signup
// @desc    Register user
router.post('/signup', async (req, res) => {
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

        const payload = { id: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ token, user: { id: user._id, fullName, email, avatarUrl } });
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { id: user._id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl } });
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

module.exports = router;
