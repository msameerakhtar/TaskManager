import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ tasks, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        const filtered = tasks.filter((task) => {
          const title = (task.title || task.task || "").toLowerCase();
          const description = (task.description || "").toLowerCase();
          return title.includes(searchTerm.toLowerCase()) || description.includes(searchTerm.toLowerCase());
        });
        onFilter(filtered);
      } else {
        onFilter(tasks);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, tasks, onFilter]);

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search tasks by title or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          bgcolor: 'white',
          borderRadius: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#e0e0e0' },
            '&:hover fieldset': { borderColor: '#1a237e' },
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#1a237e' }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;