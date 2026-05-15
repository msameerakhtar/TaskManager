import React, { useEffect, useState, useCallback } from 'react';
import { Box, Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Grid, Card, CardContent, IconButton, Chip, useTheme, TableContainer } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/axiosInstance';
import api from '../api/axiosInstance';
import { useSelector } from 'react-redux';
import CustomLoader from '../components/CustomLoader';

const SuperAdmin = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [stats, setStats] = useState({ usersCount: 0, projectsCount: 0, tasksCount: 0 });
  const [chartData, setChartData] = useState({ growthData: [], taskData: [] });
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [statsRes, usersRes, workspacesRes, chartRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/workspaces'),
        api.get('/admin/chart-data')
      ]);
      setStats(statsRes.data || { usersCount: 0, projectsCount: 0, tasksCount: 0 });
      setChartData(chartRes.data || { growthData: [], taskData: [] });
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setWorkspaces(Array.isArray(workspacesRes.data) ? workspacesRes.data : []);
    } catch (err) {
      console.error('SuperAdmin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates via Sockets
  useEffect(() => {
    if (!token || user?.systemRole !== 'superadmin') return;
    
    const socketBaseUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['polling']
    });

    socket.on('user:created', () => fetchData());
    socket.on('user:updated', () => fetchData());
    socket.on('project:created', () => fetchData());
    socket.on('project:deleted', () => fetchData());
    socket.on('task:changed', () => fetchData());

    return () => {
      socket.disconnect();
    };
  }, [token, user?.systemRole, fetchData]);

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this workspace and ALL its tasks?")) return;
    try {
      await api.delete(`/admin/workspaces/${id}`);
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed.');
    }
  };

  const handleToggleSuspend = async (userObj) => {
    const action = userObj.isSuspended ? 'unblock' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${userObj.fullName}?`)) return;
    try {
      await api.patch(`/admin/users/${userObj._id}/suspend`);
      fetchData();
    } catch (error) {
      console.error('Suspend failed:', error);
      alert(error.response?.data?.message || 'Action failed.');
    }
  };

  if (user?.systemRole !== 'superadmin') {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" color="error">Access Denied</Typography>
        <Typography>You do not have permission to view this page.</Typography>
      </Container>
    );
  }

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: { xs: 2, md: 3 }, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
        Super Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Users</Typography>
              <Typography variant="h3" fontWeight={700} color="primary.main">{stats.usersCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Workspaces</Typography>
              <Typography variant="h3" fontWeight={700} color="secondary.main">{stats.projectsCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Tasks</Typography>
              <Typography variant="h3" fontWeight={700} color="success.main">{stats.tasksCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: 380, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>System Growth (Last 6 Months)</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
                  <YAxis stroke={isDark ? '#ccc' : '#666'} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }}
                  />
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
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Task Status Distribution</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.taskData.map((entry, index) => {
                    const colors = [theme.palette.info.main, theme.palette.warning.main, theme.palette.success.main];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>All Workspaces</Typography>
      <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 3, overflowX: 'auto', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Workspace Name</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Owner</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Members Count</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Created At</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workspaces.map(w => (
              <TableRow key={w._id} hover>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{w.name}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{w.ownerId?.email || 'Unknown'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{w.members?.length || 0}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" size="small" onClick={() => handleDeleteWorkspace(w._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>All Users</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: 'auto', border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Name</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>System Role</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Joined</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.fullName}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{u.email}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Chip size="small" label={u.systemRole || 'user'} color={u.systemRole === 'superadmin' ? 'secondary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Chip size="small" label={u.isSuspended ? 'Suspended' : 'Active'} color={u.isSuspended ? 'error' : 'success'} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  {u.systemRole !== 'superadmin' && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color={u.isSuspended ? 'success' : 'error'}
                      onClick={() => handleToggleSuspend(u)}
                      startIcon={u.isSuspended ? <CheckCircleIcon /> : <BlockIcon />}
                    >
                      {u.isSuspended ? 'Unblock' : 'Suspend'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default SuperAdmin;
