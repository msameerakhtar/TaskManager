import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, TextField, MenuItem, useTheme, Chip, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../api/axiosInstance';
import api from '../api/axiosInstance';
import { projectApi } from '../api/projectApi';
import { insightsApi } from '../api/insightsApi';
import CustomLoader from '../components/CustomLoader';

const AdminDashboard = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ membersCount: 0, tasksCount: 0, totalTasks: 0, pendingTasks: 0, completedTasks: 0, overdueTasks: 0, taskData: [], workloadData: [] });
  const [insights, setInsights] = useState(null);
  const [workloadDataPhase4, setWorkloadDataPhase4] = useState([]);

  const userId = user?.id || user?._id;

  const roleForProject = useCallback((proj) => {
    if (!proj || !userId) return null;
    const uidStr = userId.toString();
    if (proj.ownerId && (proj.ownerId._id || proj.ownerId).toString() === uidStr) return 'admin';
    const m = proj.members?.find((mem) => (mem.userId?._id || mem.userId)?.toString() === uidStr);
    return m?.role || null;
  }, [userId]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await projectApi.getProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        // Auto select a project where user is admin
        const adminProject = data.find(p => roleForProject(p) === 'admin' || user?.systemRole === 'superadmin');
        if (adminProject) {
            setProjectId(adminProject._id);
        } else {
            setProjectId(data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, roleForProject, user?.systemRole]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const admin = useMemo(() => {
      if (user?.systemRole === 'superadmin') return true;
      if (!projectId) return false;
      return roleForProject(projects.find((p) => p._id === projectId)) === 'admin';
  }, [projectId, projects, roleForProject, user?.systemRole]);

  const fetchStats = useCallback(async () => {
    if (!projectId || !admin) return;
    try {
      const res = await api.get('/projects/' + projectId + '/dashboard-stats');
      setStats(res.data);
      try {
        const prodRes = await insightsApi.getProductivity(projectId);
        setInsights(prodRes.data);
      } catch (e) { setInsights(null); }
      try {
        const wlRes = await insightsApi.getWorkload(projectId);
        setWorkloadDataPhase4(wlRes.data?.workload || []);
      } catch (e) { setWorkloadDataPhase4([]); }
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    }
  }, [projectId, admin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time updates
  useEffect(() => {
    if (!token || !projectId || !admin) return;
    
    const socketBaseUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketBaseUrl, { auth: { token }, transports: ['polling'] });

    socket.emit('project:join', { projectId });
    socket.on('task:changed', ({ projectId: pid }) => {
        if (pid === projectId) fetchStats();
    });
    socket.on('project:updated', ({ projectId: pid }) => {
        if (pid === projectId) {
            fetchProjects();
            fetchStats();
        }
    });

    return () => {
      socket.emit('project:leave', { projectId });
      socket.disconnect();
    };
  }, [token, projectId, admin, fetchStats, fetchProjects]);

  if (loading && projects.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Insights, workload, and performance metrics for your workspace.
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Workspace"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
          {!admin && projectId && (
            <Chip label="Member Access — dashboard locked" color="warning" variant="outlined" />
          )}
        </Grid>
      </Grid>

      {!admin && projectId ? (
        <Paper sx={{ p: 6, mt: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h5" color="error" sx={{ mb: 1, fontWeight: 700 }}>Access Denied</Typography>
          <Typography color="text.secondary">
            Workspace insights are only available to Workspace Admins. 
            You are currently a Member of this workspace. 
            Please select another workspace where you have Admin access.
          </Typography>
        </Paper>
      ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                { title: 'Total Tasks', value: stats.totalTasks || 0, color: theme.palette.info.main, bg: isDark ? 'rgba(2, 136, 209, 0.1)' : '#e0f2fe' },
                { title: 'Pending', value: stats.pendingTasks || 0, color: theme.palette.warning.main, bg: isDark ? 'rgba(237, 108, 2, 0.1)' : '#fef08a' },
                { title: 'Completed', value: stats.completedTasks || 0, color: theme.palette.success.main, bg: isDark ? 'rgba(46, 125, 50, 0.1)' : '#dcfce7' },
                { title: 'Overdue', value: stats.overdueTasks || 0, color: theme.palette.error.main, bg: isDark ? 'rgba(211, 47, 47, 0.1)' : '#fee2e2' }
              ].map((kpi, index) => (
                  <Grid size={{ xs: 6, md: 3 }} key={index}>
                      <Card elevation={0} sx={{ borderRadius: '16px', bgcolor: kpi.bg, border: `1px solid ${kpi.color}33`, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                          <CardContent sx={{ textAlign: 'center', p: 3 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.title}</Typography>
                              <Typography variant="h3" sx={{ fontWeight: 900, color: kpi.color }}>{kpi.value}</Typography>
                          </CardContent>
                      </Card>
                  </Grid>
              ))}
            </Grid>

            {/* Productivity and Team Workload Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={3}>
                  {insights?.summary && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Productivity Insights</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 4 }}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                            <Typography variant="h5" fontWeight="bold" color="primary">{insights.summary.avgCompletionHours}h</Typography>
                            <Typography variant="caption" color="text.secondary">Avg. Completion</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                            <Typography variant="h5" fontWeight="bold" color="success.main">{insights.summary.completedTasks}</Typography>
                            <Typography variant="caption" color="text.secondary">Tasks Done</Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                            <Typography variant="h5" fontWeight="bold" color="error.main">{insights.summary.overdueTasks}</Typography>
                            <Typography variant="caption" color="text.secondary">Overdue</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Team Workload</Typography>
                  {workloadDataPhase4.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No workload data available.</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {workloadDataPhase4.map((member, idx) => (
                        <Box key={idx} sx={{ p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '12px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">{member.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{member.role}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip size="small" label={`${member.activeTasks} tasks`} sx={{ bgcolor: 'background.paper' }} />
                            <Chip size="small" label={`${member.estimatedHours} hrs`} sx={{ bgcolor: 'background.paper' }} />
                            {member.overloaded && <Chip size="small" color="error" label="Overloaded" />}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: { xs: 3, md: 4 } }}>
                <Grid size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: { xs: 300, md: 380 }, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Active Workload (Tasks per Member)</Typography>
                    <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                        <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
                        <YAxis stroke={isDark ? '#ccc' : '#666'} allowDecimals={false} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }}
                        />
                        <Legend />
                        <Bar dataKey="Tasks" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </Box>
                </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: { xs: 300, md: 380 }, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Task Status Distribution</Typography>
                    <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                        data={stats.taskData}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="75%"
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {stats.taskData.map((entry, index) => {
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
          </>
      )}

    </Container>
  );
};

export default AdminDashboard;
