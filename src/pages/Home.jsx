import React from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, Button, Stack, useTheme } from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

const Home = ({ mode, setMode }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh', 
            bgcolor: 'background.default', 
            color: 'text.primary',
            overflowX: 'hidden'
        }}>
            <Navbar mode={mode} toggleTheme={toggleTheme} />
            
            <Box sx={{ 
                position: 'relative',
                background: mode === 'dark' 
                    ? 'radial-gradient(circle at 50% -20%, #312e81 0%, #0f172a 100%)' 
                    : 'radial-gradient(circle at 50% -20%, #e0e7ff 0%, #ffffff 100%)',
                pt: { xs: 10, md: 15 },
                pb: { xs: 15, md: 20 },
                overflow: 'hidden'
            }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Typography 
                                    variant="h1" 
                                    sx={{ 
                                        fontWeight: 900, 
                                        fontSize: { xs: '3rem', md: '4.5rem' },
                                        lineHeight: 1.1,
                                        mb: 3,
                                        letterSpacing: '-2px'
                                    }}
                                >
                                    Organize Your Work <br />
                                    <Box component="span" sx={{ 
                                        background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        Master Your Life.
                                    </Box>
                                </Typography>
                                
                                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 5, maxWidth: '550px', fontWeight: 400, lineHeight: 1.6 }}>
                                    The most intuitive way to manage tasks, track progress, and collaborate with your team in real-time.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button 
                                        variant="contained" 
                                        size="large"
                                        onClick={() => navigate('/signup')}
                                        sx={{ 
                                            px: 5, py: 2, 
                                            borderRadius: '16px',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                                            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                                            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.5)' }
                                        }}
                                    >
                                        Get Started Free
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        size="large"
                                        onClick={() => navigate('/login')}
                                        sx={{ 
                                            px: 5, py: 2, 
                                            borderRadius: '16px',
                                            fontSize: '1.1rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            borderWidth: '2px',
                                            '&:hover': { borderWidth: '2px', bgcolor: 'action.hover' }
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                </Stack>
                            </motion.div>
                        </Grid>

                        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Box sx={{ 
                                    p: 4, 
                                    bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'white',
                                    borderRadius: '40px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.15)',
                                    textAlign: 'center'
                                }}>
                                    <RocketLaunchIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h5" fontWeight={900} mb={1}>Task Completed!</Typography>
                                    <Typography variant="body2" color="text.secondary">You've reached 90% of your weekly goal.</Typography>
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            
            <Container sx={{ py: 12 }}>
                <Typography 
                    variant="h3" 
                    textAlign="center" 
                    sx={{ fontWeight: 900, mb: 8, letterSpacing: '-1px' }}
                >
                    Everything you need to <Box component="span" sx={{ color: 'primary.main' }}>Succeed</Box>
                </Typography>

                <Grid container spacing={4}>
                    {[
                        { icon: <AssignmentTurnedInIcon />, title: "Smart Organization", desc: "Categorize tasks with ease.", color: '#6366f1' },
                        { icon: <SpeedIcon />, title: "Fast Performance", desc: "Experience zero lag interface.", color: '#a855f7' },
                        { icon: <SecurityIcon />, title: "Bank-Level Security", desc: "Your data is always safe.", color: '#ec4899' }
                    ].map((feature, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Card sx={{ 
                                textAlign: 'center', p: 5, borderRadius: '32px', height: '100%',
                                border: '1px solid', borderColor: 'divider',
                                background: mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-10px)' }
                            }}>
                                <CardContent>
                                    <Box sx={{ p: 2, borderRadius: '20px', bgcolor: `${feature.color}15`, color: feature.color, mb: 3, display: 'inline-flex' }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h5" fontWeight={800} gutterBottom>{feature.title}</Typography>
                                    <Typography variant="body1" color="text.secondary">{feature.desc}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <Footer />
        </Box>
    );
};

export default Home;