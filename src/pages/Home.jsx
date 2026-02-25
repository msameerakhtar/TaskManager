import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';

const Home = () => {
  const navigate = useNavigate();
  const logoUrl = "https://cdn-icons-png.flaticon.com/512/906/906334.png";

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', color: '#fff' }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(12px)', 
          boxShadow: 'none', 
          borderBottom: '1px solid rgba(255,255,255,0.05)' 
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
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(45deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TaskManager
              </Typography>
            </Box>
            <Box>
              <Button sx={{ color: '#fff', fontWeight: 600, textTransform: 'none' }} onClick={() => navigate('/login')}>Login</Button>
              <Button 
                variant="contained" 
                sx={{ 
                  ml: 2, 
                  borderRadius: '12px', 
                  background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
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
              lineHeight: 1.1 
            }}
          >
            Manage Your Tasks <br />
            <span style={{ background: 'linear-gradient(45deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with Ease
            </span>
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, color: 'rgba(255,255,255,0.6)', fontWeight: 400, maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
            The all-in-one platform to organize your work, track progress, and boost your productivity with a modern glassmorphic interface.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ 
                background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                color: '#fff', 
                px: 6, 
                py: 2, 
                fontWeight: 800,
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '1.1rem',
                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 25px 50px rgba(99, 102, 241, 0.4)' },
                transition: 'all 0.3s'
            }}
            onClick={() => navigate('/login')}
          >
            Get Started - It's Free
          </Button>
        </Container>
      </Box>

      <Container sx={{ py: 10 }}>
        <Typography variant="h4" textAlign="center" sx={{ mb: 8, fontWeight: 900, letterSpacing: '-1px' }}>
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
                bgcolor: 'rgba(255,255,255,0.03)', 
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: '0.3s',
                '&:hover': { transform: 'translateY(-10px)', border: '1px solid rgba(99, 102, 241, 0.3)' }
              }}>
                <CardContent>
                  <Box sx={{ color: '#6366f1', mb: 2, '& svg': { fontSize: 50 } }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', mb: 1.5 }}>{feature.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                    {feature.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ py: 6, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
            <Box 
              component="img"
              src={logoUrl}
              alt="Logo"
              sx={{ height: 25, width: 25, mr: 1, filter: 'hue-rotate(220deg)' }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                TaskManager Pro
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            © {new Date().getFullYear()} All rights reserved. Designed for Productivity.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;