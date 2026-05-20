const Role = require('../models/Role');
const User = require('../models/User');
const { memberUserIdString } = require('./projectAccess');
const cache = require('./cache');

/**
 * Checks if a user has a specific permission dynamically based on DB roles.
 * @param {Object} project - The project/workspace document.
 * @param {string} userId - The user ID.
 * @param {string} requiredPermission - The permission string (e.g. 'tasks:delete')
 */
const hasPermission = async (project, userId, requiredPermission) => {
    if (!project || !userId) return false;

    // 1. Super Admin bypass (with cached user record to prevent repetitive DB queries)
    const userCacheKey = `user:${userId}:role`;
    let userSystemRole = cache.get(userCacheKey);
    
    if (!userSystemRole) {
        const userRecord = await User.findById(userId).select('systemRole').lean();
        userSystemRole = userRecord ? userRecord.systemRole : 'user';
        cache.set(userCacheKey, userSystemRole, 120); // Cache systemRole for 2 minutes
    }
    
    if (userSystemRole === 'superadmin') {
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

    // 3. Fetch role permissions from the database (with cache lookup)
    const roleCacheKey = `role:${roleName.toLowerCase()}`;
    let rolePermissions = cache.get(roleCacheKey);
    
    if (!rolePermissions) {
        const roleDoc = await Role.findOne({ name: roleName.toLowerCase() }).lean();
        if (roleDoc) {
            rolePermissions = roleDoc.permissions;
            cache.set(roleCacheKey, rolePermissions, 300); // Cache permissions for 5 minutes
        }
    }

    if (!rolePermissions) {
        // Fallback to basic default hardcoded permissions if Role is not yet seeded
        if (roleName === 'admin') return true;
        if (roleName === 'member') {
            return ['tasks:create', 'tasks:edit'].includes(requiredPermission);
        }
        return false;
    }

    // 4. Return whether the role permissions array has the required permission
    return rolePermissions.includes(requiredPermission);
};

module.exports = { hasPermission };
