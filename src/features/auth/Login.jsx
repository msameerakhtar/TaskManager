import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Container, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const DUMMY_EMAIL = "admin@test.com";
    const DUMMY_PASS = "12345";
    const storedUser = JSON.parse(localStorage.getItem('registeredUser'));

    if ((email === DUMMY_EMAIL && password === DUMMY_PASS) || 
        (storedUser && email === storedUser.email && password === storedUser.password)) {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/tasks');
    } else {
      setError('Invalid credentials! Please try again.');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Container maxWidth="xs">
        <Paper elevation={15} sx={{ 
          p: 4, 
          borderRadius: 4, 
          bgcolor: 'rgba(255, 255, 255, 0.85)', 
          backdropFilter: 'blur(8px)',
          textAlign: 'center'
        }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#1a237e' }}>
            Login
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin}>
            <TextField fullWidth label="Email" margin="normal" variant="outlined" onChange={(e) => setEmail(e.target.value)} required />
            <TextField fullWidth label="Password" type="password" margin="normal" variant="outlined" onChange={(e) => setPassword(e.target.value)} required />
            <Button fullWidth variant="contained" type="submit" sx={{ mt: 3, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}>
              Sign In
            </Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Don't have an account? <Link href="/signup" sx={{ fontWeight: 'bold' }}>Sign Up</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;