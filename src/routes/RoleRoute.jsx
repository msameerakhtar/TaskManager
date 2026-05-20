/**
 * RoleRoute — Frontend route guard based on workspace role & system role.
 *
 * Usage:
 *   <RoleRoute requiredRole="admin">  →  Only workspace admins (or superadmins) can access
 *   <RoleRoute>                       →  Any authenticated, non-superadmin user can access
 *
 * Redirect logic:
 *   - SuperAdmin visiting regular app routes → /admin/overview
 *   - Member visiting admin-only route      → /tasks
 *   - Role not yet set (fresh load)         → /tasks (role is set when user selects a project)
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ requiredRole, requiredPermission, children }) => {
    const user = useSelector(state => state.auth.user);
    const currentRole = useSelector(state => state.auth.currentRole);
    const currentPermissions = useSelector(state => state.auth.currentPermissions || []);

    // 1. Superadmin has no business in the regular user app
    if (user?.systemRole === 'superadmin') {
        return <Navigate to="/admin/overview" replace />;
    }

    // 2. Dynamic permission bypass
    if (requiredPermission && currentPermissions.includes(requiredPermission)) {
        return children;
    }

    // 3. Admin-only routes
    if (requiredRole === 'admin') {
        // Role not yet determined (user hasn't selected a project yet)
        if (!currentRole) {
            return <Navigate to="/tasks" replace />;
        }
        // Role determined but user is a member
        if (currentRole !== 'admin') {
            return <Navigate to="/tasks" replace />;
        }
    }

    return children;
};

export default RoleRoute;
