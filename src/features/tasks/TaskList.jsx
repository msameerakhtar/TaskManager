import React, { useEffect, useState } from 'react';
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

const TaskList = () => {
  const [openModal, setOpenModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.items);
  const loading = useSelector((state) => state.tasks.loading);

  const fetchTasks = async () => {
    dispatch(setReduxLoading(true));
    try {
      const response = await axios.get('https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks');
      const rawData = response.data || [];
      
      const validTasks = rawData.filter(task => {
        const id = task.id;
        return id !== null && id !== undefined && id !== '';
      });

      dispatch(setTasks(validTasks));
    } catch (error) {
      console.error("Error fetching data:", error);
      dispatch(setReduxLoading(false));
    }
  };

  const handleEditClick = (task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} size={60} />
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e', letterSpacing: '0.5px' }}>
              📋 Task Management Dashboard
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Viewing {filteredTasks.length} tasks
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: '#1a237e', fontWeight: 'bold', borderRadius: 2, px: 3, '&:hover': { bgcolor: '#0d1440' } }}
          >
            Create Task
          </Button>
        </Box>

        <SearchBar tasks={tasks} onFilter={setFilteredTasks} />

        <TableContainer
          component={Paper}
          sx={{
            boxShadow: '0px 10px 30px rgba(0,0,0,0.1)',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#1a237e' }}>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Task Details</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task, index) => (
                <TableRow
                  key={task.id || index}
                  hover
                  sx={{
                    '&:nth-of-type(even)': { bgcolor: '#fafafa' },
                    '&:last-child td, &:last-child th': { border: 0 },
                    transition: '0.3s',
                    '&:hover': { bgcolor: '#e8eaf6 !important' }
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#555' }}>
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#333' }}>
                      {task.title || task.task || "No Title"}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        {task.description}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={task.status === 'completada' ? 'Completed' : 'Pending'}
                      color={task.status === 'completada' ? 'success' : 'warning'}
                      variant="contained"
                      sx={{ fontWeight: 'bold', minWidth: '100px', fontSize: '0.75rem' }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <IconButton onClick={() => handleEditClick(task)} color="primary" size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <DeleteTask 
                        taskId={task.id} 
                        onDeleteSuccess={fetchTasks} 
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    No tasks found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <CreateTask
          open={openModal}
          handleClose={() => setOpenModal(false)}
          refreshTasks={fetchTasks}
        />

        <UpdateTask 
          open={isEditOpen} 
          handleClose={() => setIsEditOpen(false)} 
          taskData={selectedTask}
          onUpdateSuccess={fetchTasks}
        />
      </Container>
    </Box>
  );
};

export default TaskList;