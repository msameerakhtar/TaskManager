import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, Checkbox, useTheme, Button, TextField,
    InputAdornment, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, FormHelperText, IconButton, Tooltip, Alert,
    TableContainer
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import CustomLoader from '../../components/CustomLoader';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';

const ALL_PERMISSIONS = [
    { key: 'tasks:create', label: 'Create Tasks', desc: 'Allows creating standard workspace tasks' },
    { key: 'tasks:edit', label: 'Edit Tasks', desc: 'Allows editing title, description, assignees' },
    { key: 'tasks:delete', label: 'Delete Tasks', desc: 'Allows deletion of workspace tasks' },
    { key: 'tasks:approve', label: 'Approve Completion', desc: 'Allows signing off task completion requests' },
    { key: 'members:invite', label: 'Invite Members', desc: 'Allows adding new emails to a workspace' },
    { key: 'members:remove', label: 'Evict Members', desc: 'Allows removing team members from workspace' },
    { key: 'members:role_update', label: 'Update Member Roles', desc: 'Allows promoting/demoting user roles' },
    { key: 'enterprise:manage', label: 'Enterprise Policies', desc: 'Allows overriding SLA & workspace flows' },
    { key: 'audit:view', label: 'View Audit Logs', desc: 'Allows reviewing workspace action history' },
    { key: 'exports:download', label: 'Exports & Reports', desc: 'Allows downloading CSV or PDF statistics' },
];

