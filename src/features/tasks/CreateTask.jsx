import React, { useState, useCallback, useMemo } from 'react';
import {
    Modal, Box, Typography, TextField, Button,
    Stack, Backdrop, Fade, MenuItem,
    Snackbar, Alert, useTheme, List, ListItem, ListItemText, IconButton, Divider, Autocomplete, Chip
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomLoader from '../../components/CustomLoader';
import { taskApi } from '../../api/taskApi';
import { useSelector } from 'react-redux';

const filter = createFilterOptions();

const LABEL_OPTIONS = [
    { text: 'Bug', color: '#ef4444' },
    { text: 'Feature', color: '#3b82f6' },
    { text: 'Design', color: '#ec4899' },
    { text: 'Marketing', color: '#f59e0b' },
    { text: 'Urgent', color: '#dc2626' },
    { text: 'Backend', color: '#10b981' },
    { text: 'Frontend', color: '#06b6d4' }
];
const PRESET_COLORS = ['#ef4444', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#6366f1'];
const getRandomColor = () => PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

const CreateTask = ({ open, handleClose, refreshTasks, selectedProjectId, projectMembers = [], allTasks = [] }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const token = useSelector((state) => state.auth.token); // kept for auth-guard check only

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        recurrenceEnabled: false,
        recurrenceFrequency: 'daily',
        initialNote: '',
        assigneeId: '',
        estimatedHours: 2
    });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
    const [suggestionLoading, setSuggestionLoading] = useState(false);
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [blockedBy, setBlockedBy] = useState([]);
    const [selectedLabels, setSelectedLabels] = useState([]);

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        setSubtasks(prev => [...prev, { title: newSubtask.trim(), isCompleted: false }]);
        setNewSubtask('');
    };

    const handleRemoveSubtask = (index) => {
        setSubtasks(prev => prev.filter((_, i) => i !== index));
    };

    const modalStyle = useMemo(() => ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 450 },
        maxHeight: '90vh',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '24px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        p: 4,
        backdropFilter: 'blur(10px)',
    }), [isDark]);

    const textFieldStyle = useMemo(() => ({
        '& .MuiOutlinedInput-root': {
            color: 'text.primary',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'primary.main' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        },
        '& .MuiInputLabel-root': { color: 'text.secondary' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
    }), [isDark]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSnackbarClose = useCallback(() => {
        setFeedback(prev => ({ ...prev, open: false }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setFeedback({ open: true, message: 'Title is required.', severity: 'warning' });
            return;
        }
        if (!formData.dueDate) {
            setFeedback({ open: true, message: 'Due date is required.', severity: 'warning' });
            return;
        }
        if (!selectedProjectId) {
            setFeedback({ open: true, message: 'Please select a workspace first.', severity: 'warning' });
            return;
        }
        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                dueDate: formData.dueDate,
                projectId: selectedProjectId,
                assigneeId: formData.assigneeId || null,
                estimatedHours: Number(formData.estimatedHours) || 2,
                recurrence: formData.recurrenceEnabled
                    ? { enabled: true, frequency: formData.recurrenceFrequency }
                    : { enabled: false },
                notes: formData.initialNote.trim()
                    ? [{ content: formData.initialNote.trim() }]
                    : [],
                subtasks: subtasks.length > 0 ? subtasks : undefined,
                blockedBy: blockedBy.length > 0 ? blockedBy.map(t => t.id) : undefined,
                labels: selectedLabels.length > 0 ? selectedLabels : undefined
            };

            await taskApi.createTask(payload);

            setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                dueDate: '',
                recurrenceEnabled: false,
                recurrenceFrequency: 'daily',
                initialNote: '',
                assigneeId: '',
                estimatedHours: 2
            });
            setSubtasks([]);
            setBlockedBy([]);
            setSelectedLabels([]);
            refreshTasks();
            setFeedback({ open: true, message: 'Task Added Successfully!', severity: 'success' });

            setTimeout(handleClose, 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data || "Error while adding task!";
            setFeedback({ open: true, message: errorMsg, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestDeadline = async () => {
        if (!selectedProjectId || !formData.dueDate) return;
        setSuggestionLoading(true);
        try {
            const response = await taskApi.suggestDeadline({
                projectId: selectedProjectId,
                assigneeId: formData.assigneeId || null,
                dueDate: formData.dueDate,
                estimatedHours: Number(formData.estimatedHours) || 2
            });
            const data = response.data;
            if (!data.feasible && data.suggestedDueDate) {
                const date = new Date(data.suggestedDueDate).toISOString().split('T')[0];
                setFormData((prev) => ({ ...prev, dueDate: date }));
                setFeedback({ open: true, severity: 'info', message: `Suggested deadline applied (+${data.extraDays} days).` });
            } else {
                setFeedback({ open: true, severity: 'success', message: 'Current deadline looks feasible.' });
            }
        } catch (error) {
            setFeedback({ open: true, severity: 'error', message: error.response?.data?.message || 'Failed to suggest deadline.' });
        } finally {
            setSuggestionLoading(false);
        }
    };

    const handleSuggestPriority = async () => {
        if (!selectedProjectId || !formData.dueDate) return;
        setSuggestionLoading(true);
        try {
            const response = await taskApi.suggestPriority({
                projectId: selectedProjectId,
                assigneeId: formData.assigneeId || null,
                dueDate: formData.dueDate,
                estimatedHours: Number(formData.estimatedHours) || 2
            });
            const nextPriority = response.data?.priority;
            if (nextPriority) {
                setFormData((prev) => ({ ...prev, priority: nextPriority }));
                setFeedback({ open: true, severity: 'info', message: `Suggested priority applied: ${nextPriority}.` });
            }
        } catch (error) {
            setFeedback({ open: true, severity: 'error', message: error.response?.data?.message || 'Failed to suggest priority.' });
        } finally {
            setSuggestionLoading(false);
        }
    };

    return (
        <>
            <Modal 
                open={open} 
                onClose={!loading ? handleClose : null} 
                closeAfterTransition 
                slots={{ backdrop: Backdrop }}
                slotProps={{
                    backdrop: {
                        sx: { 
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(0, 0, 0, 0.4)', 
                            backdropFilter: 'blur(4px)' 
                        }
                    }
                }}
            >
                <Fade in={open}>
                    <Box sx={modalStyle}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
                            Add New Task
                        </Typography>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Task Title"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={3}
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                />

                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                    SelectProps={{
                                        MenuProps: {
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: 'background.paper',
                                                    color: 'text.primary',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: '12px',
                                                }
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="todo">Todo</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="done">Done</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    fullWidth
                                    label="Priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                </TextField>

                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Due Date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    sx={textFieldStyle}
                                />
                                <TextField
                                    fullWidth
                                    label="Estimated Hours"
                                    name="estimatedHours"
                                    type="number"
                                    value={formData.estimatedHours}
                                    onChange={handleChange}
                                    disabled={loading}
                                    inputProps={{ min: 0.5, step: 0.5 }}
                                    sx={textFieldStyle}
                                />
                                <TextField
                                    select
                                    fullWidth
                                    label="Assign To"
                                    name="assigneeId"
                                    value={formData.assigneeId}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                >
                                    <MenuItem value="">Unassigned</MenuItem>
                                    {projectMembers.map((member) => (
                                        <MenuItem key={member.userId?._id || member.userId} value={member.userId?._id || member.userId}>
                                            {member.userId?.fullName || member.userId?.email || 'Member'}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    fullWidth
                                    label="Recurring Task"
                                    name="recurrenceEnabled"
                                    value={formData.recurrenceEnabled ? 'yes' : 'no'}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        recurrenceEnabled: e.target.value === 'yes'
                                    }))}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                >
                                    <MenuItem value="no">No</MenuItem>
                                    <MenuItem value="yes">Yes</MenuItem>
                                </TextField>
                                {formData.recurrenceEnabled && (
                                    <TextField
                                        select
                                        fullWidth
                                        label="Recurrence Frequency"
                                        name="recurrenceFrequency"
                                        value={formData.recurrenceFrequency}
                                        onChange={handleChange}
                                        disabled={loading}
                                        sx={textFieldStyle}
                                    >
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                    </TextField>
                                )}

                                <Autocomplete
                                    multiple
                                    freeSolo
                                    options={LABEL_OPTIONS}
                                    getOptionLabel={(option) => {
                                        if (typeof option === 'string') return option;
                                        if (option.inputValue) return option.inputValue;
                                        return option.text;
                                    }}
                                    value={selectedLabels}
                                    onChange={(event, newValue) => {
                                        const parsedValue = newValue.map(item => {
                                            if (typeof item === 'string') {
                                                return { text: item, color: getRandomColor() };
                                            } else if (item.inputValue) {
                                                return { text: item.inputValue, color: getRandomColor() };
                                            }
                                            return item;
                                        });
                                        const uniqueLabels = parsedValue.filter((v, i, a) => a.findIndex(t => (t.text === v.text)) === i);
                                        setSelectedLabels(uniqueLabels);
                                    }}
                                    filterOptions={(options, params) => {
                                        const filtered = filter(options, params);
                                        const { inputValue } = params;
                                        const isExisting = options.some((option) => inputValue === option.text);
                                        if (inputValue !== '' && !isExisting) {
                                            filtered.push({
                                                inputValue,
                                                text: `Add "${inputValue}"`,
                                            });
                                        }
                                        return filtered;
                                    }}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                key={index}
                                                label={option.text}
                                                size="small"
                                                sx={{ 
                                                    bgcolor: option.color + '22',
                                                    color: option.color,
                                                    fontWeight: 700,
                                                    border: `1px solid ${option.color}40`
                                                }}
                                                {...getTagProps({ index })}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Labels / Custom Tags"
                                            placeholder="Select or type..."
                                            sx={textFieldStyle}
                                        />
                                    )}
                                    disabled={loading}
                                />

                                <Autocomplete
                                    multiple
                                    options={allTasks.filter(t => t.status !== 'done')}
                                    getOptionLabel={(option) => option.title || 'Untitled Task'}
                                    value={blockedBy}
                                    onChange={(event, newValue) => setBlockedBy(newValue)}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip variant="outlined" size="small" label={option.title} {...getTagProps({ index })} />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Blocked By (Dependencies)"
                                            placeholder="Select tasks..."
                                            sx={textFieldStyle}
                                        />
                                    )}
                                    disabled={loading}
                                />

                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Subtasks (Checklist)</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        label="New Subtask"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        fullWidth
                                        size="small"
                                        disabled={loading}
                                        sx={textFieldStyle}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSubtask();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAddSubtask}
                                        disabled={loading || !newSubtask.trim()}
                                        sx={{ textTransform: 'none', px: 3, borderRadius: '12px' }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                {subtasks.length > 0 && (
                                    <List dense sx={{ bgcolor: 'background.default', borderRadius: '12px', p: 1, mt: 1 }}>
                                        {subtasks.map((subtask, index) => (
                                            <ListItem 
                                                key={index} 
                                                disablePadding 
                                                secondaryAction={
                                                    <IconButton edge="end" aria-label="delete" size="small" color="error" onClick={() => handleRemoveSubtask(index)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText primary={subtask.title} />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                <Divider />

                                <TextField
                                    fullWidth
                                    label="Initial Note (optional)"
                                    name="initialNote"
                                    multiline
                                    rows={2}
                                    value={formData.initialNote}
                                    onChange={handleChange}
                                    disabled={loading}
                                    sx={textFieldStyle}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <Button variant="outlined" onClick={handleSuggestDeadline} disabled={loading || suggestionLoading} sx={{ textTransform: 'none' }}>
                                        Suggest Deadline
                                    </Button>
                                    <Button variant="outlined" onClick={handleSuggestPriority} disabled={loading || suggestionLoading} sx={{ textTransform: 'none' }}>
                                        Suggest Priority
                                    </Button>
                                </Stack>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ 
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        mt: 1, py: 1.5, fontWeight: 'bold',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`,
                                        '&:hover': { 
                                            opacity: 0.9,
                                            transform: 'translateY(-2px)' 
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? <CustomLoader size={24} sx={{ color: '#fff' }} /> : 'Create Task'}
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Fade>
            </Modal>

            <Snackbar
                open={feedback.open}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={feedback.severity}
                    variant="filled"
                    sx={{ width: '100%', fontWeight: 'bold', borderRadius: '12px' }}
                >
                    {feedback.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateTask;