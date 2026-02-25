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
                dispatch(login({ user: session.user, token: session.access_token }));
            } else if (location.pathname !== '/login') {
                navigate('/login');
            }
            setIsInitialLoading(false);
        };

        restoreSession();
    }, [dispatch, user, navigate, location.pathname]);

    const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    const avatarUrl = user?.user_metadata?.avatar_url;

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            dispatch(logout());
            navigate('/login', { replace: true });
            window.location.reload();
        } catch (error) {
            console.error("Error logging out:", error);
            dispatch(logout());
            navigate('/login');
        }
    };

    const navItems = [
        { label: 'Home', path: '/tasks' },
        { label: 'Profile', path: '/profile' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Blog', path: '/blog' },
    ];

    if (isInitialLoading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
            }}>
                <CircularProgress size={50} thickness={4} sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0f172a' }}>
            <AppBar 
                position="sticky" 
                elevation={0} 
                sx={{ 
                    bgcolor: 'rgba(15, 23, 42, 0.8)', 
                    backdropFilter: 'blur(12px)', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { md: '250px' } }}>
                            <Typography variant="h6" sx={{ 
                                fontWeight: '900', 
                                background: 'linear-gradient(45deg, #6366f1, #a855f7)', 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                Task Manager 
                            </Typography>
                        </Box>

                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', gap: 1 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.label}
                                    component={Link}
                                    to={item.path}
                                    sx={{
                                        color: location.pathname === item.path ? '#6366f1' : 'rgba(255,255,255,0.7)',
                                        fontWeight: location.pathname === item.path ? '700' : '500',
                                        textTransform: 'none',
                                        fontSize: '0.95rem',
                                        px: 2,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            color: '#fff',
                                            bgcolor: 'rgba(255,255,255,0.05)'
                                        },
                                        position: 'relative',
                                        '&::after': location.pathname === item.path ? {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 6,
                                            left: '20%',
                                            right: '20%',
                                            height: '2px',
                                            bgcolor: '#6366f1',
                                            borderRadius: '2px'
                                        } : {}
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
                                PaperProps={{ 
                                    sx: { 
                                        minWidth: 200, 
                                        bgcolor: '#1e293b', 
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        mt: 1
                                    } 
                                }}
                            >
                                {navItems.map((item) => (
                                    <MenuItem 
                                        key={item.label} 
                                        onClick={() => { navigate(item.path); setAnchorElNav(null); }}
                                        sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                                    >
                                        <Typography textAlign="center" variant="body2">{item.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: { md: '250px' }, gap: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', display: { xs: 'none', lg: 'block' } }}>
                                Hi, {fullName}
                            </Typography>
                            <IconButton onClick={handleMenu} sx={{ p: 0.5, border: '2px solid rgba(99, 102, 241, 0.2)' }}>
                                <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: '1rem' }}>
                                    {fullName.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                onClick={handleClose}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                PaperProps={{
                                    sx: { 
                                        borderRadius: '16px', 
                                        mt: 1.5, 
                                        minWidth: 220, 
                                        bgcolor: '#1e293b', 
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                    }
                                }}
                            >
                                <Box sx={{ px: 2.5, py: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="800">{fullName}</Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</Typography>
                                </Box>
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                                <MenuItem onClick={() => navigate('/profile')} sx={{ py: 1.5, mx: 1, borderRadius: '8px', mt: 0.5 }}>
                                    <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#6366f1' }} /></ListItemIcon>
                                    <Typography variant="body2">My Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, mx: 1, borderRadius: '8px', color: '#ff4d4d' }}>
                                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ff4d4d' }} /></ListItemIcon>
                                    <Typography variant="body2">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 6, bgcolor: '#0f172a' }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" sx={{ 
                py: 8, 
                px: 2, 
                mt: 'auto', 
                bgcolor: '#0f172a', 
                color: 'white',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 6, mb: 6 }}>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: '350px' }}>
                            <Typography variant="h6" sx={{ fontWeight: '900', mb: 2, letterSpacing: '-0.5px', color: '#6366f1' }}>
                                TASKMANAGER PRO
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
                                The ultimate workspace to organize your life, boost productivity, and collaborate seamlessly with your team.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: { xs: 4, sm: 10 }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, color: '#fff', fontSize: '0.75rem', letterSpacing: '1px' }}>PRODUCT</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#6366f1' } }} onClick={() => navigate('/tasks')}>Dashboard</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#6366f1' } }} onClick={() => navigate('/profile')}>Profile</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, color: '#fff', fontSize: '0.75rem', letterSpacing: '1px' }}>RESOURCES</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#6366f1' } }} onClick={() => navigate('/blog')}>Blog</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#6366f1' } }} onClick={() => navigate('/contact')}>Support</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            © {new Date().getFullYear()} TaskManager Pro. Engineered for excellence.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                                <Typography 
                                    key={social} 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'rgba(255,255,255,0.4)', 
                                        cursor: 'pointer',
                                        transition: 'color 0.2s',
                                        '&:hover': { color: '#6366f1' } 
                                    }}
                                >
                                    {social}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;