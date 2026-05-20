import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar, useTheme, ListItemIcon } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import ProfileUpdateModal from '../features/auth/ProfileUpdateModal';
import { getOptimizedImageUrl } from '../utils/imageHelper';

const SuperAdminNavbar = ({ handleDrawerToggle, mode, toggleTheme, user }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    return (
        <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary', backgroundImage: 'none' }}>
            <Toolbar>
                <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Super Admin Dashboard
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 600, mr: 1 }}>
                        Welcome, {user?.fullName?.split(' ')[0]} 👋
                    </Typography>

                    <IconButton color="inherit" onClick={() => navigate('/')} title="Go to Public Site" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                        <LanguageIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={toggleTheme}>
                        {isDark ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
                    </IconButton>
                    
                    <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
                        <Avatar 
                            key={user?.avatarUrl || 'no-avatar'}
                            src={getOptimizedImageUrl(user?.avatarUrl, { width: 100, height: 100 })} 
                            alt={user?.fullName} 
                            sx={{ width: 36, height: 36, border: `2px solid ${theme.palette.primary.main}` }}
                        >
                            {user?.fullName?.charAt(0)}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{ sx: { mt: 1, borderRadius: '12px', minWidth: 180, boxShadow: '0px 10px 20px rgba(0,0,0,0.1)' } }}
                    >
                        <MenuItem onClick={() => { handleMenuClose(); setIsProfileModalOpen(true); }}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            Profile Settings
                        </MenuItem>
                        <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <Typography color="error.main">Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
            <ProfileUpdateModal 
                open={isProfileModalOpen} 
                handleClose={() => setIsProfileModalOpen(false)} 
            />
        </AppBar>
    );
};

export default SuperAdminNavbar;
