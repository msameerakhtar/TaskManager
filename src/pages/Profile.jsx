import React from 'react';
import { Paper, Typography, Avatar, Box, Divider } from '@mui/material';
import { useSelector } from 'react-redux';

const Profile = () => {
    const user = useSelector((state) => state.auth.user);
    const fullName = user?.user_metadata?.full_name || "N/A";
    const email = user?.email || "N/A";
    const avatarUrl = user?.user_metadata?.avatar_url;

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
                <Avatar src={avatarUrl} sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '3rem', border: '3px solid #f5f5f5' }}>
                    {fullName.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h5" gutterBottom>{fullName}</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>{email}</Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ bgcolor: 'secondary.light', py: 1, borderRadius: 2 }}>
                    <Typography variant="body2" color="secondary.dark" fontWeight="bold">Account Status: Active</Typography>
                </Box>
            </Paper>
        </Box>
    );
};
export default Profile;