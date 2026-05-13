import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import CustomLoader from '../components/CustomLoader';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import Navbar from '../layout/Navbar';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const Layout = ({ toggleTheme, mode }) => {
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const token = useSelector((state) => state.auth.token);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    if (isInitialLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CustomLoader size={60} /></Box>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar mode={mode} toggleTheme={toggleTheme} user={user} handleLogout={handleLogout} />
            
            <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
                <Container maxWidth="lg">
                    <Header user={user} />
                    <Outlet />
                </Container>
            </Box>

            <Footer />
        </Box>
    );
};

export default Layout;