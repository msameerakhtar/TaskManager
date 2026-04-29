import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, CircularProgress, Box, Chip, Button, Container, IconButton, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CreateTask from './CreateTask';
import SearchBar from './SearchBar'; 
import UpdateTask from './UpdateTask';
import DeleteTask from './DeleteTask';
import { useDispatch, useSelector } from 'react-redux';
import { setTasks, setLoading as setReduxLoading } from '../../features/tasks/tasksSlice';

import API_BASE_URL from '../../config/api';

const TaskList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.items);
  const loading = useSelector((state) => state.tasks.loading);
  const token = useSelector((state) => state.auth.token);

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const fetchTasks = async () => {
    dispatch(setReduxLoading(true));
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { 'x-auth-token': token }
      });
      const validTasks = response.data.map(t => ({ ...t, id: t._id }));
      dispatch(setTasks(validTasks));
      setFilteredTasks(validTasks);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      dispatch(setReduxLoading(false));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
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

        <TableContainer
          component={Paper}
          sx={{
            background: 'background.paper',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
            backgroundImage: 'none'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
                {['ID', 'Task Details', 'Status', 'Actions'].map((head) => (
                  <TableCell key={head} sx={{ color: 'text.secondary', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task, index) => (
                <TableRow key={task.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' } }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold', borderBottom: '1px solid', borderColor: 'divider' }}>
                    #{String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ 
                        fontWeight: 700, 
                        color: task.title ? 'text.primary' : 'text.secondary',
                        fontStyle: task.title ? 'normal' : 'italic'
                    }}>
                        {task.title || task.task || "Untitled Task"}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        display: 'block',
                        maxWidth: '300px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {task.description || "No description provided for this task."}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Chip 
                      label={task.status === 'completada' ? 'Completed' : 'Pending'} 
                      size="small"
                      sx={{ 
                        fontWeight: 900, fontSize: '0.65rem',
                        bgcolor: task.status === 'completada' ? 'success.main' + '1A' : 'warning.main' + '1A',
                        color: task.status === 'completada' ? 'success.main' : 'warning.main',
                        border: '1px solid currentColor', borderRadius: '6px'
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleEditClick(task)} size="small" sx={{ color: 'primary.main', bgcolor: 'primary.main' + '0D' }}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                      <DeleteTask taskId={task.id} onDeleteSuccess={fetchTasks} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTasks.length === 0 && !loading && (
            <Box sx={{ py: 10, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No tasks found in your workspace.</Typography>
            </Box>
          )}
        </TableContainer>

        <CreateTask open={openModal} handleClose={() => setOpenModal(false)} refreshTasks={fetchTasks} />
        {selectedTask && (
          <UpdateTask open={isEditOpen} handleClose={() => setIsEditOpen(false)} taskData={selectedTask} onUpdateSuccess={fetchTasks} />
        )}
      </Container>
    </Box>
  );
};

export default TaskList;