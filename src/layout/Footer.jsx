import React from 'react';
import { Box, Container, Typography, Divider, Grid, Link as MuiLink, Stack } from '@mui/material';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname !== '/';

    return (
        <Box 
            component="footer" 
            sx={{ 
                mt: 'auto', 
                py: isDashboard ? 8 : 6, 
                px: 2,
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderTop: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Container maxWidth="lg">
                {isDashboard ? (
                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 6, mb: 6 }}>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: '350px' }}>
                                <Typography variant="h6" sx={{ fontWeight: '900', mb: 2, color: 'primary.main', letterSpacing: '1px' }}>
                                    TASKMANAGER PRO
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                                    The ultimate workspace to organize your life, boost productivity, and collaborate seamlessly with your team.
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: { xs: 4, sm: 10 }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, fontSize: '0.75rem', letterSpacing: '1px', color: 'text.primary' }}>PRODUCT</Typography>
                                    <Stack spacing={1.5}>
                                        <Typography variant="body2" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/tasks')}>Dashboard</Typography>
                                        <Typography variant="body2" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/profile')}>Profile</Typography>
                                    </Stack>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, fontSize: '0.75rem', letterSpacing: '1px', color: 'text.primary' }}>RESOURCES</Typography>
                                    <Stack spacing={1.5}>
                                        <Typography variant="body2" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/blog')}>Blog</Typography>
                                        <Typography variant="body2" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/contact')}>Support</Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: 4 }} />
                    </Box>
                ) : (
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: '900', mb: 2, background: 'linear-gradient(45deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            TaskManager Pro
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Simplifying productivity for creators and teams worldwide.
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        © {new Date().getFullYear()} TaskManager Pro. {isDashboard ? 'Engineered for excellence.' : 'All rights reserved.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                            <Typography 
                                key={social} 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary', 
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    '&:hover': { color: 'primary.main' } 
                                }}
                            >
                                {social}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;