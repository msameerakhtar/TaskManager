/**
 * Optional: ensure Project.enterprise and Task Phase-5 fields exist in MongoDB.
 * Run: node scripts/migrateEnterprisePhase5.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

const defaultEnterprise = {
    requireApprovalForCompletion: false,
    sla: {
        enabled: false,
        escalateHoursAfterDue: 24,
        repeatEscalationHours: 24
    },
    integrations: {
        slackWebhookUrl: '',
        emailAlertsToAdmins: false
    }
};

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const pRes = await Project.updateMany(
        { $or: [{ enterprise: { $exists: false } }, { enterprise: null }] },
        { $set: { enterprise: defaultEnterprise } }
    );
    const t1 = await Task.updateMany(
        { approvalStatus: { $exists: false } },
        { $set: { approvalStatus: 'none' } }
    );
    const t2 = await Task.updateMany(
        { escalationLevel: { $exists: false } },
        { $set: { escalationLevel: 0 } }
    );
    console.log('Projects updated:', pRes.modifiedCount);
    console.log('Tasks approvalStatus backfill:', t1.modifiedCount);
    console.log('Tasks escalationLevel backfill:', t2.modifiedCount);
    await mongoose.disconnect();
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
