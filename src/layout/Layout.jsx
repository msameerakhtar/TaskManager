import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, login } from '../features/auth/authSlice';
import { supabase } from '../config/supabaseClient';
import Navbar from '../layout/Navbar';
import Header from '../layout/Header';
import Footer from '../layout/Footer';

const Layout = ({ toggleTheme, mode }) => {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    useEffect(() => {
        const restoreSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                dispatch(login({ user: session.user, token: session.access_token }));
            } else {
                navigate('/login');
            }
            setIsInitialLoading(false);
        };
        restoreSession();
    }, [dispatch, navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    if (isInitialLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
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