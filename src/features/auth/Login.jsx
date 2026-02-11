import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Container, Box, Link, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      const token = data.session.access_token;
      const user = data.session.user;

      localStorage.setItem('userToken', token); 

      dispatch(login({
        user: user,
        token: token
      }));

      navigate('/tasks', { replace: true });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600)', backgroundSize: 'cover' }}>
      <Container maxWidth="xs">
        <Paper elevation={15} sx={{ p: 4, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="800" color="#1a237e">Secure Login</Typography>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 2 }}>{error}</Alert>}
          <form onSubmit={handleLogin} autoComplete="off">
            <TextField fullWidth label="Email" margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField fullWidth label="Password" type="password" margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 3, py: 1.5, bgcolor: '#1a237e' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In with Supabase'}
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