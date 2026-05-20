import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, useTheme } from '@mui/material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import CustomLoader from '../../components/CustomLoader';
import { useAdminSocket } from '../../features/admin/SuperAdminSocketContext';

const SOCKET_EVENTS = ['user:created', 'project:created', 'project:deleted', 'task:changed'];

const SuperAdminOverview = () => {
    const token = useSelector(state => state.auth.token);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [stats, setStats] = useState({ usersCount: 0, projectsCount: 0, tasksCount: 0 });
    const [chartData, setChartData] = useState({ growthData: [], taskData: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [statsRes, chartRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/chart-data')
            ]);
            setStats(statsRes.data || { usersCount: 0, projectsCount: 0, tasksCount: 0 });
            setChartData(chartRes.data || { growthData: [], taskData: [] });
        } catch (err) {
            console.error('SuperAdmin Overview fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Use shared socket — no separate connection per page
    useAdminSocket(SOCKET_EVENTS, fetchData);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: { xs: 2, md: 3 }, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                Dashboard Overview
            </Typography>

            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4, alignItems: 'stretch' }}>
                <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ display: 'flex' }}>
                    <Card elevation={2} sx={{ borderRadius: 3, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Users</Typography>
                            <Typography variant="h3" fontWeight={700} color="primary.main">{stats.usersCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ display: 'flex' }}>
                    <Card elevation={2} sx={{ borderRadius: 3, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Workspaces</Typography>
                            <Typography variant="h3" fontWeight={700} color="secondary.main">{stats.projectsCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 4 }} sx={{ display: 'flex' }}>
                    <Card elevation={2} sx={{ borderRadius: 3, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Tasks</Typography>
                            <Typography variant="h3" fontWeight={700} color="success.main">{stats.tasksCount}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                            System Growth (Last 6 Months)
                        </Typography>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                                    <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
                                    <YAxis stroke={isDark ? '#ccc' : '#666'} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }} />
                                    <Legend />
                                    <Bar dataKey="Users" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Workspaces" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                            Task Status Distribution
                        </Typography>
                        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData.taskData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={100}
                                        paddingAngle={5} dataKey="value"
                                    >
                                        {chartData.taskData.map((entry, index) => {
                                            const colors = [theme.palette.info.main, theme.palette.warning.main, theme.palette.success.main];
                                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                        })}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SuperAdminOverview;
