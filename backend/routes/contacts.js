const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// @route   POST api/contacts
// @desc    Submit contact form
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const newContact = new Contact({ name, email, message });
        await newContact.save();
        res.status(201).json({ message: 'Message received!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
