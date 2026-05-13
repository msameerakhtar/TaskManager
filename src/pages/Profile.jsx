import React from 'react';
import { Paper, Typography, Avatar, Box, Divider, Container, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';

const Profile = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    
    const user = useSelector((state) => state.auth.user);
    const fullName = user?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    const email = user?.email || "N/A";
    const avatarUrl = user?.avatarUrl || user?.user_metadata?.avatar_url;

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '32px',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                    backgroundImage: 'none'
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                    <Avatar 
                        src={avatarUrl} 
                        sx={{ 
                            width: 140, 
                            height: 140, 
                            mx: 'auto', 
                            bgcolor: 'primary.main', 
                            fontSize: '3.5rem', 
                            fontWeight: 800,
                            border: '4px solid',
                            borderColor: 'primary.light',
                            boxShadow: `0 0 30px ${theme.palette.primary.main}4D`
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
                        border: '3px solid',
                        borderColor: 'background.paper'
                    }} />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', mb: 1, letterSpacing: '-1px' }}>
                    {fullName}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                    {email}
                </Typography>

                <Divider sx={{ mb: 4, borderColor: 'divider' }} />

                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    textAlign: 'left'
                }}>
                    <Box sx={{ 
                        bgcolor: 'primary.main' + '0D', 
                        p: 2.5, 
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'primary.main' + '1A',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Account Status
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Active
                        </Typography>
                    </Box>

                    <Box sx={{ 
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', 
                        p: 2.5, 
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Role
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                            Administrator
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default Profile;