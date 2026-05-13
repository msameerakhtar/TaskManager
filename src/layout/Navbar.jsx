import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
    AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, IconButton, 
    Box, Container, Button, ListItemIcon, Drawer, List, ListItem, ListItemText,
    ListItemButton, Stack, Badge, Divider,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { 
    Logout as LogoutIcon, 
    Person as PersonIcon, 
    Brightness4 as DarkModeIcon, 
    Brightness7 as LightModeIcon,
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    AccessTime as DueSoonIcon,
    InfoOutlined as DefaultNotificationIcon,
    FactCheckOutlined as ApprovalIcon,
    TrendingUp as SlaEscalationIcon,
    ReportProblemOutlined as SlaBreachIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, createSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { notificationApi } from '../api/notificationApi';
import ProfileUpdateModal from '../features/auth/ProfileUpdateModal';

const Navbar = ({ mode, toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const token = useSelector((state) => state.auth.token);
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationPage, setNotificationPage] = useState(1);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    const isHomePage = location.pathname === '/';
    
    const fullName = useMemo(() => user?.fullName || user?.email?.split('@')[0] || "User", [user]);
    const avatarUrl = useMemo(() => user?.avatarUrl, [user]);

    const navItems = useMemo(() => [
        { label: 'Home', path: '/tasks' },
        { label: 'Enterprise', path: '/enterprise' },
        { label: 'Profile', path: '/profile' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Blog', path: '/blog' },
    ], []);

    const handleLogoutClick = useCallback(() => {
        setAnchorEl(null);
        setIsLogoutDialogOpen(true);
    }, []);

    const handleConfirmLogout = useCallback(() => {
        dispatch(logout());
        navigate('/login');
    }, [dispatch, navigate]);

    const handleDrawerToggle = useCallback(() => {
        setMobileOpen(prev => !prev);
    }, []);

    const formatTimeAgo = useCallback((dateInput) => {
        if (!dateInput) return '';
        const now = Date.now();
        const then = new Date(dateInput).getTime();
        const diffSec = Math.max(Math.floor((now - then) / 1000), 0);
        if (diffSec < 60) return `${diffSec}s ago`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay}d ago`;
    }, []);

    const getNotificationIcon = useCallback((type) => {
        if (type === 'due_soon') return <DueSoonIcon fontSize="small" sx={{ color: 'warning.main', mt: 0.2 }} />;
        if (type === 'approval_request') {
            return <ApprovalIcon fontSize="small" sx={{ color: 'info.main', mt: 0.2 }} />;
        }
        if (type === 'sla_escalation') {
            return <SlaEscalationIcon fontSize="small" sx={{ color: 'error.main', mt: 0.2 }} />;
        }
        if (type === 'sla_breach') {
            return <SlaBreachIcon fontSize="small" sx={{ color: 'error.dark', mt: 0.2 }} />;
        }
        return <DefaultNotificationIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.2 }} />;
    }, []);

    const getNotificationGroupLabel = (dateInput) => {
        const now = new Date();
        const date = new Date(dateInput);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);

        if (date >= todayStart) return 'Today';
        if (date >= yesterdayStart && date < todayStart) return 'Yesterday';
        return 'Older';
    };

    const fetchNotifications = useCallback(async (page = 1, append = false) => {
        if (!token) return;
        setLoadingNotifications(true);
        try {
            const response = await notificationApi.getNotifications({ page, limit: 8 });
            const data = response.data || {};
            const nextNotifications = data.notifications || [];
            setNotifications((prev) => (append ? [...prev, ...nextNotifications] : nextNotifications));
            setHasMoreNotifications(Boolean(data.meta?.hasMore));
            setUnreadCount(data.meta?.unreadCount || 0);
            setNotificationPage(page);
        } catch (error) {
            console.error('Notification fetch failed:', error);
        } finally {
            setLoadingNotifications(false);
        }
    }, [token]);

    useEffect(() => {
        if (token && user) {
            fetchNotifications(1, false);
        }
    }, [token, user, fetchNotifications]);

    const handleOpenNotifications = useCallback(async (event) => {
        setNotificationAnchorEl(event.currentTarget);
        setNotificationFilter('all');
        await fetchNotifications(1, false);
    }, [fetchNotifications]);

    const handleNotificationClick = useCallback(async (notification) => {
        try {
            if (!notification.isRead) {
                await notificationApi.markAsRead(notification._id);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        } finally {
            setNotificationAnchorEl(null);
            setNotifications((prev) => prev.map((n) => n._id === notification._id ? { ...n, isRead: true } : n));
            setUnreadCount((prev) => Math.max(prev - (notification.isRead ? 0 : 1), 0));
            const params = {};
            if (notification.projectId) {
                params.projectId = String(notification.projectId);
            }
            if (notification.taskId) {
                params.highlightTask = String(notification.taskId);
            }
            if (Object.keys(params).length > 0) {
                navigate({ pathname: '/tasks', search: createSearchParams(params).toString() });
            } else {
                navigate('/tasks');
            }
        }
    }, [token, navigate]);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    }, [token]);

    const handleLoadMoreNotifications = useCallback(async () => {
        if (!hasMoreNotifications || loadingNotifications) return;
        await fetchNotifications(notificationPage + 1, true);
    }, [hasMoreNotifications, loadingNotifications, fetchNotifications, notificationPage]);

    const visibleNotifications = useMemo(() => notifications.filter((notification) => {
        if (notificationFilter === 'unread') return !notification.isRead;
        if (notificationFilter === 'due_soon') return notification.type === 'due_soon';
        if (notificationFilter === 'approvals') return notification.type === 'approval_request';
        if (notificationFilter === 'sla') {
            return notification.type === 'sla_escalation' || notification.type === 'sla_breach';
        }
        return true;
    }), [notifications, notificationFilter]);

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
                                <IconButton onClick={handleOpenNotifications} sx={{ bgcolor: 'action.hover' }}>
                                    <Badge color="error" badgeContent={unreadCount}>
                                        <NotificationsIcon />
                                    </Badge>
                                </IconButton>
                                <Menu
                                    anchorEl={notificationAnchorEl}
                                    open={Boolean(notificationAnchorEl)}
                                    onClose={() => setNotificationAnchorEl(null)}
                                    PaperProps={{ 
                                        sx: { 
                                            borderRadius: '12px', 
                                            mt: 1.5, 
                                            minWidth: 320, 
                                            maxWidth: 360,
                                            maxHeight: '450px',
                                            overflowY: 'auto',
                                            '&::-webkit-scrollbar': { display: 'none' },
                                            msOverflowStyle: 'none',
                                            scrollbarWidth: 'none'
                                        } 
                                    }}
                                >
                                    <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Notifications</Typography>
                                        <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>Mark all read</Button>
                                    </Box>
                                    <Box sx={{ px: 1.5, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                        <Button
                                            size="small"
                                            variant={notificationFilter === 'all' ? 'contained' : 'outlined'}
                                            onClick={() => setNotificationFilter('all')}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={notificationFilter === 'unread' ? 'contained' : 'outlined'}
                                            onClick={() => setNotificationFilter('unread')}
                                        >
                                            Unread
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={notificationFilter === 'due_soon' ? 'contained' : 'outlined'}
                                            onClick={() => setNotificationFilter('due_soon')}
                                        >
                                            Due Soon
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={notificationFilter === 'approvals' ? 'contained' : 'outlined'}
                                            onClick={() => setNotificationFilter('approvals')}
                                        >
                                            Approvals
                                        </Button>
                                        <Button
                                            size="small"
                                            variant={notificationFilter === 'sla' ? 'contained' : 'outlined'}
                                            onClick={() => setNotificationFilter('sla')}
                                        >
                                            SLA
                                        </Button>
                                    </Box>
                                    <Divider />
                                    {visibleNotifications.length === 0 && (
                                        <MenuItem disabled>No notifications</MenuItem>
                                    )}
                                    {['Today', 'Yesterday', 'Older'].map((group) => {
                                        const groupedItems = visibleNotifications.filter(
                                            (notification) => getNotificationGroupLabel(notification.createdAt) === group
                                        );
                                        if (groupedItems.length === 0) return null;
                                        return (
                                            <Box key={group}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ px: 1.5, py: 0.7, display: 'block', color: 'text.secondary', fontWeight: 700 }}
                                                >
                                                    {group}
                                                </Typography>
                                                {groupedItems.map((notification) => (
                                                    <MenuItem
                                                        key={notification._id}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        sx={{
                                                            whiteSpace: 'normal',
                                                            alignItems: 'flex-start',
                                                            bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                                            gap: 1
                                                        }}
                                                    >
                                                        {getNotificationIcon(notification.type)}
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: notification.isRead ? 500 : 700 }}>
                                                                {notification.title}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {notification.message}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.3 }}>
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </Typography>
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Box>
                                        );
                                    })}
                                    {hasMoreNotifications && (
                                        <MenuItem onClick={handleLoadMoreNotifications} disabled={loadingNotifications}>
                                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                                {loadingNotifications ? 'Loading...' : 'Load more'}
                                            </Typography>
                                        </MenuItem>
                                    )}
                                </Menu>
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
                                    <MenuItem onClick={() => { setIsProfileModalOpen(true); setAnchorEl(null); }}>
                                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                                        Profile Settings
                                    </MenuItem>
                                    <MenuItem onClick={handleLogoutClick}>
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
            <ProfileUpdateModal 
                open={isProfileModalOpen} 
                handleClose={() => setIsProfileModalOpen(false)} 
            />

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={isLogoutDialogOpen}
                onClose={() => setIsLogoutDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '20px', p: 1, minWidth: 300 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Logout</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to log out of your account?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsLogoutDialogOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmLogout} 
                        variant="contained" 
                        color="error" 
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
                    >
                        Logout
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
};

export default Navbar;