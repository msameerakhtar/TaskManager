import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Paper, Typography, Box, Chip, Button, Container, IconButton, useTheme, Grid, Card, CardContent, Stack, Snackbar, Alert, ToggleButtonGroup, ToggleButton, Tooltip
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CreateTask from './CreateTask';
import SearchBar from './SearchBar'; 
import UpdateTask from './UpdateTask';
import WorkspaceBar from './WorkspaceBar';
import InsightsPanel from './InsightsPanel';
import TaskCard from './TaskCard';
import TaskTableView from './TaskTableView';
import TaskListView from './TaskListView';
import TaskCalendarView from './TaskCalendarView';
import useTaskSocket from './hooks/useTaskSocket';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setTasks, setLoading as setReduxLoading } from '../../features/tasks/tasksSlice';
import { setCurrentRole } from '../../features/auth/authSlice';
import { taskApi } from '../../api/taskApi';
import { projectApi } from '../../api/projectApi';
import { notificationApi } from '../../api/notificationApi';
import { insightsApi } from '../../api/insightsApi';

const VIEWS = ['kanban', 'table', 'list', 'calendar'];
const VIEW_STORAGE_KEY = 'tm_task_view';

const TaskList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const location = useLocation();
  const tasks = useSelector((state) => state.tasks.items);
  const loading = useSelector((state) => state.tasks.loading);
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const currentUserId = user?.id || user?._id;
  const currentRole = useSelector((state) => state.auth.currentRole);
  const isAdmin = currentRole === 'admin' || user?.systemRole === 'superadmin';

  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return VIEWS.includes(saved) ? saved : 'kanban';
  });

  const handleViewChange = (_, newView) => {
    if (!newView) return;
    setViewMode(newView);
    localStorage.setItem(VIEW_STORAGE_KEY, newView);
  };

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

  // ─── Data Fetching ────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    if (!selectedProjectId) return;
    dispatch(setReduxLoading(true));
    try {
      const response = await taskApi.getTasks(selectedProjectId);
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
  }, [dispatch, selectedProjectId]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectApi.getProjects();
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
  }, [location.search, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const p = projects.find(p => p._id === selectedProjectId);
      if (p && currentUserId) {
        const mem = p.members.find(m => String(m.userId?._id || m.userId) === String(currentUserId));
        if (mem) {
          dispatch(setCurrentRole(mem.role));
        } else if (user?.systemRole === 'superadmin') {
          dispatch(setCurrentRole('admin'));
        }
      }
    }
  }, [selectedProjectId, projects, currentUserId, dispatch]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationApi.getNotifications();
      const payload = response.data;
      if (Array.isArray(payload)) {
        setNotifications(payload);
      } else {
        setNotifications(Array.isArray(payload?.notifications) ? payload.notifications : []);
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  }, []);

  const fetchPhase4Data = useCallback(async () => {
    if (!selectedProjectId || !token) return;
    setWorkloadReady(false);
    setWorkloadError(null);
    const results = await Promise.allSettled([
      insightsApi.getWorkload(selectedProjectId),
      insightsApi.getProductivity(selectedProjectId),
      insightsApi.getCalendarLinks(selectedProjectId)
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
  }, [selectedProjectId]);

  // ─── Effects ──────────────────────────────────────────────

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
    fetchPhase4Data();
  }, [fetchTasks, fetchNotifications, fetchPhase4Data, selectedProjectId]);

  // Socket.io (extracted hook)
  useTaskSocket({
    token,
    selectedProjectId,
    fetchTasks,
    fetchProjects,
    fetchNotifications,
    fetchPhase4Data,
    setOnlineCount
  });

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

  // ─── Handlers ─────────────────────────────────────────────

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
      const { data } = await taskApi.updateTask(task.id, {
          title: task.title || task.task || '',
          description: task.description || '',
          status,
          priority: task.priority || 'medium',
          dueDate: fallbackDueDate,
          projectId: selectedProjectId || task.projectId
        });
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
        message: error.response?.data?.message || 'Task move failed. Changes reverted.',
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

  const handleMarkDone = useCallback((task) => {
    updateTaskStatus(task, 'done');
  }, [updateTaskStatus]);

  // ─── Computed Values ──────────────────────────────────────

  const kpis = useMemo(() => {
    const now = new Date();
    // For regular members, only count tasks assigned to them. For admins/superadmins, count everything.
    const relevantTasks = isAdmin 
      ? tasks 
      : tasks.filter(t => String(t.assigneeId?._id || t.assigneeId) === String(currentUserId));

    const total = relevantTasks.length;
    const pending = relevantTasks.filter((task) => task.status !== 'done').length;
    const completed = relevantTasks.filter((task) => task.status === 'done').length;
    const overdue = relevantTasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now).length;
    
    return { total, pending, completed, overdue };
  }, [tasks, isAdmin, currentUserId]);

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

  const isLocalAdmin = currentUserRole === 'admin';

  // ─── Workspace Actions ────────────────────────────────────

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const response = await projectApi.createProject(newProjectName.trim());
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
      const response = await projectApi.inviteMember(selectedProjectId, inviteEmail.trim(), inviteRole);
      const updated = response.data;
      setProjects((prev) => prev.map((p) => p._id === updated._id ? updated : p));
      setInviteEmail('');
      setInviteRole('member');
      setFeedback({ open: true, message: 'Member added to workspace.', severity: 'success' });
    } catch (error) {
      setFeedback({ open: true, message: error.response?.data?.message || 'Failed to add member.', severity: 'error' });
    }
  };

  // ─── Render ───────────────────────────────────────────────

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
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* View Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewChange}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderRadius: '10px',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '10px !important',
                  px: 1.5,
                  py: 0.8,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                },
              }}
            >
              <Tooltip title="Kanban Board">
                <ToggleButton value="kanban">
                  <ViewKanbanIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Table View">
                <ToggleButton value="table">
                  <TableRowsIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="List View">
                <ToggleButton value="list">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Calendar View">
                <ToggleButton value="calendar">
                  <CalendarMonthIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>

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
          </Stack>
        </Box>

        {/* Search & Filter Bar */}
        <Box sx={{ mb: 3 }}>
          <SearchBar tasks={tasks} onFilter={setFilteredTasks} />
        </Box>

        {/* Workspace Management Bar */}
        <WorkspaceBar
          projects={projects}
          selectedProjectId={selectedProjectId}
          setSelectedProjectId={setSelectedProjectId}
          selectedProject={selectedProject}
          onlineCount={onlineCount}
          isAdmin={isAdmin}
          newProjectName={newProjectName}
          setNewProjectName={setNewProjectName}
          handleCreateProject={handleCreateProject}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          handleInviteMember={handleInviteMember}
          isDark={isDark}
        />

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

        {/* Insights & Workload */}
        <InsightsPanel
          insights={insights}
          calendarLinks={calendarLinks}
          workloadData={workloadData}
          workloadReady={workloadReady}
          workloadError={workloadError}
          selectedProject={selectedProject}
          isDark={isDark}
          isAdmin={isAdmin}
        />

        {notifications.filter((n) => !n.isRead).slice(0, 3).map((notification) => (
          <Alert key={notification._id} severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
            {notification.message}
          </Alert>
        ))}

        {/* Tip Box — changes based on view */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 3, borderRadius: '12px', borderColor: 'primary.main', bgcolor: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.05)' }}>
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textAlign: 'center' }}>
            {viewMode === 'kanban' && '💡 Tip: Click a task card, then press ← / → arrow keys to move it between columns quickly (or drag cards).'}
            {viewMode === 'table'  && '💡 Tip: Click any column header to sort tasks. Use the action buttons on the right to edit, complete or delete.'}
            {viewMode === 'list'   && '💡 Tip: Click a group header to collapse/expand that section. Priority is shown as a colored dot on the left.'}
            {viewMode === 'calendar' && '💡 Tip: View your tasks on a calendar. Click any event to edit or update its details.'}
          </Typography>
        </Paper>

        {/* ── View Renderer ──────────────────────────────────────── */}
        {viewMode === 'kanban' && (
          <>
            <Grid container spacing={3}>
              {columns.map((column) => {
                const tasksInColumn = filteredTasks.filter((task) => task.status === column.key);
                const colColor = column.key === 'todo' ? theme.palette.info.main :
                                 column.key === 'in_progress' ? theme.palette.warning.main :
                                 theme.palette.success.main;
                const colBg = isDark
                  ? `rgba(${column.key === 'todo' ? '2,136,209' : column.key === 'in_progress' ? '237,108,2' : '46,125,50'}, 0.05)`
                  : `rgba(${column.key === 'todo' ? '2,136,209' : column.key === 'in_progress' ? '237,108,2' : '46,125,50'}, 0.03)`;
                return (
                  <Grid size={{ xs: 12, md: 4 }} key={column.key}>
                    <Paper
                      elevation={0}
                      onDragOver={(event) => { event.preventDefault(); if (hoveredColumnKey !== column.key) setHoveredColumnKey(column.key); }}
                      onDragLeave={() => { if (hoveredColumnKey === column.key) setHoveredColumnKey(null); }}
                      onDrop={(event) => handleDropToColumn(event, column.key)}
                      sx={{
                        p: 2, borderRadius: '20px', minHeight: '70vh', border: '1px solid',
                        borderColor: hoveredColumnKey === column.key ? colColor : 'divider',
                        bgcolor: hoveredColumnKey === column.key ? `${colColor}22` : colBg,
                        transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column'
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
                          <TaskCard
                            key={task.id}
                            task={task}
                            colColor={colColor}
                            highlightedTaskId={highlightedTaskId}
                            movingTaskId={movingTaskId}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onKeyDown={handleCardKeyDown}
                            onEditClick={handleEditClick}
                            onMarkDone={handleMarkDone}
                            onDeleteSuccess={fetchTasks}
                            isDark={isDark}
                          />
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
          </>
        )}

        {viewMode === 'table' && (
          <TaskTableView
            tasks={filteredTasks}
            movingTaskId={movingTaskId}
            highlightedTaskId={highlightedTaskId}
            onEditClick={handleEditClick}
            onMarkDone={handleMarkDone}
            onDeleteSuccess={fetchTasks}
          />
        )}

        {viewMode === 'list' && (
          <TaskListView
            tasks={filteredTasks}
            movingTaskId={movingTaskId}
            highlightedTaskId={highlightedTaskId}
            onEditClick={handleEditClick}
            onMarkDone={handleMarkDone}
            onDeleteSuccess={fetchTasks}
          />
        )}

        {viewMode === 'calendar' && (
          <TaskCalendarView
            tasks={filteredTasks}
            onEditClick={handleEditClick}
          />
        )}


        <CreateTask
          open={openModal}
          handleClose={() => setOpenModal(false)}
          refreshTasks={fetchTasks}
          selectedProjectId={selectedProjectId}
          projectMembers={selectedProject?.members || []}
          allTasks={tasks}
        />
        {selectedTask && (
          <UpdateTask
            open={isEditOpen}
            handleClose={() => setIsEditOpen(false)}
            taskData={selectedTask}
            onUpdateSuccess={fetchTasks}
            projectMembers={selectedProject?.members || []}
            allTasks={tasks}
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