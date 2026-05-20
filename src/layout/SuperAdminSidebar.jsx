import React from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Typography, useTheme, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShieldIcon from '@mui/icons-material/Shield';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const SuperAdminSidebar = ({ mobileOpen, handleDrawerToggle }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: 'Overview',      icon: <DashboardIcon />,    path: '/admin/overview' },
        { text: 'Users',         icon: <GroupIcon />,        path: '/admin/users' },
        { text: 'Workspaces',    icon: <WorkspacesIcon />,   path: '/admin/workspaces' },
        { text: 'Audit Logs',    icon: <ReceiptLongIcon />,  path: '/admin/audit' },
        { text: 'RBAC Settings', icon: <ShieldIcon />,       path: '/admin/rbac' },
    ];

    const drawerPaperSx = {
        boxSizing: 'border-box',
        width: drawerWidth,
        backgroundImage: 'none',
        borderRight: `1px solid ${theme.palette.divider}`,
    };

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo / Brand — matches main app Navbar */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        letterSpacing: '-0.5px',
                        background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        cursor: 'default',
                        userSelect: 'none',
                    }}
                >
                    TaskManager
                </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {/* Nav Items */}
            <List sx={{ px: 2, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const active = location.pathname.startsWith(item.path);
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => {
                                    navigate(item.path);
                                    // Always close on mobile after navigation
                                    if (mobileOpen) handleDrawerToggle();
                                }}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: active
                                        ? `${theme.palette.primary.main}1A`
                                        : 'transparent',
                                    color: active ? 'primary.main' : 'text.secondary',
                                    transition: 'background-color 0.2s',
                                    '&:hover': {
                                        bgcolor: active
                                            ? `${theme.palette.primary.main}2A`
                                            : 'action.hover',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontWeight: active ? 700 : 500 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{
                // On mobile: no static space reserved (drawer is an overlay)
                // On sm+: reserve permanent sidebar width
                width: { xs: 0, sm: drawerWidth },
                flexShrink: 0,
            }}
        >
            {/* MOBILE — temporary overlay drawer (hidden by default, opens via hamburger) */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        ...drawerPaperSx,
                        // Mobile drawer: sits on top, does NOT push content
                        border: 'none',
                        boxShadow: 24,
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* DESKTOP — permanent sidebar always visible */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': drawerPaperSx,
                }}
                open
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default SuperAdminSidebar;
