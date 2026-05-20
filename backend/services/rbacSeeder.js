const Role = require('../models/Role');

const seedDefaultRoles = async () => {
    try {
        const defaultRoles = [
            {
                name: 'superadmin',
                scope: 'global',
                description: 'Global system administrator with unrestricted control over all workspaces and platform features.',
                isSystemDefault: true,
                permissions: [
                    'tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:approve',
                    'members:invite', 'members:remove', 'members:role_update',
                    'enterprise:manage', 'audit:view', 'exports:download'
                ]
            },
            {
                name: 'admin',
                scope: 'project',
                description: 'Workspace owner/manager. Can coordinate tasks, configure workflows, and manage team members.',
                isSystemDefault: true,
                permissions: [
                    'tasks:create', 'tasks:edit', 'tasks:delete', 'tasks:approve',
                    'members:invite', 'members:remove', 'members:role_update',
                    'enterprise:manage', 'audit:view', 'exports:download'
                ]
            },
            {
                name: 'member',
                scope: 'project',
                description: 'Regular project workspace team member. Can create, edit, and delete tasks.',
                isSystemDefault: true,
                permissions: [
                    'tasks:create', 'tasks:edit', 'tasks:delete'
                ]
            },
            {
                name: 'viewer',
                scope: 'project',
                description: 'Read-only external partner or stakeholder. Can view task progress but cannot make edits or add entries.',
                isSystemDefault: true,
                permissions: []
            }
        ];

        for (const roleData of defaultRoles) {
            const existing = await Role.findOne({ name: roleData.name });
            if (!existing) {
                await Role.create(roleData);
                console.log(`✅ Default Role Seeded: ${roleData.name}`);
            } else {
                existing.permissions = roleData.permissions;
                existing.description = roleData.description;
                existing.scope = roleData.scope;
                existing.isSystemDefault = true;
                await existing.save();
                console.log(`🔄 Default Role Updated: ${roleData.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Failed to seed default roles:', error.message);
    }
};

module.exports = { seedDefaultRoles };
