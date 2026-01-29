import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Typography, CircularProgress, Box, Chip 
} from '@mui/material';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.request({
          method: 'GET',
          url: 'https://task-manager-api3.p.rapidapi.com/',
          headers: {
            'x-rapidapi-key': 'c2b5fe3070msh7ca68c6210a1bb1p1f7554jsn29ef05eade98',
            'x-rapidapi-host': 'task-manager-api3.p.rapidapi.com'
          }
        });
        setTasks(response.data.data || []);
      } catch (error) {
        console.error("There is error while fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress thickness={5} size={60} />
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxWidth: 1000, 
          margin: 'auto', 
          boxShadow: '0px 10px 30px rgba(0,0,0,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}
      >
        <Box sx={{ p: 3, bgcolor: '#ffffff', borderBottom: '2px solid #f0f0f0' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e', letterSpacing: '0.5px' }}>
            📋 Task Management Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Viewing {tasks.length} active tasks from the system
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#1a237e' }}>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>ID</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>Task Name</TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task, index) => (
              <TableRow 
                key={task._id || index} 
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
                <TableCell sx={{ fontSize: '0.95rem', color: '#333' }}>
                  {task.task || task.title || "No Title"}
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={task.completed ? 'Completed' : 'Pending'} 
                    color={task.completed ? 'success' : 'warning'}
                    variant="contained"
                    sx={{ 
                      fontWeight: 'bold', 
                      minWidth: '100px',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TaskList;