import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, Avatar, Menu, MenuItem,
    IconButton, Box, Container, Divider, ListItemIcon, CircularProgress, Button
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as PersonIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, login } from '../features/auth/authSlice';
import { supabase } from '../config/supabaseClient';

const Layout = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorElNav, setAnchorElNav] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        const restoreSession = async () => {
            if (user) {
                setIsInitialLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                dispatch(login({ user: session.user, session }));
            } else if (location.pathname !== '/login') {
                navigate('/login');
            }
            setIsInitialLoading(false);
        };

        restoreSession();
    }, [dispatch, user, navigate, location.pathname]);

    const fullName = user?.user_metadata?.full_name || "User";
    const avatarUrl = user?.user_metadata?.avatar_url;

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navItems = [
        { label: 'Home', path: '/tasks' },
        { label: 'Profile', path: '/profile' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Blog', path: '/blog' },
    ];

    if (isInitialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress size={50} thickness={4} color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="sticky" elevation={0} color="primary">
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>

                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { md: '250px' } }}>
                            <Typography variant="h6" sx={{ fontWeight: '600' }}>
                                👋 Welcome, {fullName}
                            </Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 2 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.label}
                                    component={Link}
                                    to={item.path}
                                    sx={{
                                        color: 'white',
                                        opacity: location.pathname === item.path ? 1 : 0.7,
                                        fontWeight: location.pathname === item.path ? 'bold' : '500'
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>

                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'center' }}>
                            <IconButton color="inherit" onClick={(e) => setAnchorElNav(e.currentTarget)}>
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorElNav}
                                open={Boolean(anchorElNav)}
                                onClose={() => setAnchorElNav(null)}
                            >
                                {navItems.map((item) => (
                                    <MenuItem key={item.label} onClick={() => { navigate(item.path); setAnchorElNav(null); }}>
                                        <Typography textAlign="center">{item.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: { md: '250px' } }}>
                            <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
                                <Avatar src={avatarUrl} sx={{ width: 35, height: 35, bgcolor: 'secondary.main' }}>
                                    {fullName.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                onClick={handleClose}
                                PaperProps={{
                                    sx: { borderRadius: 3, mt: 1.5, minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }
                                }}
                            >
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{fullName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                                </Box>
                                <Divider />
                                <MenuItem onClick={() => navigate('/profile')}>
                                    <ListItemIcon><PersonIcon fontSize="small" color="primary" /></ListItemIcon>
                                    My Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 4, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" sx={{ py: 6, px: 2, mt: 'auto', bgcolor: 'primary.main', color: 'white' }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 4, mb: 4 }}>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: '300px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>TASKMANAGER PRO</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                Organize your workflow and boost your productivity with our advanced task management tools.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 6, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'secondary.main' }}>PLATFORM</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate('/tasks')}>Dashboard</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate('/profile')}>Profile</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'secondary.main' }}>SUPPORT</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate('/blog')}>Blog</Typography>
                                <Typography variant="body2" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate('/contact')}>Contact Us</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                            © {new Date().getFullYear()} TaskManager Pro. All rights reserved.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>Twitter</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>LinkedIn</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>GitHub</Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;