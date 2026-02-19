import React from 'react';
import axios from 'axios';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteTask = ({ taskId, onDeleteSuccess }) => {
  const handleDelete = async () => {
    if (!taskId) {
      alert("Error: Task ID missing!");
      return;
    }

    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks/${taskId}`);
        onDeleteSuccess();
      } catch (error) {
        console.error("Delete failed:", error.response?.data || error.message);
        alert("Delete failed: Server error.");
      }
    }
  };

  return (
    <IconButton onClick={handleDelete} sx={{ color: '#d32f2f' }}>
      <DeleteIcon fontSize="small" />
    </IconButton>
  );
};

export default DeleteTask;