import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, Avatar, Menu, MenuItem,
    IconButton, Box, Container, Divider, ListItemIcon, CircularProgress, Button, useTheme
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as PersonIcon,
    Menu as MenuIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, login } from '../features/auth/authSlice';
import { supabase } from '../config/supabaseClient';

const Layout = ({ toggleTheme, mode }) => {
    const theme = useTheme();
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
                bgcolor: 'background.default' 
            }}>
                <CircularProgress size={50} thickness={4} sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default', transition: '0.3s' }}>
            <AppBar 
                position="sticky" 
                elevation={0} 
                sx={{ 
                    bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(12px)', 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    color: 'text.primary'
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: { md: '200px' } }}>
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
                                        color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                                        fontWeight: location.pathname === item.path ? '700' : '500',
                                        textTransform: 'none',
                                        fontSize: '0.95rem',
                                        px: 2,
                                        '&:hover': {
                                            color: 'text.primary',
                                            bgcolor: 'action.hover'
                                        },
                                        position: 'relative',
                                        '&::after': location.pathname === item.path ? {
                                            content: '""',
                                            position: 'absolute',
                                            bottom: 6,
                                            left: '20%',
                                            right: '20%',
                                            height: '2px',
                                            bgcolor: 'primary.main',
                                            borderRadius: '2px'
                                        } : {}
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: { md: '200px' }, gap: 1 }}>
                            <IconButton onClick={toggleTheme} color="inherit" sx={{ bgcolor: 'action.hover', borderRadius: '12px' }}>
                                {mode === 'dark' ? <LightModeIcon sx={{ color: '#f59e0b' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
                            </IconButton>

                            <IconButton onClick={handleMenu} sx={{ p: 0.5, border: '2px solid', borderColor: 'divider' }}>
                                <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '1rem' }}>
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
                                        bgcolor: 'background.paper', 
                                        color: 'text.primary',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        backgroundImage: 'none'
                                    }
                                }}
                            >
                                <Box sx={{ px: 2.5, py: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="800">{fullName}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
                                </Box>
                                <Divider />
                                <MenuItem onClick={() => navigate('/profile')} sx={{ py: 1.5, mx: 1, borderRadius: '8px', mt: 0.5 }}>
                                    <ListItemIcon><PersonIcon fontSize="small" color="primary" /></ListItemIcon>
                                    <Typography variant="body2">My Profile</Typography>
                                </MenuItem>
                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, mx: 1, borderRadius: '8px', color: 'error.main' }}>
                                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                    <Typography variant="body2">Logout</Typography>
                                </MenuItem>
                            </Menu>

                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
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
                                            bgcolor: 'background.paper',
                                            backgroundImage: 'none',
                                            mt: 1
                                        } 
                                    }}
                                >
                                    {navItems.map((item) => (
                                        <MenuItem 
                                            key={item.label} 
                                            onClick={() => { navigate(item.path); setAnchorElNav(null); }}
                                        >
                                            <Typography textAlign="center" variant="body2">{item.label}</Typography>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: 6 }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>

            <Box component="footer" sx={{ 
                py: 8, 
                px: 2, 
                mt: 'auto', 
                bgcolor: 'background.paper',
                color: 'text.primary',
                borderTop: '1px solid',
                borderColor: 'divider'
            }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 6, mb: 6 }}>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: '350px' }}>
                            <Typography variant="h6" sx={{ fontWeight: '900', mb: 2, color: 'primary.main' }}>
                                TASKMANAGER PRO
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                                The ultimate workspace to organize your life, boost productivity, and collaborate seamlessly with your team.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: { xs: 4, sm: 10 }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, fontSize: '0.75rem', letterSpacing: '1px' }}>PRODUCT</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/tasks')}>Dashboard</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/profile')}>Profile</Typography>
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: '800', mb: 3, fontSize: '0.75rem', letterSpacing: '1px' }}>RESOURCES</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/blog')}>Blog</Typography>
                                <Typography variant="body2" sx={{ mb: 1.5, cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={() => navigate('/contact')}>Support</Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            © {new Date().getFullYear()} TaskManager Pro. Engineered for excellence.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                                <Typography 
                                    key={social} 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'text.secondary', 
                                        cursor: 'pointer',
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
        </Box>
    );
};

export default Layout;