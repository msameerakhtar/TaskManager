import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SuperAdminNavbar from './SuperAdminNavbar';
import SuperAdminSidebar from './SuperAdminSidebar';
import CustomLoader from '../components/CustomLoader';
import { SuperAdminSocketProvider } from '../features/admin/SuperAdminSocketContext';

const drawerWidth = 240;

const SuperAdminLayout = ({ toggleTheme, mode }) => {
    // mobileOpen: sidebar drawer open state on xs screens
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else if (user?.systemRole !== 'superadmin') {
            navigate('/tasks');
        }
    }, [token, user, navigate]);

    if (!token || user?.systemRole !== 'superadmin') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CustomLoader size={60} />
            </Box>
        );
    }

    const handleDrawerToggle = () => {
        setMobileOpen((prev) => !prev);
    };

    return (
        <SuperAdminSocketProvider>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Sidebar — on xs it's a temporary drawer, on sm+ it's permanent */}
                <SuperAdminSidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

                {/* Main content area — must not overflow on small screens */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        // On mobile: full width (sidebar is an overlay drawer)
                        // On sm+: subtract the permanent sidebar width
                        width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
                        minWidth: 0, // critical: prevents flex child from overflowing
                        overflow: 'hidden',
                    }}
                >
                    <SuperAdminNavbar
                        handleDrawerToggle={handleDrawerToggle}
                        mode={mode}
                        toggleTheme={toggleTheme}
                        user={user}
                    />
                    <Box
                        sx={{
                            flexGrow: 1,
                            // overflow here handles the scrollable content area
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            p: { xs: 2, sm: 3, md: 4 },
                        }}
                    >
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </SuperAdminSocketProvider>
    );
};

export default SuperAdminLayout;
