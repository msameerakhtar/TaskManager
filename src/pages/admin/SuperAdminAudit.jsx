import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, TableContainer, useTheme, Button,
    TablePagination, TextField, InputAdornment, Chip, Collapse, IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import CustomLoader from '../../components/CustomLoader';

const Row = ({ log }) => {
    const [open, setOpen] = useState(false);
    const theme = useTheme();

    const getEntityColor = (type) => {
        switch (type) {
            case 'task': return 'primary';
            case 'project': return 'success';
            case 'member': return 'warning';
            case 'approval': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                    {log.projectId?.name || <Chip label="System-wide" size="small" variant="outlined" />}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.actorId?.fullName || 'System'}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.actorId?.email || ''}</Typography>
                </TableCell>
                <TableCell>
                    <Chip
                        label={log.entityType?.toUpperCase()}
                        size="small"
                        color={getEntityColor(log.entityType)}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {log.action}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 2, borderRadius: 2, bgcolor: theme.palette.action.hover }}>
                            <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700 }}>
                                Log Metadata Details
                            </Typography>
                            <Box component="pre" sx={{
                                m: 0, p: 1.5,
                                borderRadius: 1.5,
                                overflowX: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                                border: `1px solid ${theme.palette.divider}`
                            }}>
                                {JSON.stringify({
                                    entityId: log.entityId,
                                    ipAddress: log.ip || 'N/A',
                                    details: log.meta || {}
                                }, null, 2)}
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const SuperAdminAudit = () => {
    const token = useSelector(state => state.auth.token);
    const theme = useTheme();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const fetchLogs = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await api.get('/admin/audit', {
                params: {
                    page: page + 1,
                    limit: rowsPerPage
                }
            });
            setLogs(res.data.items || []);
            setTotal(res.data.meta?.total || 0);
        } catch (err) {
            console.error('SuperAdmin Audit Logs fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token, page, rowsPerPage]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleDownloadCSV = async () => {
        try {
            // Trigger direct browser download using native credentials/token
            const response = await api.get('/admin/exports/audit.csv', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `system-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Export failed. Please try again.');
        }
    };

    const filteredLogs = logs.filter(log => {
        const query = debouncedSearch.toLowerCase().trim();
        if (!query) return true;
        return (
            log.action?.toLowerCase().includes(query) ||
            log.entityType?.toLowerCase().includes(query) ||
            log.actorId?.fullName?.toLowerCase().includes(query) ||
            log.actorId?.email?.toLowerCase().includes(query) ||
            log.projectId?.name?.toLowerCase().includes(query)
        );
    });

    return (
        <Box>
            <Box sx={{
                display: 'flex', flexWrap: 'wrap',
                justifyContent: 'space-between', alignItems: 'center',
                gap: 2, mb: 4
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                        System Audit Logs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track, monitor and export all global administrative actions across the TaskManager system.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadCSV}
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
                    Export CSV Report
                </Button>
            </Box>

            {/* Filter controls */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search logs by actor, action, workspace..."
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

            {loading && logs.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>
            ) : (
                <Paper sx={{
                    borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none', overflow: 'hidden'
                }}>
                    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell style={{ width: 40 }} />
                                    <TableCell sx={{ py: 2, fontWeight: 700 }}>Timestamp</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Workspace</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLogs.map((log, index) => (
                                    <Row key={log._id || index} log={log} />
                                ))}
                                {filteredLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                            <Typography color="text.secondary">No matching audit logs found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={total}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                </Paper>
            )}
        </Box>
    );
};

export default SuperAdminAudit;
