import React, { useState } from 'react';
import { 
  TextField, Button, Typography, Paper, Container, 
  Box, Link, Alert, CircularProgress, InputAdornment, IconButton, useTheme 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import { useDispatch } from 'react-redux';
import { login } from '../auth/authSlice';

const Login = ({ mode, setMode }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
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
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      if (token) {
        dispatch(login({
          user: user,
          token: token
        }));
        navigate('/tasks', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease'
    }}>
      <IconButton 
        onClick={() => setMode(isDark ? 'light' : 'dark')} 
        sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
      >
        {isDark ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
      </IconButton>

      <Box sx={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${theme.palette.primary.main}26 0%, transparent 70%)`,
        top: '-10%',
        right: '-5%',
        borderRadius: '50%',
      }} />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Paper elevation={0} sx={{ 
          p: 5, 
          borderRadius: '24px', 
          bgcolor: 'background.paper', 
          backdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: 'text.primary', mb: 1, letterSpacing: '-1px' }}>Login</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>Please enter your details to sign in</Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'error.main' + '1A', color: 'error.main' }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLogin} noValidate>
            <TextField 
              fullWidth label="Email Address" margin="normal" variant="filled"
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', color: 'text.primary' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                mb: 1
              }}
            />
            <TextField 
              fullWidth label="Password" type={showPassword ? 'text' : 'password'}
              margin="normal" variant="filled" value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', color: 'text.primary' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                mb: 2
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              fullWidth variant="contained" type="submit" disabled={loading} 
              sx={{ 
                mt: 2, py: 1.8, borderRadius: '14px', fontWeight: 'bold', textTransform: 'none',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
          
          <Typography sx={{ mt: 4, color: 'text.secondary' }}>
            New here?{' '}
            <Link component={RouterLink} to="/signup" sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none' }}>
              Create an account
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;