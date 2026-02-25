import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ tasks, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      onFilter(tasks);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const filtered = tasks.filter((task) => {
      const title = (task.title || task.task || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      return title.includes(lowerTerm) || description.includes(lowerTerm);
    });

    onFilter(filtered);
  }, [searchTerm, tasks, onFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [handleSearch]);

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search tasks by title or description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            color: '#fff',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            '& fieldset': { 
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
            },
            '&:hover fieldset': { 
              borderColor: 'rgba(99, 102, 241, 0.5)',
            },
            '&.Mui-focused fieldset': { 
              borderColor: '#6366f1',
              borderWidth: '1px'
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'rgba(255, 255, 255, 0.4)',
            opacity: 1,
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#6366f1', ml: 1 }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;