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
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            title: taskTitle,
            task: taskTitle,
            description: description,
            status: status
        };

        try {
            await axios.request({
                method: 'POST',
                url: 'https://task-manager-api3.p.rapidapi.com/',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-key': 'c2b5fe3070msh7ca68c6210a1bb1p1f7554jsn29ef05eade98',
                    'x-rapidapi-host': 'task-manager-api3.p.rapidapi.com'
                },
                data: payload
            });

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
            setLoading(false);
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />

                                <TextField
                                    select
                                    fullWidth
                                    label="Status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    disabled={loading}
                                >
                                    <MenuItem value="pendiente">Pending</MenuItem>
                                    <MenuItem value="completada">Completed</MenuItem>
                                </TextField>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ bgcolor: '#1a237e', mt: 1, py: 1.5, fontWeight: 'bold' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ADD TO TABLE'}
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