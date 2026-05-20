import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, IconButton, TableContainer, useTheme,
    TextField, InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import CustomLoader from '../../components/CustomLoader';
import { useAdminSocket } from '../../features/admin/SuperAdminSocketContext';
import WorkspaceEnterpriseDialog from './WorkspaceEnterpriseDialog';

const SOCKET_EVENTS = ['project:created', 'project:deleted'];

const SuperAdminWorkspaces = () => {
    const token = useSelector(state => state.auth.token);
    const theme = useTheme();
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Debounce state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Dialog state for Enterprise Settings override
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await api.get('/admin/workspaces');
            setWorkspaces(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('SuperAdmin Workspaces fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Use shared socket — no new connection per page
    useAdminSocket(SOCKET_EVENTS, fetchData);

    const handleDeleteWorkspace = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this workspace and ALL its tasks?')) return;
        try {
            await api.delete(`/admin/workspaces/${id}`);
            fetchData();
        } catch (error) {
            alert('Delete failed.');
        }
    };

    const handleOpenSettings = (workspace) => {
        setSelectedWorkspace(workspace);
        setDialogOpen(true);
    };

    const handleCloseSettings = () => {
        setDialogOpen(false);
        setSelectedWorkspace(null);
    };

    const filteredWorkspaces = workspaces.filter(w => {
        const query = debouncedSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            w.name?.toLowerCase().includes(query) ||
            w.ownerId?.email?.toLowerCase().includes(query) ||
            w.ownerId?.fullName?.toLowerCase().includes(query)
        );
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                Workspaces Audit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monitor platform workspaces, manage enterprise policies, and export audits.
            </Typography>

            {/* Debounced Search Bar */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search workspaces by name or owner email..."
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

            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', minWidth: 560 }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ py: 2, fontWeight: 700 }}>Workspace Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Owner Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredWorkspaces.map(w => (
                                <TableRow key={w._id} hover>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{w.name}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{w.ownerId?.email || 'Unknown'}</TableCell>
                                    <TableCell>{w.members?.length || 0}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {new Date(w.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton 
                                            color="primary" 
                                            size="small" 
                                            onClick={() => handleOpenSettings(w)}
                                            sx={{ mr: 1 }}
                                            title="Manage Enterprise Settings"
                                        >
                                            <SettingsIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton 
                                            color="error" 
                                            size="small" 
                                            onClick={() => handleDeleteWorkspace(w._id)}
                                            title="Delete Workspace"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredWorkspaces.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No matching workspaces found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Workspace Enterprise Override Dialog */}
            <WorkspaceEnterpriseDialog 
                open={dialogOpen}
                onClose={handleCloseSettings}
                workspaceId={selectedWorkspace?._id}
                workspaceName={selectedWorkspace?.name}
            />
        </Box>
    );
};

export default SuperAdminWorkspaces;
