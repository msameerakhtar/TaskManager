import React, { useState } from 'react';
import axios from 'axios';
import { 
    IconButton, CircularProgress, Snackbar, Alert, Tooltip, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = 'https://6996bef77d1786436575294e.mockapi.io/api/tm/tasks';

const DeleteTask = ({ taskId, onDeleteSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const handleOpenDialog = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);

    const handleCloseFeedback = () => setFeedback({ ...feedback, open: false });

    const handleDelete = async () => {
        if (!taskId) return;
        
        handleCloseDialog();
        setLoading(true);
        
        try {
            await axios.delete(`${API_URL}/${taskId}`);
            setFeedback({
                open: true,
                message: "Task deleted successfully!",
                severity: 'success'
            });
            setTimeout(() => {
                onDeleteSuccess();
            }, 1000);
        } catch (error) {
            setFeedback({
                open: true,
                message: "Failed to delete task. Please try again.",
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Tooltip title="Delete Task">
                <IconButton 
                    onClick={handleOpenDialog} 
                    disabled={loading}
                    sx={{ 
                        color: '#ff4d4d',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                            bgcolor: 'rgba(255, 77, 77, 0.1)',
                            transform: 'scale(1.1)' 
                        },
                        '&.Mui-disabled': { color: 'rgba(255, 77, 77, 0.3)' }
                    }}
                >
                    {loading ? <CircularProgress size={20} sx={{ color: '#ff4d4d' }} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
            </Tooltip>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: {
                        bgcolor: '#1e293b',
                        color: '#fff',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Are you sure you want to permanently delete this task? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        variant="contained" 
                        sx={{ 
                            bgcolor: '#ff4d4d', 
                            '&:hover': { bgcolor: '#d32f2f' },
                            borderRadius: '10px',
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Delete Now
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={feedback.open} 
                autoHideDuration={3000} 
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseFeedback} 
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

export default DeleteTask;