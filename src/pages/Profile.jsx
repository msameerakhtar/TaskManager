import React from 'react';
import { Paper, Typography, Avatar, Box, Divider, Container } from '@mui/material';
import { useSelector } from 'react-redux';

const Profile = () => {
    const user = useSelector((state) => state.auth.user);
    const fullName = user?.user_metadata?.full_name || "User";
    const email = user?.email || "N/A";
    const avatarUrl = user?.user_metadata?.avatar_url;

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                    <Avatar 
                        src={avatarUrl} 
                        sx={{ 
                            width: 140, 
                            height: 140, 
                            mx: 'auto', 
                            bgcolor: '#6366f1', 
                            fontSize: '3.5rem', 
                            fontWeight: 800,
                            border: '4px solid rgba(99, 102, 241, 0.2)',
                            boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        {fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        width: 20,
                        height: 20,
                        bgcolor: '#10b981',
                        borderRadius: '50%',
                        border: '3px solid #0f172a'
                    }} />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 1, letterSpacing: '-1px' }}>
                    {fullName}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, fontWeight: 500 }}>
                    {email}
                </Typography>

                <Divider sx={{ mb: 4, borderColor: 'rgba(255,255,255,0.05)' }} />

                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    textAlign: 'left'
                }}>
                    <Box sx={{ 
                        bgcolor: 'rgba(99, 102, 241, 0.05)', 
                        p: 2.5, 
                        borderRadius: '16px',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                            Account Status
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Active
                        </Typography>
                    </Box>

                    <Box sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.02)', 
                        p: 2.5, 
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                            Role
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                            Administrator
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Profile;