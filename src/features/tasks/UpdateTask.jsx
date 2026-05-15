import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Modal, Box, Typography, TextField, Button, 
    Stack, MenuItem, Snackbar, Alert, Backdrop, Fade, useTheme, Divider, List, ListItem, ListItemText, Checkbox, IconButton, LinearProgress, Autocomplete, Chip
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomLoader from '../../components/CustomLoader';
import { taskApi } from '../../api/taskApi';
import { API_BASE_URL } from '../../api/axiosInstance';
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

const UpdateTask = ({ open, handleClose, taskData, onUpdateSuccess, projectMembers = [], allTasks = [] }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const token = useSelector((state) => state.auth.token);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        recurrenceEnabled: false,
        recurrenceFrequency: 'daily',
        assigneeId: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
    const [newNote, setNewNote] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [notesList, setNotesList] = useState([]);
    const [attachmentsList, setAttachmentsList] = useState([]);
    const [commentsList, setCommentsList] = useState([]);
    const [activityList, setActivityList] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [subtaskList, setSubtaskList] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [blockedBy, setBlockedBy] = useState([]);
    const [selectedLabels, setSelectedLabels] = useState([]);

    useEffect(() => {
        if (taskData && open) {
            setNotesList(Array.isArray(taskData.notes) ? taskData.notes : []);
            setAttachmentsList(Array.isArray(taskData.attachments) ? taskData.attachments : []);
            setCommentsList(Array.isArray(taskData.comments) ? taskData.comments : []);
            setActivityList(Array.isArray(taskData.activityLog) ? taskData.activityLog : []);
            setSubtaskList(Array.isArray(taskData.subtasks) ? taskData.subtasks : []);
            setBlockedBy(Array.isArray(taskData.blockedBy) ? taskData.blockedBy : []);
            setSelectedLabels(Array.isArray(taskData.labels) ? taskData.labels : []);
            setFormData({
                title: taskData.title || taskData.task || '',
                description: taskData.description || '',
                status: taskData.status || 'todo',
                priority: taskData.priority || 'medium',
                dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
                recurrenceEnabled: Boolean(taskData.recurrence?.enabled),
                recurrenceFrequency: taskData.recurrence?.frequency || 'daily',
                assigneeId: taskData.assigneeId?._id || taskData.assigneeId || ''
            });
        }
    }, [taskData, open]);

    const modalStyle = useMemo(() => ({
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 500 },
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '24px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        p: 4,
        backdropFilter: 'blur(10px)',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
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
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const isChanged = useMemo(() =>
        formData.title !== (taskData.title || taskData.task || '') ||
        formData.description !== (taskData.description || '') ||
        formData.status !== (taskData.status || 'todo') ||
        formData.priority !== (taskData.priority || 'medium') ||
        formData.dueDate !== (taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '') ||
        formData.recurrenceEnabled !== Boolean(taskData.recurrence?.enabled) ||
        formData.recurrenceFrequency !== (taskData.recurrence?.frequency || 'daily') ||
        formData.assigneeId !== (taskData.assigneeId?._id || taskData.assigneeId || '') ||
        JSON.stringify(blockedBy.map(t => t._id || t.id)) !== JSON.stringify((taskData.blockedBy || []).map(t => t._id || t.id)) ||
        JSON.stringify(selectedLabels.map(l => l.text)) !== JSON.stringify((taskData.labels || []).map(l => l.text))
    , [formData, taskData, blockedBy, selectedLabels]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const taskId = taskData?.id;

        if (!formData.title.trim()) {
            setFeedback({ open: true, message: 'Title cannot be empty!', severity: 'warning' });
            return;
        }
        if (!formData.dueDate) {
            setFeedback({ open: true, message: 'Due date is required!', severity: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const projectId = taskData.projectId?._id || taskData.projectId;
            const { data } = await taskApi.updateTask(taskId, {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                priority: formData.priority,
                dueDate: formData.dueDate,
                assigneeId: formData.assigneeId || null,
                projectId: projectId || undefined,
                estimatedHours: taskData.estimatedHours != null ? Number(taskData.estimatedHours) : undefined,
                recurrence: formData.recurrenceEnabled
                    ? { enabled: true, frequency: formData.recurrenceFrequency }
                    : { enabled: false },
                blockedBy: blockedBy.map(t => t.id || t._id),
                labels: selectedLabels
            });

            if (data?.requiresApproval) {
                setFeedback({
                    open: true,
                    message: 'Completion sent for admin approval. Task stays in progress until an admin approves.',
                    severity: 'info'
                });
                setFormData((prev) => ({
                    ...prev,
                    status: data.status || prev.status
                }));
                onUpdateSuccess();
                return;
            }

            setFeedback({ open: true, message: 'Task updated successfully!', severity: 'success' });

            setTimeout(() => {
                onUpdateSuccess();
                handleClose();
            }, 1000);
        } catch (error) {
            setFeedback({ 
                open: true, 
                message: error.response?.data?.message || error.response?.data || 'Update failed!', 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !taskData?.id) return;
        setUploadLoading(true);
        try {
            const response = await taskApi.addComment(taskData.id, newComment.trim());
            setNewComment('');
            setCommentsList(response.data.comments || []);
            setActivityList(response.data.activityLog || []);
            onUpdateSuccess();
            setFeedback({ open: true, message: 'Comment added successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Failed to add comment.', severity: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim() || !taskData?.id) return;
        setUploadLoading(true);
        try {
            const response = await taskApi.addNote(taskData.id, newNote.trim());
            setNewNote('');
            setNotesList(response.data.notes || []);
            onUpdateSuccess();
            setFeedback({ open: true, message: 'Note added successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Failed to add note.', severity: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleAttachmentUpload = async () => {
        if (!selectedFile || !taskData?.id) return;
        setUploadLoading(true);
        try {
            const body = new FormData();
            body.append('attachment', selectedFile);
            const response = await taskApi.addAttachment(taskData.id, body);
            setSelectedFile(null);
            setAttachmentsList(response.data.attachments || []);
            onUpdateSuccess();
            setFeedback({ open: true, message: 'Attachment uploaded successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Attachment upload failed.', severity: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim() || !taskData?.id) return;
        setUploadLoading(true);
        try {
            const response = await taskApi.addSubtask(taskData.id, newSubtaskTitle.trim());
            setNewSubtaskTitle('');
            setSubtaskList(response.data.subtasks || []);
            setActivityList(response.data.activityLog || []);
            onUpdateSuccess();
            setFeedback({ open: true, message: 'Subtask added successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Failed to add subtask.', severity: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleToggleSubtask = async (subtaskId, currentStatus) => {
        if (!taskData?.id) return;
        setUploadLoading(true);
        try {
            const response = await taskApi.updateSubtask(taskData.id, subtaskId, { isCompleted: !currentStatus });
            setSubtaskList(response.data.subtasks || []);
            setActivityList(response.data.activityLog || []);
            onUpdateSuccess();
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Failed to update subtask.', severity: 'error' });
        } finally {
            setUploadLoading(false);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        if (!taskData?.id) return;
        setUploadLoading(true);
        try {
            const response = await taskApi.deleteSubtask(taskData.id, subtaskId);
            setSubtaskList(response.data.subtasks || []);
            setActivityList(response.data.activityLog || []);
            onUpdateSuccess();
            setFeedback({ open: true, message: 'Subtask deleted successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Failed to delete subtask.', severity: 'error' });
        } finally {
            setUploadLoading(false);
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
                        <Typography variant="h5" mb={3} sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
                            Edit Task Details
                        </Typography>

                        <form onSubmit={handleUpdate}>
                            <Stack spacing={3}>
                                <TextField 
                                    label="Title" 
                                    name="title" 
                                    fullWidth 
                                    required
                                    disabled={loading}
                                    value={formData.title} 
                                    onChange={handleChange} 
                                    sx={textFieldStyle}
                                />
                                <TextField 
                                    label="Description" 
                                    name="description" 
                                    fullWidth 
                                    multiline 
                                    rows={3} 
                                    disabled={loading}
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    sx={textFieldStyle}
                                />
                                <TextField 
                                    select 
                                    label="Status" 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange} 
                                    fullWidth
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
                                    label="Priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    fullWidth
                                    disabled={loading}
                                    sx={textFieldStyle}
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                </TextField>
                                <TextField
                                    label="Due Date"
                                    name="dueDate"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    disabled={loading}
                                    InputLabelProps={{ shrink: true }}
                                    sx={textFieldStyle}
                                />
                                <TextField
                                    select
                                    label="Assign To"
                                    name="assigneeId"
                                    value={formData.assigneeId}
                                    onChange={handleChange}
                                    fullWidth
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
                                    label="Recurring Task"
                                    name="recurrenceEnabled"
                                    value={formData.recurrenceEnabled ? 'yes' : 'no'}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev,
                                        recurrenceEnabled: e.target.value === 'yes'
                                    }))}
                                    fullWidth
                                    disabled={loading}
                                    sx={textFieldStyle}
                                >
                                    <MenuItem value="no">No</MenuItem>
                                    <MenuItem value="yes">Yes</MenuItem>
                                </TextField>
                                {formData.recurrenceEnabled && (
                                    <TextField
                                        select
                                        label="Recurrence Frequency"
                                        name="recurrenceFrequency"
                                        value={formData.recurrenceFrequency}
                                        onChange={handleChange}
                                        fullWidth
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
                                    options={allTasks.filter(t => t.id !== taskData?.id && t.status !== 'done')}
                                    getOptionLabel={(option) => option.title || 'Untitled Task'}
                                    isOptionEqualToValue={(option, value) => option.id === (value.id || value._id)}
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
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        fullWidth
                                        size="small"
                                        disabled={loading || uploadLoading}
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
                                        disabled={uploadLoading || !newSubtaskTitle.trim()}
                                        sx={{ textTransform: 'none', px: 3, borderRadius: '12px' }}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                {subtaskList.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                Progress: {subtaskList.filter(s => s.isCompleted).length} / {subtaskList.length}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                {Math.round((subtaskList.filter(s => s.isCompleted).length / subtaskList.length) * 100)}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={(subtaskList.filter(s => s.isCompleted).length / subtaskList.length) * 100} 
                                            sx={{ height: 8, borderRadius: 4, mb: 2 }}
                                        />
                                        <List dense sx={{ bgcolor: 'background.default', borderRadius: '12px', p: 1 }}>
                                            {subtaskList.map((subtask) => (
                                                <ListItem 
                                                    key={subtask._id} 
                                                    disablePadding 
                                                    sx={{ opacity: subtask.isCompleted ? 0.6 : 1, transition: '0.2s' }}
                                                    secondaryAction={
                                                        <IconButton edge="end" aria-label="delete" size="small" color="error" onClick={() => handleDeleteSubtask(subtask._id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    }
                                                >
                                                    <Checkbox 
                                                        edge="start" 
                                                        checked={subtask.isCompleted} 
                                                        tabIndex={-1} 
                                                        disableRipple 
                                                        onChange={() => handleToggleSubtask(subtask._id, subtask.isCompleted)}
                                                    />
                                                    <ListItemText 
                                                        primary={subtask.title} 
                                                        sx={{ textDecoration: subtask.isCompleted ? 'line-through' : 'none' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}
                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notes</Typography>
                                <TextField
                                    label="Add note"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    disabled={loading || uploadLoading}
                                    sx={textFieldStyle}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddNote}
                                    disabled={uploadLoading || !newNote.trim()}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {uploadLoading ? 'Saving...' : 'Add Note'}
                                </Button>
                                {notesList.length > 0 && (
                                    <List dense sx={{ bgcolor: 'background.default', borderRadius: '8px' }}>
                                        {notesList.slice().reverse().map((note, idx) => (
                                            <ListItem key={`${note.createdAt}-${idx}`} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={note.content}
                                                    secondary={note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Attachments</Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    disabled={loading || uploadLoading}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {selectedFile ? selectedFile.name : 'Choose File'}
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleAttachmentUpload}
                                    disabled={!selectedFile || uploadLoading}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {uploadLoading ? 'Uploading...' : 'Upload Attachment'}
                                </Button>
                                {attachmentsList.length > 0 && (
                                    <List dense sx={{ bgcolor: 'background.default', borderRadius: '8px' }}>
                                        {attachmentsList.slice().reverse().map((file, idx) => (
                                            <ListItem key={`${file.fileName}-${idx}`} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={file.originalName}
                                                    secondary={file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : ''}
                                                />
                                                <Button
                                                    size="small"
                                                    href={`${API_BASE_URL.replace('/api', '')}${file.filePath}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Open
                                                </Button>
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Comments</Typography>
                                <TextField
                                    label="Add comment"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    disabled={loading || uploadLoading}
                                    sx={textFieldStyle}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddComment}
                                    disabled={uploadLoading || !newComment.trim()}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {uploadLoading ? 'Saving...' : 'Add Comment'}
                                </Button>
                                {commentsList.length > 0 && (
                                    <List dense sx={{ bgcolor: 'background.default', borderRadius: '8px' }}>
                                        {commentsList.slice().reverse().map((comment, idx) => (
                                            <ListItem key={`${comment.createdAt}-${idx}`} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={comment.text}
                                                    secondary={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                <Divider />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Activity Log</Typography>
                                {activityList.length > 0 ? (
                                    <List dense sx={{ bgcolor: 'background.default', borderRadius: '8px' }}>
                                        {activityList.slice().reverse().map((item, idx) => (
                                            <ListItem key={`${item.createdAt}-${idx}`} sx={{ py: 0.5 }}>
                                                <ListItemText
                                                    primary={`${item.action}${item.detail ? ` - ${item.detail}` : ''}`}
                                                    secondary={item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">No activity yet.</Typography>
                                )}
                                
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading || !isChanged}
                                    sx={{ 
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        boxShadow: isChanged ? `0 10px 20px ${theme.palette.primary.main}4D` : 'none',
                                        '&:hover': { 
                                            opacity: 0.9,
                                            transform: isChanged ? 'translateY(-2px)' : 'none'
                                        },
                                        transition: 'all 0.2s',
                                        opacity: isChanged ? 1 : 0.6
                                    }}
                                >
                                    {loading ? <CustomLoader size={24} sx={{ color: '#fff' }} /> : 'Update Task'}
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Fade>
            </Modal>


            <Snackbar 
                open={feedback.open} 
                autoHideDuration={3000} 
                onClose={() => setFeedback({ ...feedback, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={feedback.severity} 
                    variant="filled" 
                    sx={{ borderRadius: '12px', fontWeight: 'bold' }}
                >
                    {feedback.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default UpdateTask;