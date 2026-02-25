import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Typography, Paper, Container, 
  Box, Link, Alert, Avatar, CircularProgress, InputAdornment, IconButton 
} from '@mui/material';
import { PhotoCamera, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { login } from '../auth/authSlice';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);

    try {
      let avatarUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrlData.publicUrl;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            avatar_url: avatarUrl,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.session) {
        dispatch(login({
          user: data.session.user,
          token: data.session.access_token
        }));
        navigate('/tasks', { replace: true });
      } else {
        alert("Account created! Please check your email for verification.");
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
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
      overflow: 'hidden',
      py: 4
    }}>
      <Box sx={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 70%)',
        bottom: '-10%',
        left: '-5%',
        borderRadius: '50%',
      }} />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Paper elevation={0} sx={{ 
          p: 4, 
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
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Join our professional task network
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ff8a80' }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSignup} noValidate>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                src={previewUrl} 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mb: 1.5, 
                  border: '2px solid #10b981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
                }} 
              />
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<PhotoCamera />}
                sx={{ 
                  borderRadius: '10px', 
                  color: '#10b981', 
                  borderColor: '#10b981',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#059669', bgcolor: 'rgba(16, 185, 129, 0.05)' }
                }}
              >
                Upload Photo
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
            </Box>

            <TextField 
              fullWidth label="Full Name" margin="normal" variant="filled" required 
              value={fullName} onChange={(e) => setFullName(e.target.value)} 
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#10b981' },
                mb: 1
              }}
            />
            <TextField 
              fullWidth label="Email Address" margin="normal" variant="filled" type="email" required 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#10b981' },
                mb: 1
              }}
            />
            
            <TextField 
              fullWidth label="Password" 
              type={showPassword ? 'text' : 'password'} 
              margin="normal" variant="filled" required 
              value={password} onChange={(e) => setPassword(e.target.value)} 
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#10b981' },
                mb: 1
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

            <TextField 
              fullWidth label="Confirm Password" 
              type={showPassword ? 'text' : 'password'} 
              margin="normal" variant="filled" required 
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
              sx={{ 
                '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
                '& .MuiFilledInput-underline:after': { borderBottomColor: '#10b981' },
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
              fullWidth variant="contained" type="submit" 
              disabled={loading} 
              sx={{ 
                mt: 2, 
                py: 1.8, 
                borderRadius: '14px', 
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem',
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #059669, #2563eb)',
                  transform: 'scale(1.02)',
                },
                transition: 'all 0.2s'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>
          
          <Typography mt={4} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Already a member?{' '}
            <Link component={RouterLink} to="/login" sx={{ 
              color: '#3b82f6', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}>
              Login Here
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;