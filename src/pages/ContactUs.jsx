import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Paper, Grid, 
  Container, Alert, Snackbar, InputAdornment, Stack, IconButton 
} from '@mui/material';
import { Person, Email, Send, Phone, LocationOn } from '@mui/icons-material';
import { supabase } from '../config/supabaseClient';

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  const handleCloseStatus = () => setStatus({ ...status, open: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('contacts').insert([formData]);
      if (error) throw error;

      setStatus({ 
        open: true, 
        message: "Thank you! Your message has been sent successfully.", 
        severity: 'success' 
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus({ 
        open: true, 
        message: error.message || "Something went wrong!", 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: '#f9f9f9',
      transition: '0.3s',
      '& fieldset': { borderColor: '#e0e0e0' },
      '&:hover fieldset': { borderColor: '#1a237e' },
      '&.Mui-focused fieldset': { borderColor: '#1a237e', borderWidth: '2px' },
    },
    '& label.Mui-focused': { color: '#1a237e' },
  };

  return (
    <Box sx={{ bgcolor: '#f4f7fe', minHeight: '100vh', py: 10 }}>
      <Container maxWidth="md">
        
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography 
            variant="h3" 
            fontWeight="900" 
            color="#1a237e" 
            gutterBottom
            sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
          >
            Get in Touch
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400, opacity: 0.8 }}
          >
            Have a question, feedback, or a project in mind? We'd love to hear from you. 
            Fill out the form below and we'll be in touch shortly!
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: '24px', 
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          <Box sx={{ 
            bgcolor: '#1a237e', 
            color: 'white', 
            p: 6, 
            width: { xs: '100%', md: '40%' },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>
              Contact Info
            </Typography>
            <Typography variant="body1" sx={{ mb: 6, opacity: 0.8 }}>
              Reach out to us directly through any of these channels.
            </Typography>

            <Stack spacing={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><Phone /></IconButton>
                <Typography variant="body2">+1 (555) 000-1234</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><Email /></IconButton>
                <Typography variant="body2">support@example.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><LocationOn /></IconButton>
                <Typography variant="body2">123 Tech Street, NY</Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 4, md: 8 }, width: { xs: '100%', md: '60%' }, bgcolor: 'white' }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Full Name" 
                    placeholder="John Doe"
                    required 
                    sx={textFieldStyles}
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><Person sx={{ color: '#1a237e' }} /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Email Address" 
                    type="email" 
                    placeholder="john@example.com"
                    required 
                    sx={textFieldStyles}
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><Email sx={{ color: '#1a237e' }} /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    fullWidth 
                    label="Your Message" 
                    multiline 
                    rows={5} 
                    placeholder="How can we help you?"
                    required 
                    sx={textFieldStyles}
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    type="submit" 
                    disabled={loading}
                    endIcon={!loading && <Send />}
                    sx={{ 
                      bgcolor: '#1a237e', 
                      py: 2, 
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      boxShadow: '0 10px 20px rgba(26, 35, 126, 0.2)',
                      '&:hover': { bgcolor: '#0d134a' }
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        </Paper>
      </Container>

      <Snackbar 
        open={status.open} 
        autoHideDuration={6000} 
        onClose={handleCloseStatus}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseStatus} 
          severity={status.severity} 
          variant="filled" 
          sx={{ width: '100%', borderRadius: '12px', fontWeight: 'bold' }}
        >
          {status.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactUs;