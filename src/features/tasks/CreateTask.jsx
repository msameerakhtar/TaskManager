import React, { useState } from 'react';
import {
    Modal, Box, Typography, TextField, Button,
    Stack, Backdrop, Fade, CircularProgress, MenuItem,
    Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 450 },
    bgcolor: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    p: 4,
    backdropFilter: 'blur(10px)',
};

const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        bgcolor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.5)' },
        '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
};

const CreateTask = ({ open, handleClose, refreshTasks }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pendiente'
    });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSnackbarClose = () => {
        setFeedback(prev => ({ ...prev, open: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(API_BASE_URL, formData);

            setFormData({ title: '', description: '', status: 'pendiente' });
            refreshTasks();
            setFeedback({ open: true, message: 'Task Added Successfully!', severity: 'success' });

            setTimeout(handleClose, 1500);
        } catch (error) {
            const errorMsg = error.response?.data || "Error while adding task!";
            setFeedback({ open: true, message: errorMsg, severity: 'error' });
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
                        sx: { backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }
                    }
                }}
            >
                <Fade in={open}>
                    <Box sx={modalStyle}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
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
                                                    bgcolor: '#1e293b',
                                                    color: '#fff',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
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
                                    size="large"
                                    disabled={loading}
                                    sx={{ 
                                        background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                                        mt: 1, py: 1.5, fontWeight: 'bold',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
                                        '&:hover': { 
                                            background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
                                            transform: 'translateY(-2px)' 
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Task'}
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