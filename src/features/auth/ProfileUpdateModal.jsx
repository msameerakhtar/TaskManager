import React, { useState } from 'react';
import { 
    Modal, Box, Typography, TextField, Button, 
    Stack, Avatar, IconButton, Alert, Snackbar,
    useTheme, Divider, InputAdornment
} from '@mui/material';
import { 
    PhotoCamera, 
    Visibility, 
    VisibilityOff, 
    Close as CloseIcon,
    Save as SaveIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from './authSlice';
import CustomLoader from '../../components/CustomLoader';

const ProfileUpdateModal = ({ open, handleClose }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const token = useSelector((state) => state.auth.token);

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '95%', sm: 450 },
        maxHeight: '90vh',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        borderRadius: '24px',
        boxShadow: 24,
        p: 4,
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
                headers: { 
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setAvatarUrl(response.data.avatarUrl);
            setFeedback({ open: true, message: 'Image uploaded! Don\'t forget to save changes.', severity: 'info' });
        } catch (error) {
            setFeedback({ open: true, message: 'Upload failed', severity: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`${API_BASE_URL}/auth/profile`, 
                { fullName, avatarUrl },
                { headers: { 'x-auth-token': token } }
            );
            dispatch(updateUser(response.data));
            setFeedback({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Update failed', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) return;
        setPwdLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/auth/change-password`, 
                { oldPassword, newPassword },
                { headers: { 'x-auth-token': token } }
            );
            setFeedback({ open: true, message: 'Password changed successfully!', severity: 'success' });
            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            setFeedback({ open: true, message: error.response?.data?.message || 'Password change failed', severity: 'error' });
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={modalStyle}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="900">Profile Settings</Typography>
                    <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
                </Box>

                <Stack spacing={4}>
                    {/* General Profile Section */}
                    <Box component="form" onSubmit={handleUpdateProfile}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>General Info</Typography>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar 
                                        src={avatarUrl} 
                                        sx={{ 
                                            width: 72, 
                                            height: 72, 
                                            bgcolor: 'primary.main', 
                                            border: '3px solid', 
                                            borderColor: 'primary.main',
                                            cursor: 'pointer',
                                            '&:hover': { opacity: 0.8 }
                                        }}
                                        onClick={() => document.getElementById('avatar-upload').click()}
                                    >
                                        {fullName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    {uploading && (
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '50%' }}>
                                            <CustomLoader size={24} sx={{ color: '#fff' }} />
                                        </Box>
                                    )}
                                    <input 
                                        type="file" 
                                        id="avatar-upload" 
                                        hidden 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                    />
                                </Box>
                                <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                                    <TextField 
                                        label="Avatar URL" 
                                        fullWidth size="small" 
                                        value={avatarUrl} 
                                        onChange={(e) => setAvatarUrl(e.target.value)} 
                                        placeholder="Or paste URL here"
                                    />
                                    <Typography variant="caption" color="text.secondary">Click avatar to upload from computer</Typography>
                                </Stack>
                            </Box>
                            <TextField 
                                label="Full Name" 
                                fullWidth 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                                required
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={loading || uploading}
                                startIcon={loading ? null : <SaveIcon />}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 'bold' }}
                            >
                                {loading ? <CustomLoader size={24} sx={{ color: '#fff' }} /> : 'Save Changes'}
                            </Button>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Password Section */}
                    <Box component="form" onSubmit={handleChangePassword}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Security</Typography>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField 
                                label="Old Password" 
                                type={showPasswords ? 'text' : 'password'}
                                fullWidth 
                                value={oldPassword} 
                                onChange={(e) => setOldPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPasswords(!showPasswords)} size="small">
                                                {showPasswords ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <TextField 
                                label="New Password" 
                                type={showPasswords ? 'text' : 'password'}
                                fullWidth 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button 
                                type="submit" 
                                variant="outlined" 
                                color="warning"
                                disabled={pwdLoading || !oldPassword || !newPassword}
                                startIcon={pwdLoading ? null : <LockIcon />}
                                sx={{ borderRadius: '12px', py: 1.2, fontWeight: 'bold' }}
                            >
                                {pwdLoading ? <CustomLoader size={24} /> : 'Update Password'}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>

                <Snackbar 
                    open={feedback.open} 
                    autoHideDuration={4000} 
                    onClose={() => setFeedback({ ...feedback, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={feedback.severity} variant="filled" sx={{ borderRadius: '12px' }}>
                        {feedback.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Modal>
    );
};

export default ProfileUpdateModal;
