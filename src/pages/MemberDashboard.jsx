import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, TextField, MenuItem, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../api/axiosInstance';
import api from '../api/axiosInstance';
import { projectApi } from '../api/projectApi';
import CustomLoader from '../components/CustomLoader';

const MemberDashboard = () => {
  const token = useSelector(state => state.auth.token);
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTasks: 0, pendingTasks: 0, taskData: [], priorityData: [] });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await projectApi.getProjects();
      setProjects(data);
      if (!projectId && data.length > 0) {
        setProjectId(data[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchStats = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await api.get('/projects/' + projectId + '/member-stats');
      setStats(res.data);
    } catch (err) {
      console.error('MemberDashboard fetch error:', err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time updates
  useEffect(() => {
    if (!token || !projectId) return;
    
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
  }, [token, projectId, fetchStats, fetchProjects]);

  if (loading && projects.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CustomLoader size={60} /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
        My Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your personal workload and task insights for the selected workspace.
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
      </Grid>

      {projects.length === 0 ? (
        <Paper sx={{ p: 6, mt: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h5" color="text.secondary">No workspaces found.</Typography>
          <Typography color="text.secondary">You need to be part of a workspace to view your tasks.</Typography>
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

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: { xs: 3, md: 4 } }}>
              <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: { xs: 300, md: 380 }, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Tasks by Priority</Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                      <XAxis dataKey="name" stroke={isDark ? '#ccc' : '#666'} />
                      <YAxis stroke={isDark ? '#ccc' : '#666'} allowDecimals={false} />
                      <RechartsTooltip 
                          contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ccc', borderRadius: 8 }}
                      />
                      <Legend />
                      <Bar dataKey="Tasks" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]}>
                        {
                          stats.priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={
                              entry.name === 'High' ? theme.palette.error.main :
                              entry.name === 'Medium' ? theme.palette.warning.main :
                              theme.palette.success.main
                            } />
                          ))
                        }
                      </Bar>
                      </BarChart>
                  </ResponsiveContainer>
                  </Box>
              </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: { xs: 300, md: 380 }, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>My Task Status</Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
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

export default MemberDashboard;
