import React, { useState, useEffect } from 'react';
import { 
    Modal, Box, Typography, TextField, Button, 
    Stack, MenuItem, CircularProgress, Snackbar, Alert, Backdrop, Fade, useTheme
} from '@mui/material';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import { useSelector } from 'react-redux';

const UpdateTask = ({ open, handleClose, taskData, onUpdateSuccess }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const token = useSelector((state) => state.auth.token);

    const [formData, setFormData] = useState({ title: '', description: '', status: 'pendiente' });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (taskData && open) {
            setFormData({
                title: taskData.title || taskData.task || '',
                description: taskData.description || '',
                status: taskData.status || 'pendiente'
            });
        }
    }, [taskData, open]);

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 450 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '24px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        p: 4,
        backdropFilter: 'blur(10px)',
    };

    const textFieldStyle = {
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
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isChanged = 
        formData.title !== (taskData.title || taskData.task || '') ||
        formData.description !== (taskData.description || '') ||
        formData.status !== (taskData.status || 'pendiente');

    const handleUpdate = async (e) => {
        e.preventDefault();
        const taskId = taskData?.id;

        if (!formData.title.trim()) {
            setFeedback({ open: true, message: 'Title cannot be empty!', severity: 'warning' });
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/tasks/${taskId}`, formData, {
                headers: { 'x-auth-token': token }
            });
            setFeedback({ open: true, message: 'Task updated successfully!', severity: 'success' });
            
            setTimeout(() => {
                onUpdateSuccess();
                handleClose();
            }, 1000);
        } catch (error) {
            setFeedback({ 
                open: true, 
                message: error.response?.data || 'Update failed!', 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
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
                                    <MenuItem value="pendiente">Pending</MenuItem>
                                    <MenuItem value="completada">Completed</MenuItem>
                                </TextField>
                                
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
                                    {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Update Task'}
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