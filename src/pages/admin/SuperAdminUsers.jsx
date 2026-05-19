import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, Button, Chip, TableContainer, useTheme,
    TextField, InputAdornment
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import CustomLoader from '../../components/CustomLoader';
import { useAdminSocket } from '../../features/admin/SuperAdminSocketContext';

const SOCKET_EVENTS = ['user:created', 'user:updated'];

const SuperAdminUsers = () => {
    const token = useSelector(state => state.auth.token);
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Debounce state
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

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
            const res = await api.get('/admin/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('SuperAdmin Users fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Use shared socket — no new connection per page
    useAdminSocket(SOCKET_EVENTS, fetchData);

    const handleToggleSuspend = async (userObj) => {
        const action = userObj.isSuspended ? 'unblock' : 'suspend';
        if (!window.confirm(`Are you sure you want to ${action} ${userObj.fullName}?`)) return;
        try {
            await api.patch(`/admin/users/${userObj._id}/suspend`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed.');
        }
    };

    const filteredUsers = users.filter(u => {
        const query = debouncedSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            u.fullName?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.systemRole?.toLowerCase().includes(query)
        );
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Monitor users, configure system roles, and suspend/unblock accounts globally.
            </Typography>

            {/* Debounced Search Bar */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search users by name, email or role..."
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
                    sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', minWidth: 600 }}
                >
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ py: 2, fontWeight: 700 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map(u => (
                                <TableRow key={u._id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.fullName}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={u.systemRole || 'user'}
                                            color={u.systemRole === 'superadmin' ? 'secondary' : 'default'}
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={u.isSuspended ? 'Suspended' : 'Active'}
                                            color={u.isSuspended ? 'error' : 'success'}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        {u.systemRole !== 'superadmin' && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={u.isSuspended ? 'success' : 'error'}
                                                onClick={() => handleToggleSuspend(u)}
                                                startIcon={u.isSuspended ? <CheckCircleIcon /> : <BlockIcon />}
                                                sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                {u.isSuspended ? 'Unblock' : 'Suspend'}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No matching users found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

export default SuperAdminUsers;
