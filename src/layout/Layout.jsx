import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, Avatar, Menu, MenuItem,
    IconButton, Box, Container, Divider, ListItemIcon, CircularProgress
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, login } from '../features/auth/authSlice';
import { supabase } from '../config/supabaseClient';

const Layout = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        const restoreSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                dispatch(login({ user: session.user, session }));
            } else if (!session && location.pathname !== '/login') {
                navigate('/login');
            }
            setIsInitialLoading(false);
        };

        if (!user) {
            restoreSession();
        } else {
            setIsInitialLoading(false);
        }
    }, [dispatch, user, navigate, location.pathname]);

    const fullName = user?.user_metadata?.full_name || "User";
    const avatarUrl = user?.user_metadata?.avatar_url;

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (isInitialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8f9fa' }}>
                <CircularProgress size={50} thickness={4} sx={{ color: '#1a237e' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#1a237e', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '600', letterSpacing: 0.5 }}>
                        👋 Welcome, {fullName}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={handleMenu}
                            sx={{ p: 0.5, border: '2px solid rgba(255,255,255,0.2)', transition: '0.3s', '&:hover': { borderColor: 'white' } }}
                        >
                            <Avatar
                                src={avatarUrl}
                                sx={{ width: 35, height: 35, bgcolor: '#2e7d32' }}
                            >
                                {fullName.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                            onClick={handleClose}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.15))',
                                    mt: 1.5,
                                    borderRadius: 3,
                                    minWidth: 220,
                                    '&:before': {
                                        content: '""', display: 'block', position: 'absolute',
                                        top: 0, right: 14, width: 10, height: 10,
                                        bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">{fullName}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {user?.email}
                                </Typography>
                            </Box>

                            <Divider />

                            <MenuItem onClick={() => navigate('/profile')} sx={{ py: 1.2 }}>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" color="primary" />
                                </ListItemIcon>
                                My Profile
                            </MenuItem>

                            <Divider />

                            <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: 'error.main' }}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" color="error" />
                                </ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 4, bgcolor: '#f8f9fa' }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box
                component="footer"
                sx={{
                    py: 6,
                    px: 2,
                    mt: 'auto',
                    bgcolor: '#1a237e',
                    color: 'white',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'center', md: 'flex-start' },
                            gap: 4,
                            mb: 4
                        }}
                    >
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: '300px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: 1 }}>
                                TASKMANAGER PRO
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Organize your workflow and boost your productivity with our advanced task management tools.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 6 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
                                    PLATFORM
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer', '&:hover': { color: '#4caf50' } }} onClick={() => navigate('/')}>Dashboard</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer', '&:hover': { color: '#4caf50' } }} onClick={() => navigate('/profile')}>Profile</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#4caf50' }}>
                                    SUPPORT
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer', '&:hover': { color: '#4caf50' } }}>Help Center</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer', '&:hover': { color: '#4caf50' } }}>Privacy Policy</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                            © {new Date().getFullYear()} TaskManager Pro. All rights reserved.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6, '&:hover': { opacity: 1, cursor: 'pointer' } }}>Twitter</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6, '&:hover': { opacity: 1, cursor: 'pointer' } }}>LinkedIn</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6, '&:hover': { opacity: 1, cursor: 'pointer' } }}>GitHub</Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;