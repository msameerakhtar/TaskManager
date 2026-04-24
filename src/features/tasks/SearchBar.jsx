import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, Box, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ tasks, onFilter }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '16px',
            color: 'text.primary',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            '& fieldset': { 
              borderColor: 'divider',
              borderRadius: '16px',
            },
            '&:hover fieldset': { 
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': { 
              borderColor: 'primary.main',
              borderWidth: '1px'
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'text.secondary',
            opacity: 0.7,
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'primary.main', ml: 1 }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;