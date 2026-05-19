const Role = require('../models/Role');
const User = require('../models/User');
const { memberUserIdString } = require('./projectAccess');

/**
 * Checks if a user has a specific permission dynamically based on DB roles.
 * @param {Object} project - The project/workspace document.
 * @param {string} userId - The user ID.
 * @param {string} requiredPermission - The permission string (e.g. 'tasks:delete')
 */
const hasPermission = async (project, userId, requiredPermission) => {
    if (!project || !userId) return false;

    // 1. Super Admin bypass
    const userRecord = await User.findById(userId).lean();
    if (userRecord && userRecord.systemRole === 'superadmin') {
        return true;
    }

    // 2. Resolve user's role in this project
    let roleName = null;
    if (project.ownerId && String(project.ownerId) === String(userId)) {
        roleName = 'admin';
    } else if (Array.isArray(project.members)) {
        const member = project.members.find((m) => memberUserIdString(m) === String(userId));
        if (member) {
            roleName = member.role;
        }
    }

    if (!roleName) return false; // Not a member of the project

    // 3. Fetch role permissions from the database
    const roleDoc = await Role.findOne({ name: roleName.toLowerCase() });
    if (!roleDoc) {
        // Fallback to basic default hardcoded permissions if Role is not yet seeded
        if (roleName === 'admin') return true;
        if (roleName === 'member') {
            return ['tasks:create', 'tasks:edit'].includes(requiredPermission);
        }
        return false;
    }

    // 4. Return whether the role permissions array has the required permission
    return roleDoc.permissions.includes(requiredPermission);
};

module.exports = { hasPermission };
