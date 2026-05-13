import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Typography, Paper, Container, 
  Box, Link, Alert, Avatar, InputAdornment, IconButton, useTheme 
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';
import { PhotoCamera, Visibility, VisibilityOff } from '@mui/icons-material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { useDispatch } from 'react-redux';
import { login } from '../auth/authSlice';
// import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const Signup = ({ mode, setMode }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // const { executeRecaptcha } = useGoogleReCaptcha();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signupMutation = useMutation({
    mutationFn: (data) => authApi.signup(data).then(res => res.data),
    onSuccess: ({ token, user }) => {
      if (token) {
        dispatch(login({ user, token }));
        navigate('/tasks', { replace: true });
      } else {
        alert("Account created successfully! Please login.");
        navigate('/login');
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || err.message || "Registration failed.");
    },
  });

  const loading = signupMutation.isPending;

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
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
    if (password !== confirmPassword) return setError("Passwords do not match.");

    // Get reCAPTCHA v3 token silently
    // let recaptchaToken = '';
    // if (executeRecaptcha) {
    //   recaptchaToken = await executeRecaptcha('signup');
    // }

    signupMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      avatarUrl: "",
      // recaptchaToken,
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default', position: 'relative', py: 4 }}>
      <IconButton 
        onClick={() => setMode(isDark ? 'light' : 'dark')} 
        sx={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
      >
        {isDark ? <LightModeIcon sx={{ color: '#fbbf24' }} /> : <DarkModeIcon sx={{ color: '#6366f1' }} />}
      </IconButton>

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Paper elevation={0} sx={{ 
          p: 4, borderRadius: '24px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', textAlign: 'center'
        }}>
          <Typography variant="h4" fontWeight="900" sx={{ color: 'text.primary', mb: 1 }}>Create Account</Typography>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
          
          <form onSubmit={handleSignup} noValidate>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar src={previewUrl} sx={{ width: 80, height: 80, mb: 1.5, border: '2px solid', borderColor: 'primary.main' }} />
              <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />}>
                Upload Photo <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
            </Box>

            <TextField fullWidth label="Full Name" margin="normal" variant="filled" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' }, mb: 1 }} />
            <TextField fullWidth label="Email" margin="normal" variant="filled" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' }, mb: 1 }} />
            <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} margin="normal" variant="filled" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' }, mb: 1 }}
              InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>) }} />
            <TextField fullWidth label="Confirm Password" type={showPassword ? 'text' : 'password'} margin="normal" variant="filled" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ '& .MuiFilledInput-root': { borderRadius: '12px' }, mb: 2 }} />

            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ mt: 2, py: 1.8, borderRadius: '14px', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}>
              {loading ? <CustomLoader size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
            </Button>
          </form>
          <Typography mt={4} sx={{ color: 'text.secondary' }}>
            Already a member? <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold' }}>Login Here</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;