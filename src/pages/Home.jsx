import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card, CardContent, useTheme, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const Home = ({ mode, setMode }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const logoUrl = "https://cdn-icons-png.flaticon.com/512/906/906334.png";

    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            <AppBar 
                position="sticky" 
                sx={{ 
                    background: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(12px)', 
                    boxShadow: 'none', 
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Container>
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                        <Box 
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => navigate('/')}
                        >
                            <Box 
                                component="img"
                                src={logoUrl}
                                alt="Logo"
                                sx={{ height: 35, width: 35, mr: 1.5, filter: 'hue-rotate(220deg)' }}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.5px', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                TaskManager
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton onClick={toggleTheme} color="inherit">
                                {isDark ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
                            </IconButton>
                            <Button sx={{ color: 'text.primary', fontWeight: 600, textTransform: 'none' }} onClick={() => navigate('/login')}>Login</Button>
                            <Button 
                                variant="contained" 
                                sx={{ 
                                    ml: 1, 
                                    borderRadius: '12px', 
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    boxShadow: `0 4px 15px ${theme.palette.primary.main}66`
                                }} 
                                onClick={() => navigate('/signup')}
                            >
                                Sign Up
                            </Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            <Box sx={{ py: { xs: 10, md: 15 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <Container maxWidth="md">
                    <Typography 
                        variant="h1" 
                        sx={{ 
                            fontWeight: 900, 
                            fontSize: { xs: '2.8rem', md: '4.5rem' }, 
                            mb: 3, 
                            letterSpacing: '-2px',
                            lineHeight: 1.1,
                            color: 'text.primary'
                        }}
                    >
                        Manage Your Tasks <br />
                        
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 5, color: 'text.secondary', fontWeight: 400, maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
                        The all-in-one platform to organize your work, track progress, and boost your productivity with a modern glassmorphic interface.
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large" 
                        sx={{ 
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            color: '#fff', 
                            px: 6, 
                            py: 2, 
                            fontWeight: 800,
                            borderRadius: '16px',
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            boxShadow: `0 20px 40px ${theme.palette.primary.main}4D`,
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 25px 50px ${theme.palette.primary.main}66` },
                            transition: 'all 0.3s'
                        }}
                        onClick={() => navigate('/login')}
                    >
                        Get Started - It's Free
                    </Button>
                </Container>
            </Box>

            <Container sx={{ py: 10 }}>
                <Typography variant="h4" textAlign="center" sx={{ mb: 8, fontWeight: 900, letterSpacing: '-1px', color: 'text.primary' }}>
                    Why Choose TaskManager?
                </Typography>
                <Grid container spacing={4}>
                    {[
                        { icon: <AssignmentTurnedInIcon />, title: "Organize Everything", desc: "Keep all your daily tasks and long-term projects in one secure place." },
                        { icon: <SpeedIcon />, title: "Track Progress", desc: "Visualize your workflow and stay on top of deadlines with real-time updates." },
                        { icon: <SecurityIcon />, title: "Secure Data", desc: "Your data is encrypted and protected. Only you can access your tasks." }
                    ].map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card sx={{ 
                                height: '100%', 
                                textAlign: 'center', 
                                p: 4, 
                                bgcolor: 'background.paper', 
                                backdropFilter: 'blur(10px)',
                                borderRadius: '24px',
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: '0.3s',
                                backgroundImage: 'none',
                                '&:hover': { 
                                    transform: 'translateY(-10px)', 
                                    borderColor: 'primary.main',
                                    boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.05)'
                                }
                            }}>
                                <CardContent>
                                    <Box sx={{ color: 'primary.main', mb: 2, '& svg': { fontSize: 50 } }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>{feature.title}</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                                        {feature.desc}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <Box sx={{ py: 6, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Container>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                        <Box 
                            component="img"
                            src={logoUrl}
                            alt="Logo"
                            sx={{ height: 25, width: 25, mr: 1, filter: 'hue-rotate(220deg)' }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'text.primary' }}>
                                TaskManager Pro
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        © {new Date().getFullYear()} All rights reserved. Designed for Productivity.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;