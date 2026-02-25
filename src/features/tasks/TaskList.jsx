import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, CircularProgress, Box, Chip, Button, Container, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CreateTask from './CreateTask';
import SearchBar from './SearchBar'; 
import UpdateTask from './UpdateTask';
import DeleteTask from './DeleteTask';
import { useDispatch, useSelector } from 'react-redux';
import { setTasks, setLoading as setReduxLoading } from '../../features/tasks/tasksSlice';

const API_URL = 'https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks';

const TaskList = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.items);
  const loading = useSelector((state) => state.tasks.loading);

  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const fetchTasks = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && tasks.length > 0) {
      setFilteredTasks(tasks);
      return;
    }

    dispatch(setReduxLoading(true));
    try {
      const { data } = await axios.get(API_URL);
      const validTasks = (data || []).filter(t => t.id);
      dispatch(setTasks(validTasks));
      setFilteredTasks(validTasks);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      dispatch(setReduxLoading(false));
    }
  }, [dispatch, tasks]);

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
      <CircularProgress thickness={4} size={50} sx={{ color: '#6366f1' }} />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 4, gap: 2 
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>
              Task Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              Showing <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{filteredTasks.length}</span> results
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #6366f1, #a855f7)',
              fontWeight: 'bold', borderRadius: '12px', px: 3, py: 1.2,
              textTransform: 'none',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
              '&:hover': { transform: 'translateY(-2px)', background: 'linear-gradient(45deg, #4f46e5, #9333ea)' },
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
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                {['ID', 'Task Details', 'Status', 'Actions'].map((head) => (
                  <TableCell key={head} sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task, index) => (
                <TableRow key={task.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, '& td': { borderBottom: '1px solid rgba(255,255,255,0.05)' } }}>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}>
                    #{String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ 
                        fontWeight: 700, 
                        color: task.title ? '#fff' : 'rgba(255,255,255,0.3)',
                        fontStyle: task.title ? 'normal' : 'italic'
                    }}>
                        {task.title || task.task || "Untitled Task"}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                        color: 'rgba(255,255,255,0.4)',
                        display: 'block',
                        maxWidth: '300px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {task.description || "No description provided for this task."}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={task.status === 'completada' ? 'Completed' : 'Pending'} 
                      size="small"
                      sx={{ 
                        fontWeight: 900, fontSize: '0.65rem',
                        bgcolor: task.status === 'completada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: task.status === 'completada' ? '#10b981' : '#f59e0b',
                        border: '1px solid currentColor', borderRadius: '6px'
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleEditClick(task)} size="small" sx={{ color: '#6366f1', bgcolor: 'rgba(99, 102, 241, 0.05)' }}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                      <DeleteTask taskId={task.id} onDeleteSuccess={() => fetchTasks(true)} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTasks.length === 0 && !loading && (
            <Box sx={{ py: 10, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <Typography variant="body2">No tasks found in your workspace.</Typography>
            </Box>
          )}
        </TableContainer>

        <CreateTask open={openModal} handleClose={() => setOpenModal(false)} refreshTasks={() => fetchTasks(true)} />
        {selectedTask && (
          <UpdateTask open={isEditOpen} handleClose={() => setIsEditOpen(false)} taskData={selectedTask} onUpdateSuccess={() => fetchTasks(true)} />
        )}
      </Container>
    </Box>
  );
};

export default TaskList;