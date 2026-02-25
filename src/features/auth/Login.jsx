import React, { useState } from 'react';
import { 
  TextField, Button, Typography, Paper, Container, 
  Box, Link, Alert, CircularProgress, InputAdornment, IconButton 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { login } from '../auth/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill in all fields.");
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (data?.session) {
        dispatch(login({
          user: data.session.user,
          token: data.session.access_token
        }));
        navigate('/tasks', { replace: true });
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0) 70%)',
        top: '-10%',
        right: '-5%',
        borderRadius: '50%',
      }} />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Paper elevation={0} sx={{ 
          p: 5, 
          borderRadius: '24px', 
          bgcolor: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
          }
        }}>
          <Typography variant="h4" fontWeight="900" sx={{ 
            color: '#fff', 
            mb: 1, 
            letterSpacing: '-1px' 
          }}>
            Login
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4 }}>
            Please enter your details to sign in
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: '12px', 
                bgcolor: 'rgba(211, 47, 47, 0.1)', 
                color: '#ff8a80',
                '& .MuiAlert-icon': { color: '#ff8a80' }
              }}
            >
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLogin} noValidate>
            <TextField 
              fullWidth 
              label="Email Address" 
              margin="normal" 
              variant="filled"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#6366f1' },
                mb: 1
              }}
            />
            <TextField 
              fullWidth 
              label="Password" 
              type={showPassword ? 'text' : 'password'}
              margin="normal" 
              variant="filled"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#6366f1' },
                mb: 2
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              fullWidth 
              variant="contained" 
              type="submit" 
              disabled={loading} 
              sx={{ 
                mt: 2, 
                py: 1.8, 
                borderRadius: '14px', 
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
          
          <Typography sx={{ mt: 4, color: 'rgba(255,255,255,0.6)' }}>
            New here?{' '}
            <Link component={RouterLink} to="/signup" sx={{ 
              color: '#818cf8', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}>
              Create an account
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;