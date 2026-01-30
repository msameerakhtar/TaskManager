import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Container, Box, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    localStorage.setItem('registeredUser', JSON.stringify({ email, password }));
    alert("Account created successfully!");
    navigate('/login');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      backgroundImage: 'url(https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600)', 
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#2e7d32' }}>
            Register
          </Typography>
          <form onSubmit={handleSignup}>
            <TextField fullWidth label="Full Name" margin="normal" variant="outlined" required />
            <TextField fullWidth label="Email Address" margin="normal" variant="outlined" onChange={(e) => setEmail(e.target.value)} required />
            <TextField fullWidth label="Password" type="password" margin="normal" variant="outlined" onChange={(e) => setPassword(e.target.value)} required />
            <Button fullWidth variant="contained" type="submit" color="success" sx={{ mt: 3, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}>
              Create Account
            </Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Already a member? <Link href="/login" sx={{ fontWeight: 'bold' }}>Login</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;