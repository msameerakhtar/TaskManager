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
    <Box sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ backgroundColor: '#fff', color: '#333', boxShadow: 'none', borderBottom: '1px solid #ddd' }}>
        <Container>
          <Toolbar disableGutters>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <Box 
                component="img"
                src={logoUrl}
                alt="Logo"
                sx={{ height: 40, width: 40, mr: 1.5 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                TaskManager
              </Typography>
            </Box>
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
            <Button variant="contained" sx={{ ml: 2, borderRadius: '8px' }} onClick={() => navigate('/signup')}>Sign Up</Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ backgroundColor: '#1976d2', color: 'white', py: 12, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
            Manage Your Tasks with Ease
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontWeight: '300' }}>
            The all-in-one platform to organize your work, track progress, and boost your productivity.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ 
                backgroundColor: '#fff', 
                color: '#1976d2', 
                '&:hover': { backgroundColor: '#e0e0e0' }, 
                px: 5, 
                py: 1.5, 
                fontWeight: 'bold',
                borderRadius: '50px'
            }}
            onClick={() => navigate('/login')}
          >
            Get Started - It's Free
          </Button>
        </Container>
      </Box>

      <Container sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom sx={{ mb: 6, fontWeight: 'bold' }}>
          Why Choose TaskManager?
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
              <CardContent>
                <AssignmentTurnedInIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>Organize Everything</Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep all your daily tasks and long-term projects in one secure place.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
              <CardContent>
                <SpeedIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>Track Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualize your workflow and stay on top of deadlines with real-time updates.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
              <CardContent>
                <SecurityIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }} gutterBottom>Secure Data</Typography>
                <Typography variant="body2" color="text.secondary">
                  Your data is encrypted and protected. Only you can access your tasks.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ backgroundColor: '#222', color: 'white', py: 6, textAlign: 'center' }}>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
            <Box 
              component="img"
              src={logoUrl}
              alt="Logo"
              sx={{ height: 30, width: 30, mr: 1, filter: 'brightness(0) invert(1)' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                TaskManager
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © {new Date().getFullYear()} TaskManager Pro. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;