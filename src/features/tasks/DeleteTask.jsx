import React, { useState, useCallback } from 'react';
import { taskApi } from '../../api/taskApi';
import { 
    IconButton, Snackbar, Alert, Tooltip, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, useTheme 
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';
import DeleteIcon from '@mui/icons-material/Delete';

import { useSelector } from 'react-redux';

const DeleteTask = ({ taskId, onDeleteSuccess }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const token = useSelector((state) => state.auth.token);
    
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const handleOpenDialog = useCallback(() => setOpenDialog(true), []);
    const handleCloseDialog = useCallback(() => setOpenDialog(false), []);

    const handleCloseFeedback = useCallback(() => setFeedback(prev => ({ ...prev, open: false })), []);

    const handleDelete = useCallback(async () => {
        if (!taskId) return;
        
        handleCloseDialog();
        setLoading(true);
        
        try {
            await taskApi.deleteTask(taskId);
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
    }, [taskId, token, onDeleteSuccess, handleCloseDialog]);

    return (
        <>
            <Tooltip title="Delete Task">
                <IconButton 
                    onClick={handleOpenDialog} 
                    disabled={loading}
                    sx={{ 
                        color: 'error.main',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                            bgcolor: 'error.main' + '1A',
                            transform: 'scale(1.1)' 
                        },
                        '&.Mui-disabled': { color: 'error.main' + '4D' }
                    }}
                >
                    {loading ? <CustomLoader size={20} sx={{ color: 'error.main' }} /> : <DeleteIcon fontSize="small" />}
                </IconButton>
            </Tooltip>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 1,
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        Are you sure you want to permanently delete this task? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary', textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDelete} 
                        variant="contained" 
                        sx={{ 
                            bgcolor: 'error.main', 
                            '&:hover': { bgcolor: 'error.dark' },
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