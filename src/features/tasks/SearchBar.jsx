import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, Box, useTheme, MenuItem, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ tasks, onFilter }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [dueDate, setDueDate] = useState('');

  const handleSearch = useCallback(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = tasks.filter((task) => {
      const title = (task.title || task.task || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      const matchesText = !lowerTerm || title.includes(lowerTerm) || description.includes(lowerTerm);
      const matchesStatus = status === 'all' || task.status === status;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
      const matchesDueDate = !dueDate || taskDate === dueDate;

      return matchesText && matchesStatus && matchesPriority && matchesDueDate;
    });

    onFilter(filtered);
  }, [searchTerm, status, priority, dueDate, tasks, onFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [handleSearch]);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="todo">Todo</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="done">Done</MenuItem>
        </TextField>
        <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ minWidth: 170 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </TextField>
        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
      </Stack>
    </Box>
  );
};

export default SearchBar;