const SuperAdminRBAC = () => {
    const token = useSelector(state => state.auth.token);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // Dialog state for creating a custom role
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleScope, setNewRoleScope] = useState('project');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchRoles = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await api.get('/admin/rbac/roles');
            setRoles(res.data || []);
        } catch (err) {
            console.error('RBAC Roles fetch error:', err);
            setActionError('Failed to fetch platform roles.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Handle checkbox update dynamic saving
    const handlePermissionToggle = async (roleId, permissionKey, currentChecked) => {
        const targetRole = roles.find(r => r._id === roleId);
        if (!targetRole) return;

        let updatedPermissions = [...targetRole.permissions];
        if (currentChecked) {
            updatedPermissions = updatedPermissions.filter(p => p !== permissionKey);
        } else {
            updatedPermissions.push(permissionKey);
        }

        // Optimistic UI update
        const originalRoles = [...roles];
        setRoles(roles.map(r => r._id === roleId ? { ...r, permissions: updatedPermissions } : r));
        setActionSuccess('');
        setActionError('');

        try {
            await api.patch(`/admin/rbac/roles/${roleId}`, { permissions: updatedPermissions });
            setActionSuccess(`Successfully updated permissions for role "${targetRole.name}".`);
            setTimeout(() => setActionSuccess(''), 3000);
        } catch (error) {
            // Revert on error
            setRoles(originalRoles);
            setActionError('Failed to update role permissions.');
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            setActionError('Role name is required.');
            return;
        }
        setActionSuccess('');
        setActionError('');
        try {
            await api.post('/admin/rbac/roles', {
                name: newRoleName,
                scope: newRoleScope,
                description: newRoleDesc,
                permissions: newRolePermissions
            });
            setActionSuccess(`Role "${newRoleName.toLowerCase()}" created successfully!`);
            setDialogOpen(false);
            // Reset state
            setNewRoleName('');
            setNewRoleScope('project');
            setNewRoleDesc('');
            setNewRolePermissions([]);
            fetchRoles();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to create custom role.');
        }
    };

    const handleDeleteRole = async (roleId, roleName) => {
        if (!window.confirm(`Are you sure you want to permanently delete custom role "${roleName}"?`)) return;
        setActionSuccess('');
        setActionError('');
        try {
            await api.delete(`/admin/rbac/roles/${roleId}`);
            setActionSuccess(`Role "${roleName}" deleted successfully.`);
            fetchRoles();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to delete role.');
        }
    };

    const toggleNewPermission = (key) => {
        if (newRolePermissions.includes(key)) {
            setNewRolePermissions(newRolePermissions.filter(p => p !== key));
        } else {
            setNewRolePermissions([...newRolePermissions, key]);
        }
    };

    const filteredRoles = roles.filter(r => {
        const query = debouncedSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            r.name?.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
        );
    });

    if (loading && roles.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

    return (
        <Box>
            <Box sx={{
                display: 'flex', flexWrap: 'wrap',
                justifyContent: 'space-between', alignItems: 'center',
                gap: 2, mb: 4
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        Role-Based Access Control (RBAC)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure granular system and workspace roles, permissions matrix, and custom security rules.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDialogOpen(true)}
                    sx={{
                        background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                        fontWeight: 700,
                        px: 3, py: 1,
                        borderRadius: '12px',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                        '&:hover': { opacity: 0.9 }
                    }}
                >
                    Create Custom Role
                </Button>
            </Box>

            {/* Alert Logs */}
            {actionError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}
            {actionSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setActionSuccess('')}>{actionSuccess}</Alert>}

            {/* Controls */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search roles by name or description..."
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    sx={{
                        maxWidth: 400, width: '100%',
                        '& .MuiOutlinedInput-root': { borderRadius: 3 }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* RBAC Matrix Card */}
            <Paper sx={{
                borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none', overflow: 'hidden'
            }}>
                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table size="medium">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 700, py: 2.5, minWidth: 200 }}>Roles & Scopes</TableCell>
                                {ALL_PERMISSIONS.map(p => (
                                    <TableCell key={p.key} align="center" sx={{ fontWeight: 700, minWidth: 130 }}>
                                        <Tooltip title={p.desc} arrow>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'help' }}>
                                                <Typography variant="body2" fontWeight={700}>{p.label}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>
                                                    {p.key}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                ))}
                                <TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRoles.map(r => (
                                <TableRow key={r._id} hover>
                                    {/* Role Header Info */}
                                    <TableCell sx={{ py: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ShieldIcon color={r.isSystemDefault ? 'secondary' : 'primary'} fontSize="small" />
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                                        {r.name}
                                                    </Typography>
                                                    {r.isSystemDefault && (
                                                        <Chip label="System Default" size="small" variant="outlined" color="secondary" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 220, lineHeight: 1.2, mt: 0.5 }}>
                                                    {r.description || 'No description provided.'}
                                                </Typography>
                                                <Chip
                                                    label={(r.scope || 'project').toUpperCase()}
                                                    size="small"
                                                    variant="filled"
                                                    color={(r.scope || 'project') === 'global' ? 'warning' : 'info'}
                                                    sx={{ mt: 1, height: 18, fontSize: '0.55rem', fontWeight: 800 }}
                                                />
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Checkbox Permission Matrix */}
                                    {ALL_PERMISSIONS.map(p => {
                                        const hasPermission = r.permissions.includes(p.key);
                                        const isRestrictedForMember = r.name?.toLowerCase() === 'member' && 
                                            ['tasks:approve', 'members:remove', 'audit:view', 'members:role_update'].includes(p.key);
                                        
                                        const isChecked = hasPermission && !isRestrictedForMember;
                                        const isDisabled = r.name?.toLowerCase() === 'superadmin' || isRestrictedForMember;

                                        return (
                                            <TableCell key={p.key} align="center">
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={() => handlePermissionToggle(r._id, p.key, isChecked)}
                                                    color="primary"
                                                    disabled={isDisabled}
                                                />
                                            </TableCell>
                                        );
                                    })}

                                    {/* Actions (Delete for Custom Roles only) */}
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        {!r.isSystemDefault ? (
                                            <IconButton color="error" size="small" onClick={() => handleDeleteRole(r._id, r.name)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        ) : (
                                            <Tooltip title="System default role cannot be deleted.">
                                                <span>
                                                    <IconButton disabled size="small">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRoles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={ALL_PERMISSIONS.length + 2} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">No matching roles found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Create Custom Role Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>Create Custom Role</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1.5 }}>
                        <TextField
                            label="Role Name"
                            placeholder="e.g. external_member"
                            fullWidth
                            size="small"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value.replace(/\s+/g, '_'))}
                            helperText="Use lowercase names with underscores"
                        />

                        <FormControl fullWidth size="small">
                            <InputLabel>Role Scope</InputLabel>
                            <Select
                                value={newRoleScope}
                                onChange={e => setNewRoleScope(e.target.value)}
                                label="Role Scope"
                            >
                                <MenuItem value="project">Workspace (Project-level)</MenuItem>
                                <MenuItem value="global">Platform (System-wide global)</MenuItem>
                            </Select>
                            <FormHelperText>Define if role has workspace relevance or app-wide global access</FormHelperText>
                        </FormControl>

                        <TextField
                            label="Description"
                            placeholder="Briefly describe what members with this role are expected to do..."
                            fullWidth
                            multiline
                            rows={2}
                            size="small"
                            value={newRoleDesc}
                            onChange={e => setNewRoleDesc(e.target.value)}
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                Configure Initial Permissions
                            </Typography>
                            <Box sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2,
                                maxHeight: 180,
                                overflowY: 'auto',
                                p: 1.5,
                                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                            }}>
                                {ALL_PERMISSIONS.map(p => {
                                    const checked = newRolePermissions.includes(p.key);
                                    return (
                                        <FormControlLabel
                                            key={p.key}
                                            control={
                                                <Checkbox
                                                    checked={checked}
                                                    onChange={() => toggleNewPermission(p.key)}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Box sx={{ py: 0.5 }}>
                                                    <Typography variant="body2" fontWeight={600} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                        {p.label}
                                                        <Tooltip title={p.desc} size="small">
                                                            <InfoIcon sx={{ fontSize: 13, color: 'text.secondary', cursor: 'help' }} />
                                                        </Tooltip>
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ display: 'block', mb: 0.5 }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateRole}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                            '&:hover': { opacity: 0.9 }
                        }}
                    >
                        Create Role
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SuperAdminRBAC;
