import React, { useState } from 'react';
import { 
    AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, IconButton, 
    Box, Container, Button, ListItemIcon, Drawer, List, ListItem, ListItemText,
    ListItemButton, Stack
} from '@mui/material';
import { 
    Logout as LogoutIcon, 
    Person as PersonIcon, 
    Brightness4 as DarkModeIcon, 
    Brightness7 as LightModeIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { supabase } from '../config/supabaseClient';

const Navbar = ({ mode, toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isHomePage = location.pathname === '/';
    
    const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    const avatarUrl = user?.user_metadata?.avatar_url;

    const navItems = [
        { label: 'Home', path: '/tasks' },
        { label: 'Profile', path: '/profile' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Blog', path: '/blog' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <AppBar 
            position="sticky" 
            elevation={0} 
            sx={{ 
                bgcolor: mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(12px)', 
                borderBottom: '1px solid', 
                borderColor: 'divider', 
                color: 'text.primary',
                zIndex: (theme) => theme.zIndex.drawer + 1
            }}
        >
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {user && !isHomePage && (
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ mr: 2, display: { md: 'none' } }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography 
                            variant="h6" 
                            onClick={() => navigate(user ? '/tasks' : '/')}
                            sx={{ 
                                fontWeight: '900', 
                                cursor: 'pointer',
                                background: 'linear-gradient(45deg, #6366f1, #a855f7)', 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            TaskManager
                        </Typography>
                    </Box>

                    {user && !isHomePage && (
                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.label}
                                    onClick={() => navigate(item.path)}
                                    sx={{ 
                                        color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                        <IconButton onClick={toggleTheme} sx={{ bgcolor: 'action.hover' }}>
                            {mode === 'dark' ? <LightModeIcon sx={{ color: '#f59e0b' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
                        </IconButton>
                        
                        {isHomePage || !user ? (
                            <Stack direction="row" spacing={1}>
                                <Button 
                                    variant="text" 
                                    onClick={() => navigate('/login')}
                                    sx={{ fontWeight: 700, textTransform: 'none', color: 'text.primary' }}
                                >
                                    Login
                                </Button>
                                <Button 
                                    variant="contained" 
                                    onClick={() => navigate('/signup')}
                                    sx={{ 
                                        fontWeight: 700, 
                                        textTransform: 'none', 
                                        borderRadius: '10px',
                                        background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                                    }}
                                >
                                    Sign Up
                                </Button>
                            </Stack>
                        ) : (
                            <>
                                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                                    <Avatar 
                                        src={avatarUrl}
                                        alt={fullName}
                                        sx={{ 
                                            width: 35, 
                                            height: 35, 
                                            bgcolor: 'primary.main', 
                                            fontSize: '14px',
                                            border: '2px solid',
                                            borderColor: 'primary.main'
                                        }}
                                    >
                                        {!avatarUrl && fullName.charAt(0).toUpperCase()}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={() => setAnchorEl(null)}
                                    PaperProps={{ sx: { borderRadius: '12px', mt: 1.5, minWidth: 180, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' } }}
                                >
                                    <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                                        Profile
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                        Logout
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, bgcolor: 'background.default' },
                }}
            >
                <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: 'primary.main' }}>
                        Menu
                    </Typography>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemButton 
                                    onClick={() => navigate(item.path)}
                                    sx={{ 
                                        borderRadius: '8px',
                                        mb: 1,
                                        bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent'
                                    }}
                                >
                                    <ListItemText 
                                        primary={item.label} 
                                        primaryTypographyProps={{ 
                                            fontWeight: location.pathname === item.path ? 700 : 500,
                                            color: location.pathname === item.path ? 'primary.main' : 'text.primary'
                                        }} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default Navbar;