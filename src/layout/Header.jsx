import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isDashboard = location.pathname !== '/';
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || "User";

    return (
        <Box sx={{ py: isDashboard ? 4 : 10, textAlign: isDashboard ? 'left' : 'center' }}>
            <Container>
                {isDashboard ? (
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Welcome, {firstName}! 👋</Typography>
                        <Typography color="text.secondary">Here is your productivity summary.</Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h2" fontWeight={900}>Manage Your Tasks Effectively</Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>The best tool for your daily workflow.</Typography>
                        <Button variant="contained" size="large" onClick={() => navigate('/signup')}>Get Started</Button>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default Header;