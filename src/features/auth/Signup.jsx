import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Container, Box, Link, Alert, Avatar } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useDispatch } from 'react-redux';
import { login } from './authSlice';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let avatarUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        let { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrlData.publicUrl;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_url: avatarUrl,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.session) {
        localStorage.setItem('userToken', data.session.access_token);
        dispatch(login({
          user: data.session.user,
          token: data.session.access_token
        }));
      }

      alert("Success! Account created.");
      navigate('/login');
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
      backgroundImage: 'url(https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1600)', 
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      py: 4
    }}>
      <Container maxWidth="xs">
        <Paper elevation={15} sx={{ 
          p: 4, 
          textAlign: 'center', 
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
        }}>
          <Typography variant="h4" gutterBottom fontWeight="800" color="#2e7d32">
            Register
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSignup} autoComplete="off">
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                src={previewUrl} 
                sx={{ width: 80, height: 80, mb: 1, border: '2px solid #2e7d32' }} 
              />
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<PhotoCamera />}
                color="success"
              >
                Upload Photo
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </Button>
            </Box>

            <TextField 
              fullWidth label="Full Name" margin="normal" required 
              value={fullName} onChange={(e) => setFullName(e.target.value)} 
              autoComplete="none"
            />
            <TextField 
              fullWidth label="Email Address" margin="normal" type="email" required 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              autoComplete="none"
            />
            <TextField 
              fullWidth label="Password" type="password" margin="normal" required 
              value={password} onChange={(e) => setPassword(e.target.value)} 
              autoComplete="new-password"
            />
            
            <Button 
              fullWidth variant="contained" color="success" type="submit" 
              disabled={loading} sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          
          <Typography mt={3}>
            Already a member? <Link href="/login" sx={{ fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;