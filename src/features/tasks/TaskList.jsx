import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Paper, Typography, Box, Chip, Button, Container, IconButton, useTheme, Grid, Card, CardContent, Stack, Snackbar, Alert, TextField, MenuItem, Avatar, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CreateTask from './CreateTask';
import SearchBar from './SearchBar'; 
import UpdateTask from './UpdateTask';
import DeleteTask from './DeleteTask';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setTasks, setLoading as setReduxLoading } from '../../features/tasks/tasksSlice';

import API_BASE_URL from '../../config/api';

const TaskList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const location = useLocation();
  const tasks = useSelector((state) => state.tasks.items);
  const loading = useSelector((state) => state.tasks.loading);
  const token = useSelector((state) => state.auth.token);
  const currentUserId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [hoveredColumnKey, setHoveredColumnKey] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [notifications, setNotifications] = useState([]);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const socketRef = useRef(null);
  const activeProjectRef = useRef(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [workloadData, setWorkloadData] = useState([]);
  const [workloadError, setWorkloadError] = useState(null);
  const [workloadReady, setWorkloadReady] = useState(false);
  const [insights, setInsights] = useState(null);
  const [calendarLinks, setCalendarLinks] = useState(null);

  const normalizeStatus = (status) => {
    if (status === 'pendiente') return 'todo';
    if (status === 'completada') return 'done';
    return status || 'todo';
  };

  const columns = [
    { key: 'todo', label: 'Todo' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' }
  ];
  const statusOrder = ['todo', 'in_progress', 'done'];
  const statusLabel = {
    todo: 'Todo',
    in_progress: 'In Progress',
    done: 'Done'
  };

  const priorityColorMap = {
    low: 'success',
    medium: 'warning',
    high: 'error'
  };

  const fetchTasks = useCallback(async () => {
    if (!selectedProjectId) return;
    dispatch(setReduxLoading(true));
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks?projectId=${selectedProjectId}`, {
        headers: { 'x-auth-token': token }
      });
      const validTasks = response.data.map((t) => ({
        ...t,
        id: t._id,
        status: normalizeStatus(t.status),
        priority: t.priority || 'medium'
      }));
      dispatch(setTasks(validTasks));
      setFilteredTasks(validTasks);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      dispatch(setReduxLoading(false));
    }
  }, [dispatch, token, selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { 'x-auth-token': token }
      });
      const projectList = response.data || [];
      setProjects(projectList);

      const params = new URLSearchParams(location.search);
      const urlProjectId = params.get('projectId');
      const urlIsMember = urlProjectId && projectList.some((p) => p._id === urlProjectId);

      if (urlIsMember) {
        setSelectedProjectId(urlProjectId);
      } else if (!selectedProjectId && projectList.length > 0) {
        setSelectedProjectId(projectList[0]._id);
      }
    } catch (error) {
      console.error('Project fetch error:', error);
    }
  }, [token, location.search, selectedProjectId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { 'x-auth-token': token }
      });
      const payload = response.data;
      if (Array.isArray(payload)) {
        setNotifications(payload);
      } else {
        setNotifications(Array.isArray(payload?.notifications) ? payload.notifications : []);
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  }, [token]);

  const fetchPhase4Data = useCallback(async () => {
    if (!selectedProjectId || !token) return;
    setWorkloadReady(false);
    setWorkloadError(null);
    const headers = { headers: { 'x-auth-token': token } };
    const results = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/insights/workload/${selectedProjectId}`, headers),
      axios.get(`${API_BASE_URL}/insights/productivity/${selectedProjectId}`, headers),
      axios.get(`${API_BASE_URL}/calendar/project/${selectedProjectId}/links`, headers)
    ]);

    const [wl, prod, cal] = results;
    if (wl.status === 'fulfilled') {
      setWorkloadError(null);
      setWorkloadData(wl.value.data?.workload || []);
    } else {
      console.error('Workload fetch failed:', wl.reason?.message || wl.reason);
      setWorkloadData([]);
      const status = wl.reason?.response?.status;
      const msg = wl.reason?.response?.data?.message;
      setWorkloadError(
        msg
          || (status === 401 ? 'Not logged in — refresh the page and sign in again.' : null)
          || (status === 403 ? 'You are not a member of this workspace.' : null)
          || 'Could not load workload. Start the backend (e.g. npm run dev in /backend on port 5000) and ensure API URL matches.'
      );
    }
    setWorkloadReady(true);
    if (prod.status === 'fulfilled') {
      setInsights(prod.value.data || null);
    } else {
      console.error('Productivity fetch failed:', prod.reason?.message || prod.reason);
      setInsights(null);
    }
    if (cal.status === 'fulfilled') {
      setCalendarLinks(cal.value.data || null);
    } else {
      console.error('Calendar links fetch failed:', cal.reason?.message || cal.reason);
      setCalendarLinks(null);
    }
  }, [selectedProjectId, token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
    fetchPhase4Data();
  }, [fetchTasks, fetchNotifications, fetchPhase4Data, selectedProjectId]);

  useEffect(() => {
    if (!token) return undefined;
    const socketBaseUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketBaseUrl, {
      auth: { token },
      transports: ['polling']
    });
    socketRef.current = socket;

    socket.on('task:changed', ({ projectId }) => {
      if (projectId && projectId === activeProjectRef.current) {
        fetchTasks();
        fetchPhase4Data();
      }
    });
    socket.on('presence:update', ({ projectId, onlineCount: nextOnlineCount }) => {
      if (projectId && projectId === activeProjectRef.current) {
        setOnlineCount(nextOnlineCount || 0);
      }
    });
    socket.on('notification:new', () => {
      fetchNotifications();
    });
    socket.on('project:updated', ({ projectId }) => {
      if (projectId && projectId === activeProjectRef.current) {
        fetchProjects();
        fetchPhase4Data();
      }
    });

    return () => {
      if (activeProjectRef.current) {
        socket.emit('project:leave', { projectId: activeProjectRef.current });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchTasks]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedProjectId) return;
    if (activeProjectRef.current && activeProjectRef.current !== selectedProjectId) {
      socket.emit('project:leave', { projectId: activeProjectRef.current });
    }
    socket.emit('project:join', { projectId: selectedProjectId });
    activeProjectRef.current = selectedProjectId;
    setOnlineCount(0);
  }, [selectedProjectId]);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  /** Refetch when Enterprise (or another tab) approves/rejects — BroadcastChannel + same-tab event. */
  useEffect(() => {
    const runRefresh = (detailProjectId) => {
      if (!selectedProjectId) return;
      if (detailProjectId && String(detailProjectId) !== String(selectedProjectId)) return;
      fetchTasks();
      fetchNotifications();
    };

    const onWindowSync = (ev) => {
      runRefresh(ev.detail?.projectId);
    };

    window.addEventListener('tm-tasks-sync', onWindowSync);

    let bc;
    try {
      bc = new BroadcastChannel('tm-tasks-sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'tasks-changed') {
          runRefresh(event.data.projectId);
        }
      };
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener('tm-tasks-sync', onWindowSync);
      try {
        bc?.close();
      } catch {
        /* ignore */
      }
    };
  }, [selectedProjectId, fetchTasks, fetchNotifications]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const highlightTask = searchParams.get('highlightTask');
    if (!highlightTask) return;

    setHighlightedTaskId(highlightTask);
    const target = document.getElementById(`task-card-${highlightTask}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = setTimeout(() => setHighlightedTaskId(null), 3500);
    return () => clearTimeout(timer);
  }, [location.search, tasks]);

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  const updateTaskStatus = async (task, status) => {
    if (!task || task.status === status) {
      return;
    }
    setMovingTaskId(task.id);
    const previousTasks = tasks;
    const previousFilteredTasks = filteredTasks;
    const optimisticTasks = tasks.map((item) =>
      item.id === task.id ? { ...item, status } : item
    );
    const optimisticFilteredTasks = filteredTasks.map((item) =>
      item.id === task.id ? { ...item, status } : item
    );

    dispatch(setTasks(optimisticTasks));
    setFilteredTasks(optimisticFilteredTasks);

    try {
      const fallbackDueDate = task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const { data } = await axios.put(
        `${API_BASE_URL}/tasks/${task.id}`,
        {
          title: task.title || task.task || '',
          description: task.description || '',
          status,
          priority: task.priority || 'medium',
          dueDate: fallbackDueDate,
          projectId: selectedProjectId || task.projectId
        },
        { headers: { 'x-auth-token': token } }
      );
      if (data?.requiresApproval) {
        dispatch(setTasks(previousTasks));
        setFilteredTasks(previousFilteredTasks);
        setFeedback({
          open: true,
          message: 'Completion sent for admin approval. Task stays in progress until approved.',
          severity: 'info'
        });
        await fetchTasks();
        return;
      }
      setFeedback({
        open: true,
        message: `Task moved to ${statusLabel[status] || 'new status'}.`,
        severity: 'success'
      });
      await fetchTasks();
    } catch (error) {
      dispatch(setTasks(previousTasks));
      setFilteredTasks(previousFilteredTasks);
      setFeedback({
        open: true,
        message: 'Task move failed. Changes reverted.',
        severity: 'error'
      });
      console.error('Failed to update status:', error);
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/plain', taskId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setHoveredColumnKey(null);
  };

  const handleDropToColumn = async (event, columnKey) => {
    const droppedTaskId = draggedTaskId || event.dataTransfer.getData('text/plain');
    if (!droppedTaskId) return;
    const taskToMove = tasks.find((task) => task.id === droppedTaskId);
    setDraggedTaskId(null);
    setHoveredColumnKey(null);
    if (!taskToMove) return;
    await updateTaskStatus(taskToMove, columnKey);
  };

  const handleCardKeyDown = async (event, task) => {
    if (!task || movingTaskId === task.id) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1) return;

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= statusOrder.length) return;

    await updateTaskStatus(task, statusOrder[nextIndex]);
  };

  const kpis = useMemo(() => {
    const now = new Date();
    const total = tasks.length;
    const pending = tasks.filter((task) => task.status !== 'done').length;
    const completed = tasks.filter((task) => task.status === 'done').length;
    const overdue = tasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now).length;
    return { total, pending, completed, overdue };
  }, [tasks]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const currentUserRole = useMemo(() => {
    if (!selectedProject || !currentUserId) return null;
    const member = selectedProject.members?.find(
      (m) => (m.userId?._id || m.userId)?.toString() === currentUserId.toString()
    );
    return member?.role || null;
  }, [selectedProject, currentUserId]);

  const isAdmin = currentUserRole === 'admin';

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/projects`, {
        name: newProjectName.trim()
      }, {
        headers: { 'x-auth-token': token }
      });
      const created = response.data;
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created._id);
      setNewProjectName('');
      setFeedback({ open: true, message: 'Workspace created successfully.', severity: 'success' });
    } catch (error) {
      setFeedback({ open: true, message: error.response?.data?.message || 'Failed to create workspace.', severity: 'error' });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedProjectId || !inviteEmail.trim()) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/projects/${selectedProjectId}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole
      }, {
        headers: { 'x-auth-token': token }
      });
      const updated = response.data;
      setProjects((prev) => prev.map((p) => p._id === updated._id ? updated : p));
      setInviteEmail('');
      setInviteRole('member');
      setFeedback({ open: true, message: 'Member added to workspace.', severity: 'success' });
    } catch (error) {
      setFeedback({ open: true, message: error.response?.data?.message || 'Failed to add member.', severity: 'error' });
    }
  };

  if (loading && tasks.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CustomLoader size={80} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default', transition: 'background-color 0.3s' }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 4, gap: 2 
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: 'text.primary' }}>
              Task Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Showing <span style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>{filteredTasks.length}</span> results
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              fontWeight: 'bold', borderRadius: '12px', px: 3, py: 1.2, textTransform: 'none',
              boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`,
              '&:hover': { transform: 'translateY(-2px)', opacity: 0.9 }, transition: '0.2s'
            }}
          >
            Create Task
          </Button>
        </Box>

        {/* Search & Filter Bar */}
        <Box sx={{ mb: 3 }}>
          <SearchBar tasks={tasks} onFilter={setFilteredTasks} />
        </Box>

        {/* Workspace Management Bar */}
        <Paper sx={{ p: 2.5, mb: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'background.paper' : '#f8fafc' }} elevation={0}>
            <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 1, display: 'block', color: 'text.secondary' }}>Current Workspace</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            select fullWidth size="small"
                            value={selectedProjectId || ''}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                            {projects.map((project) => (
                                <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
                            ))}
                        </TextField>
                        {selectedProject && (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 80 }}>
                                <Avatar sx={{ width: 10, height: 10, bgcolor: onlineCount > 0 ? 'success.main' : 'grey.500' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                    {onlineCount} online
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                </Grid>
                
                <Grid size={{ xs: 12, md: 3 }} sx={{ opacity: isAdmin ? 1 : 0.5, pointerEvents: isAdmin ? 'auto' : 'none' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'text.secondary' }}>Create New Workspace</Typography>
                        {!isAdmin && <Chip label="Admin Only" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <TextField fullWidth size="small" placeholder="Workspace Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} disabled={!isAdmin} />
                        <Button variant="outlined" onClick={handleCreateProject} sx={{ minWidth: '90px' }} disabled={!isAdmin}>Create</Button>
                    </Stack>
                </Grid>

                {selectedProject && (
                    <Grid size={{ xs: 12, md: 5 }} sx={{ opacity: isAdmin ? 1 : 0.5, pointerEvents: isAdmin ? 'auto' : 'none' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', color: 'text.secondary' }}>
                                Invite to Workspace (Team Size: {selectedProject.members?.length || 0})
                            </Typography>
                            {!isAdmin && <Chip label="Admin Only" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <TextField fullWidth size="small" placeholder="Enter email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} disabled={!isAdmin} />
                            <TextField select size="small" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} sx={{ minWidth: '130px' }} disabled={!isAdmin}>
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </TextField>
                            <Button variant="contained" color="primary" onClick={handleInviteMember} sx={{ minWidth: '100px', boxShadow: 'none' }} disabled={!isAdmin}>Invite</Button>
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </Paper>

        {/* KPIs */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { title: 'Total Tasks', value: kpis.total, color: theme.palette.info.main, bg: isDark ? 'rgba(2, 136, 209, 0.1)' : '#e0f2fe' },
            { title: 'Pending', value: kpis.pending, color: theme.palette.warning.main, bg: isDark ? 'rgba(237, 108, 2, 0.1)' : '#fef08a' },
            { title: 'Completed', value: kpis.completed, color: theme.palette.success.main, bg: isDark ? 'rgba(46, 125, 50, 0.1)' : '#dcfce7' },
            { title: 'Overdue', value: kpis.overdue, color: theme.palette.error.main, bg: isDark ? 'rgba(211, 47, 47, 0.1)' : '#fee2e2' }
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

        {/* Middle Section (Insights & Workload) */}
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
                    
                    {calendarLinks && (
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Calendar Sync</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button variant="contained" color="primary" href={calendarLinks.googleCalendarUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Sync Google</Button>
                            <Button variant="outlined" href={calendarLinks.outlookCalendarUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Sync Outlook</Button>
                            <Button variant="outlined" href={calendarLinks.icsUrl} target="_blank" sx={{ borderRadius: '8px', textTransform: 'none' }}>Download ICS</Button>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
                {selectedProject && (
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Team Workload</Typography>
                        {!workloadReady ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CustomLoader size={30} /></Box>
                        ) : workloadError ? (
                            <Alert severity="warning">{workloadError}</Alert>
                        ) : workloadData.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No workload data available. Invite members and assign tasks.</Typography>
                        ) : (
                            <Stack spacing={2}>
                                {workloadData.map((member, idx) => (
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
                )}
            </Grid>
        </Grid>

        {notifications.filter((n) => !n.isRead).slice(0, 3).map((notification) => (
          <Alert key={notification._id} severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
            {notification.message}
          </Alert>
        ))}

        {/* Tip Box */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 3, borderRadius: '12px', borderColor: 'primary.main', bgcolor: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.05)' }}>
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textAlign: 'center' }}>
            💡 Tip: Click a task card, then press ← / → arrow keys to move it between columns quickly (or drag cards).
          </Typography>
        </Paper>

        {/* Kanban Board */}
        <Grid container spacing={3}>
          {columns.map((column) => {
            const tasksInColumn = filteredTasks.filter((task) => task.status === column.key);
            
            // Define column theme colors
            const colColor = column.key === 'todo' ? theme.palette.info.main : 
                             column.key === 'in_progress' ? theme.palette.warning.main : 
                             theme.palette.success.main;
            const colBg = isDark ? `rgba(${column.key === 'todo' ? '2,136,209' : column.key === 'in_progress' ? '237,108,2' : '46,125,50'}, 0.05)` 
                                 : `rgba(${column.key === 'todo' ? '2,136,209' : column.key === 'in_progress' ? '237,108,2' : '46,125,50'}, 0.03)`;

            return (
              <Grid size={{ xs: 12, md: 4 }} key={column.key}>
                <Paper
                  elevation={0}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (hoveredColumnKey !== column.key) setHoveredColumnKey(column.key);
                  }}
                  onDragLeave={() => {
                    if (hoveredColumnKey === column.key) setHoveredColumnKey(null);
                  }}
                  onDrop={(event) => handleDropToColumn(event, column.key)}
                  sx={{
                    p: 2,
                    borderRadius: '20px',
                    minHeight: '70vh',
                    border: '1px solid',
                    borderColor: hoveredColumnKey === column.key ? colColor : 'divider',
                    bgcolor: hoveredColumnKey === column.key ? `${colColor}22` : colBg,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 1.5, borderBottom: '2px solid', borderColor: `${colColor}33` }}>
                    <Typography component="div" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colColor }} />
                      {column.label}
                    </Typography>
                    <Chip size="small" label={tasksInColumn.length} sx={{ fontWeight: 'bold', bgcolor: `${colColor}22`, color: colColor, borderRadius: '8px' }} />
                  </Box>

                  {draggedTaskId && hoveredColumnKey === column.key && (
                    <Box sx={{ mb: 2, p: 2, border: '2px dashed', borderColor: colColor, borderRadius: '12px', textAlign: 'center', bgcolor: `${colColor}11` }}>
                      <Typography variant="caption" sx={{ color: colColor, fontWeight: 700 }}>Drop task here</Typography>
                    </Box>
                  )}

                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    {tasksInColumn.map((task) => (
                      <Card
                        key={task.id}
                        id={`task-card-${task.id}`}
                        elevation={0}
                        draggable={movingTaskId !== task.id}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragEnd={handleDragEnd}
                        onKeyDown={(event) => handleCardKeyDown(event, task)}
                        tabIndex={0}
                        sx={{
                          borderRadius: '16px',
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          cursor: 'grab',
                          opacity: movingTaskId === task.id ? 0.6 : 1,
                          boxShadow: highlightedTaskId === task.id
                            ? `0 0 0 2px ${theme.palette.primary.main}, 0 4px 20px ${theme.palette.primary.main}40`
                            : isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: isDark ? '0 6px 16px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
                            borderColor: colColor
                          },
                          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: '2px' },
                          '&:active': { cursor: 'grabbing', transform: 'scale(0.98)' }
                        }}
                      >
                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                             <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.3, color: 'text.primary' }}>
                               {task.title || task.task || 'Untitled Task'}
                             </Typography>
                             <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {task.status !== 'done' && (
                                  <IconButton
                                    onClick={() => updateTaskStatus(task, 'done')}
                                    size="small"
                                    disabled={movingTaskId === task.id}
                                    sx={{ color: 'success.main', bgcolor: 'success.main' + '1A', '&:hover': { bgcolor: 'success.main' + '33' }, width: 28, height: 28 }}
                                    title="Mark Complete"
                                  >
                                    <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                )}
                             </Box>
                          </Box>

                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description || 'No description provided.'}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Chip size="small" label={task.priority?.toUpperCase() || 'MEDIUM'} sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 0.5, color: priorityColorMap[task.priority] ? `${priorityColorMap[task.priority]}.main` : 'text.primary', bgcolor: priorityColorMap[task.priority] ? `${priorityColorMap[task.priority]}.main` + '1A' : 'action.selected' }} />
                            {task.dueDate && <Chip size="small" label={new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} sx={{ fontSize: '0.65rem', fontWeight: 600, bgcolor: 'action.hover' }} />}
                            {task.approvalStatus === 'pending' && <Chip size="small" color="warning" label="Approval pending" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
                            {task.approvalStatus === 'rejected' && <Chip size="small" color="error" label="Rejected" sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
                            {task.escalationLevel > 0 && <Chip size="small" color="error" variant="outlined" label={`SLA L${task.escalationLevel}`} sx={{ fontSize: '0.65rem', fontWeight: 600 }} />}
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {task.assigneeId ? (
                                <>
                                  <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: 'primary.main', fontWeight: 'bold' }}>
                                    {task.assigneeId.fullName ? task.assigneeId.fullName.charAt(0).toUpperCase() : 'A'}
                                  </Avatar>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    {task.assigneeId.fullName?.split(' ')[0] || 'Assignee'}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>Unassigned</Typography>
                              )}
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton onClick={() => handleEditClick(task)} size="small" disabled={movingTaskId === task.id} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.main' + '1A' } }}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              {movingTaskId === task.id ? (
                                <IconButton size="small" disabled><CustomLoader size={16} /></IconButton>
                              ) : (
                                <DeleteTask taskId={task.id} onDeleteSuccess={fetchTasks} />
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        {filteredTasks.length === 0 && !loading && (
          <Box sx={{ py: 10, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No tasks found in your workspace.</Typography>
          </Box>
        )}

        <CreateTask
          open={openModal}
          handleClose={() => setOpenModal(false)}
          refreshTasks={fetchTasks}
          selectedProjectId={selectedProjectId}
          projectMembers={selectedProject?.members || []}
        />
        {selectedTask && (
          <UpdateTask
            open={isEditOpen}
            handleClose={() => setIsEditOpen(false)}
            taskData={selectedTask}
            onUpdateSuccess={fetchTasks}
            projectMembers={selectedProject?.members || []}
          />
        )}
        <Snackbar
          open={feedback.open}
          autoHideDuration={2500}
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={feedback.severity}
            variant="filled"
            sx={{ borderRadius: '10px', fontWeight: 600 }}
            onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          >
            {feedback.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default TaskList;