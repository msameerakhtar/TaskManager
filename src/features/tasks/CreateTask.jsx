import React, { useState } from 'react';
import {
    Modal, Box, Typography, TextField, Button,
    Stack, Backdrop, Fade, CircularProgress, MenuItem,
    Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 450 },
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 3,
};

const CreateTask = ({ open, handleClose, refreshTasks }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('pendiente');
    const [localLoading, setLocalLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);

        const payload = {
            title: taskTitle,
            description: description,
            status: status
        };

        try {
            await axios.post('https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks', payload);

            setTaskTitle('');
            setDescription('');
            setStatus('pendiente');

            refreshTasks();
            setShowSuccess(true);

            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (error) {
            console.error("API Error Details:", error.response?.data);
            alert("Error while adding task!");
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <>
            <Modal open={open} onClose={handleClose} closeAfterTransition slots={{ backdrop: Backdrop }}>
                <Fade in={open}>
                    <Box sx={style}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                            🆕 Add New Task
                        </Typography>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Task Title"
                                    variant="outlined"
                                    required
                                    value={taskTitle}
                                    onChange={(e) => setTaskTitle(e.target.value)}
                                    disabled={localLoading}
                                />

                                <TextField
                                    fullWidth
                                    label="Description"
                                    variant="outlined"
                                    multiline
                                    rows={2}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={localLoading}
                                />

                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    disabled={localLoading}
                                >
                                    <MenuItem value="pendiente">Pending</MenuItem>
                                    <MenuItem value="completada">Completed</MenuItem>
                                </TextField>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={localLoading}
                                    sx={{ bgcolor: '#1a237e', mt: 1, py: 1.5, fontWeight: 'bold' }}
                                >
                                    {localLoading ? <CircularProgress size={24} color="inherit" /> : 'ADD TO TABLE'}
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Fade>
            </Modal>

            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity="success"
                    variant="filled"
                    sx={{ width: '100%', fontWeight: 'bold' }}
                >
                    ✅ Task Added Successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default CreateTask;