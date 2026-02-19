import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, MenuItem } from '@mui/material';
import axios from 'axios';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 400, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 24, p: 4,
};

const UpdateTask = ({ open, handleClose, taskData, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({ title: '', description: '', status: 'pendiente' });

  useEffect(() => {
    if (taskData) {
      setFormData({
        title: taskData.title || taskData.task || '',
        description: taskData.description || '',
        status: taskData.status || 'pendiente'
      });
    }
  }, [taskData, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const taskId = taskData?.id;

    if (!taskId) {
      alert("Error: Task ID missing!");
      return;
    }

    try {
      await axios.put(`https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks/${taskId}`, formData);
      onUpdateSuccess();
      handleClose();
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Update failed!");
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={2} color="#1a237e" sx={{ fontWeight: 700 }}>
          Edit Task Details
        </Typography>
        <Stack spacing={2}>
          <TextField label="Title" name="title" fullWidth value={formData.title} onChange={handleChange} />
          <TextField label="Description" name="description" fullWidth multiline rows={3} value={formData.description} onChange={handleChange} />
          <TextField select label="Status" name="status" value={formData.status} onChange={handleChange} fullWidth>
            <MenuItem value="pendiente">Pending</MenuItem>
            <MenuItem value="completada">Completed</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={handleUpdate}
            sx={{ bgcolor: '#1a237e', '&:hover': { bgcolor: '#0d1440' } }}
          >
            Update Task
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default UpdateTask;