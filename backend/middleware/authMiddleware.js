const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from header or query
    const token = req.header('x-auth-token') || req.query.token;

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user to check suspension status
        const User = require('../models/User');
        User.findById(decoded.id).select('isSuspended').then(user => {
            if (user && user.isSuspended) {
                return res.status(403).json({ message: 'Your account has been suspended.' });
            }
            req.user = decoded;
            next();
        }).catch(err => {
            res.status(500).json({ message: 'Server Error' });
        });
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
