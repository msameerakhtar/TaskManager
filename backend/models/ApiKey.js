const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    label: {
        type: String,
        trim: true,
        default: 'API key'
    },
    keyPrefix: {
        type: String,
        required: true
    },
    keyHash: {
        type: String,
        required: true
    },
    scopes: {
        type: [String],
        default: ['export:read']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastUsedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

apiKeySchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ApiKey', apiKeySchema);
