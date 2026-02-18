import React from 'react';
import axios from 'axios';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const DeleteTask = ({ taskId, onDeleteSuccess }) => {
  const handleDelete = async () => {
    if (!taskId || taskId === "undefined") {
      alert("Error: Task ID missing!");
      return;
    }

    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.request({
          method: 'DELETE',
          url: `https://task-manager-api3.p.rapidapi.com/${taskId}`,
          headers: {
            'x-rapidapi-key': 'fb81aafcebmshf175382b298b8b6p1e09cdjsnad1fd954cea4',
            'x-rapidapi-host': 'task-manager-api3.p.rapidapi.com'
          }
        });
        
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