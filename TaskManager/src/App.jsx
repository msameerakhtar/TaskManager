import React, { useState } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Stack,
  InputAdornment,
  CssBaseline
} from '@mui/material';
import { Phone, Email, Person, Message } from '@mui/icons-material';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
  };

  return (
    <>
      <CssBaseline />
      <Box 
        sx={{ 
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <Container maxWidth="sm">
          <Paper 
            elevation={24}
            sx={{ 
              p: { xs: 4, md: 6 }, 
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Typography variant="h4" gutterBottom align="center" fontWeight="800" color="primary" sx={{ letterSpacing: 1 }}>
              Get In Touch
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary', fontWeight: 500 }}>
              Our team will get back to you within 24 hours.
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  variant="outlined"
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  variant="outlined"
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  variant="outlined"
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  multiline
                  rows={3}
                  variant="outlined"
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Message color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  sx={{ 
                    py: 2, 
                    fontSize: '1rem', 
                    fontWeight: 'bold',
                    borderRadius: 3,
                    textTransform: 'none', 
                    boxShadow: '0 10px 20px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        transition: '0.3s'
                    }
                  }}
                >
                  Send Message
                </Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    </>
  );
}

export default App;