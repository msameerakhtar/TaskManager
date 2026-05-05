import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Paper, Typography, CircularProgress, Box, Chip, Button, Container, IconButton, useTheme, Grid, Card, CardContent, Stack, Snackbar, Alert, TextField, MenuItem, Avatar
} from '@mui/material';
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
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('task:changed', ({ projectId }) => {
      if (projectId && projectId === activeProjectRef.current) {
        fetchTasks();
      }
    });
    socket.on('presence:update', ({ projectId, onlineCount: nextOnlineCount }) => {
      if (projectId && projectId === activeProjectRef.current) {
        setOnlineCount(nextOnlineCount || 0);
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
      <CircularProgress thickness={4} size={50} sx={{ color: 'primary.main' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'background.default', transition: 'background-color 0.3s' }}>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
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
              fontWeight: 'bold', borderRadius: '12px', px: 3, py: 1.2,
              textTransform: 'none',
              boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`,
              '&:hover': { transform: 'translateY(-2px)', opacity: 0.9 },
              transition: '0.2s'
            }}
          >
            Create Task
          </Button>
        </Box>

        <SearchBar tasks={tasks} onFilter={setFilteredTasks} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Workspace / Project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((project) => (
                <MenuItem key={project._id} value={project._id}>{project.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="New Workspace Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" onClick={handleCreateProject} sx={{ height: '100%' }}>
              Add Workspace
            </Button>
          </Grid>
        </Grid>
        {selectedProject && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Invite Member (email)"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={handleInviteMember} sx={{ height: '100%' }}>
                Add Member
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Team: {selectedProject.members?.length || 0}
                </Typography>
                <Avatar sx={{ width: 10, height: 10, bgcolor: onlineCount > 0 ? 'success.main' : 'grey.500' }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {onlineCount} online
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        )}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2, borderRadius: '12px' }}><Typography variant="caption" color="text.secondary">Total</Typography><Typography variant="h6" fontWeight={800}>{kpis.total}</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2, borderRadius: '12px' }}><Typography variant="caption" color="text.secondary">Pending</Typography><Typography variant="h6" fontWeight={800}>{kpis.pending}</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2, borderRadius: '12px' }}><Typography variant="caption" color="text.secondary">Completed</Typography><Typography variant="h6" fontWeight={800}>{kpis.completed}</Typography></Paper></Grid>
          <Grid item xs={6} md={3}><Paper sx={{ p: 2, borderRadius: '12px' }}><Typography variant="caption" color="text.secondary">Overdue</Typography><Typography variant="h6" fontWeight={800}>{kpis.overdue}</Typography></Paper></Grid>
        </Grid>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: '12px',
            borderColor: 'divider',
            bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Tip: Click a task card, then press ← / → arrow keys to move it between columns (or drag cards).
          </Typography>
        </Paper>
        {calendarLinks && (
          <Paper sx={{ p: 2, borderRadius: '12px', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Calendar Integration</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button size="small" variant="outlined" href={calendarLinks.googleCalendarUrl} target="_blank" rel="noreferrer">Sync Google</Button>
              <Button size="small" variant="outlined" href={calendarLinks.outlookCalendarUrl} target="_blank" rel="noreferrer">Sync Outlook</Button>
              <Button size="small" variant="outlined" href={calendarLinks.icsUrl} target="_blank" rel="noreferrer">Download ICS</Button>
            </Stack>
          </Paper>
        )}
        {selectedProject && (
          <Paper sx={{ p: 2, borderRadius: '12px', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Workload View</Typography>
            {!workloadReady && (
              <Typography variant="body2" color="text.secondary">Loading workload…</Typography>
            )}
            {workloadReady && workloadError && (
              <Alert severity="warning" sx={{ mb: workloadData.length ? 1 : 0 }}>{workloadError}</Alert>
            )}
            {workloadReady && !workloadError && workloadData.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Each workspace member is listed here with open assigned tasks and estimated hours.
                If you only see this message, invite members and assign tasks using &quot;Assign To&quot; when creating or editing a task.
              </Typography>
            )}
            {workloadData.length > 0 && (
              <Stack spacing={1}>
                {workloadData.map((member, idx) => (
                  <Box
                    key={member.userId ? String(member.userId) : `member-${idx}`}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
                  >
                    <Typography variant="body2">{member.name} ({member.role})</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`${member.activeTasks} tasks`} />
                      <Chip size="small" label={`${member.estimatedHours}h`} />
                      {member.overloaded && <Chip size="small" color="error" label="Overloaded" />}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}
        {insights?.summary && (
          <Paper sx={{ p: 2, borderRadius: '12px', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Productivity Insights</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip label={`Avg completion: ${insights.summary.avgCompletionHours}h`} />
              <Chip label={`Completed: ${insights.summary.completedTasks}`} color="success" />
              <Chip label={`Overdue: ${insights.summary.overdueTasks}`} color="warning" />
            </Stack>
          </Paper>
        )}
        {notifications.filter((n) => !n.isRead).slice(0, 3).map((notification) => (
          <Alert key={notification._id} severity="warning" sx={{ mb: 1 }}>
            {notification.message}
          </Alert>
        ))}
        <Grid container spacing={2}>
          {columns.map((column) => {
            const tasksInColumn = filteredTasks.filter((task) => task.status === column.key);
            return (
              <Grid item xs={12} md={4} key={column.key}>
                <Paper
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (hoveredColumnKey !== column.key) {
                      setHoveredColumnKey(column.key);
                    }
                  }}
                  onDragLeave={() => {
                    if (hoveredColumnKey === column.key) {
                      setHoveredColumnKey(null);
                    }
                  }}
                  onDrop={(event) => handleDropToColumn(event, column.key)}
                  sx={{
                    p: 2,
                    borderRadius: '18px',
                    minHeight: 450,
                    border: '1px solid',
                    borderColor: hoveredColumnKey === column.key ? 'primary.main' : 'divider',
                    backgroundImage: 'none',
                    bgcolor: hoveredColumnKey === column.key
                      ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)')
                      : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)'),
                    transition: 'border-color 0.2s ease, background-color 0.2s ease'
                  }}
                >
                  <Typography sx={{ fontWeight: 800, mb: 2 }}>
                    {column.label} ({tasksInColumn.length})
                  </Typography>
                  {draggedTaskId && hoveredColumnKey === column.key && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1.5,
                        color: 'primary.main',
                        fontWeight: 700
                      }}
                    >
                      Drop here
                    </Typography>
                  )}
                  <Stack spacing={1.5}>
                    {tasksInColumn.map((task) => (
                      <Card
                        key={task.id}
                        id={`task-card-${task.id}`}
                        draggable={movingTaskId !== task.id}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragEnd={handleDragEnd}
                        onKeyDown={(event) => handleCardKeyDown(event, task)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${task.title || task.task || 'Task'} - use left and right arrow keys to move status`}
                        sx={{
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'grab',
                          opacity: movingTaskId === task.id ? 0.6 : 1,
                          boxShadow: highlightedTaskId === task.id
                            ? `0 0 0 2px ${theme.palette.primary.main}, 0 0 18px ${theme.palette.primary.main}66`
                            : 'none',
                          transition: 'box-shadow 0.25s ease',
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: '2px'
                          },
                          '&:active': { cursor: 'grabbing' }
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {task.title || task.task || 'Untitled Task'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                            {task.description || 'No description'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip size="small" label={`Priority: ${task.priority || 'medium'}`} color={priorityColorMap[task.priority] || 'default'} />
                            <Chip size="small" label={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`} />
                            {task.assigneeId?.fullName && <Chip size="small" label={`Assignee: ${task.assigneeId.fullName}`} />}
                            {task.approvalStatus === 'pending' && (
                              <Chip size="small" color="warning" label="Approval pending" />
                            )}
                            {task.approvalStatus === 'rejected' && (
                              <Chip size="small" color="error" label="Completion rejected" />
                            )}
                            {(task.escalationLevel > 0) && (
                              <Chip size="small" color="error" variant="outlined" label={`SLA L${task.escalationLevel}`} />
                            )}
                            {movingTaskId === task.id && (
                              <Chip
                                size="small"
                                label="Moving..."
                                color="info"
                                sx={{
                                  '@keyframes movingPulse': {
                                    '0%': { opacity: 0.6, transform: 'scale(1)' },
                                    '50%': { opacity: 1, transform: 'scale(1.03)' },
                                    '100%': { opacity: 0.6, transform: 'scale(1)' }
                                  },
                                  animation: 'movingPulse 1.2s ease-in-out infinite'
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {task.status !== 'done' && (
                              <IconButton
                                onClick={() => updateTaskStatus(task, 'done')}
                                size="small"
                                disabled={movingTaskId === task.id}
                                sx={{ color: 'success.main', bgcolor: 'success.main' + '14' }}
                                title="Mark Complete"
                              >
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton onClick={() => handleEditClick(task)} size="small" disabled={movingTaskId === task.id} sx={{ color: 'primary.main', bgcolor: 'primary.main' + '0D' }}>
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                            {movingTaskId === task.id ? (
                              <IconButton size="small" disabled sx={{ color: 'text.disabled', bgcolor: 'action.hover' }}>
                                <CircularProgress size={16} />
                              </IconButton>
                            ) : (
                              <DeleteTask taskId={task.id} onDeleteSuccess={fetchTasks} />
                            )}
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