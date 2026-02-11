import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Container, Box, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        localStorage.setItem('userToken', data.session.access_token);
        
        dispatch(login({
          user: data.session.user,
          token: data.session.access_token
        }));
      }

      alert("Success! You can now login.");
      setLoading(false);
      navigate('/login');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#f0f2f5' }}>
      <Container maxWidth="xs">
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">Register</Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSignup}>
            <TextField 
              fullWidth 
              label="Email" 
              margin="normal" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
            <TextField 
              fullWidth 
              label="Password" 
              type="password" 
              margin="normal" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
            <Button 
              fullWidth 
              variant="contained" 
              color="success" 
              type="submit" 
              disabled={loading} 
              sx={{ mt: 2, fontWeight: 'bold' }}
            >
              {loading ? 'Processing...' : 'Register'}
            </Button>
          </form>
          
          <Typography mt={2}>
            Already a member? <Link href="/login" sx={{ cursor: 'pointer' }}>Login</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;