const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    scope: {
        type: String,
        required: true,
        enum: ['global', 'project'],
        default: 'project'
    },
    permissions: [{
        type: String,
        required: true
    }],
    description: {
        type: String,
        default: ''
    },
    isSystemDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
