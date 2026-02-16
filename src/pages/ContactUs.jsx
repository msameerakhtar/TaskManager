import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Grid, Container, Alert, Snackbar, InputAdornment, Stack, IconButton } from '@mui/material';
import { Person, Email, Send, Phone, LocationOn } from '@mui/icons-material';
import { supabase } from '../config/supabaseClient';

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contacts').insert([formData]);
      if (error) throw error;
      setStatus({ open: true, message: "Message sent successfully!", severity: 'success' });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setStatus({ open: true, message: error.message || "Something went wrong!", severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 10 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" gutterBottom>Get in Touch</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
            Have a question or feedback? Fill out the form below and we'll be in touch!
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
          
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 6, width: { xs: '100%', md: '40%' }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h4" gutterBottom>Contact Info</Typography>
            <Typography variant="body1" sx={{ mb: 6, opacity: 0.8 }}>Reach out to us directly.</Typography>
            <Stack spacing={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><Phone /></IconButton><Typography>+1 (555) 000-1234</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><Email /></IconButton><Typography>support@example.com</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}><IconButton sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}><LocationOn /></IconButton><Typography>123 Tech Street, NY</Typography></Box>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 4, md: 8 }, width: { xs: '100%', md: '60%' }, bgcolor: 'white' }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12}><TextField fullWidth label="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="primary" /></InputAdornment>) }} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="primary" /></InputAdornment>) }} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Message" multiline rows={4} required value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} /></Grid>
                <Grid item xs={12}><Button fullWidth variant="contained" color="primary" type="submit" disabled={loading} endIcon={!loading && <Send />}>{loading ? 'Sending...' : 'Send Message'}</Button></Grid>
              </Grid>
            </form>
          </Box>
        </Paper>
      </Container>
      
      <Snackbar open={status.open} autoHideDuration={6000} onClose={() => setStatus({...status, open: false})} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={status.severity} variant="filled" sx={{ borderRadius: '12px' }}>{status.message}</Alert>
      </Snackbar>
    </Box>
  );
};
export default ContactUs;