import React, { useState, useCallback } from 'react';
import {
    Box, TextField, Button, Typography, Paper,
    Container, Snackbar, Alert, InputAdornment,
    Stack, IconButton, useTheme
} from '@mui/material';
import { Person, Email, Send, Phone, LocationOn } from '@mui/icons-material';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const CONTACT_INFO = {
    phone: '+1 (555) 000-1234',
    email: 'support@taskpro.com',
    address: '123 Tech Avenue, Silicon Valley',
};

const MAX_LENGTHS = {
    name: 100,
    email: 254,
    message: 1000,
};

const INITIAL_FORM = { name: '', email: '', message: '' };
const INITIAL_STATUS = { open: false, message: '', severity: 'success' };

const validators = {
    name: (v) => v.trim().length >= 2 || 'Name must be at least 2 characters.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    message: (v) => v.trim().length >= 10 || 'Message must be at least 10 characters.',
};

const validate = (formData) => {
    const errors = {};
    Object.entries(validators).forEach(([field, fn]) => {
        const result = fn(formData[field]);
        if (result !== true) errors[field] = result;
    });
    return errors;
};

const ContactUs = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(INITIAL_STATUS);

    const textFieldStyle = {
        '& .MuiOutlinedInput-root': {
            color: 'text.primary',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'primary.main' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
        },
        '& .MuiInputLabel-root': { color: 'text.secondary' },
        '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
    };

    const iconButtonStyle = {
        bgcolor: 'rgba(255,255,255,0.2)',
        color: 'white',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
    };

    const handleChange = useCallback((field) => (e) => {
        const value = e.target.value;
        if (value.length > MAX_LENGTHS[field]) return;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            const result = validators[field](value);
            setErrors((prev) => ({
                ...prev,
                [field]: result === true ? undefined : result,
            }));
        }
    }, [errors]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        const validationErrors = validate(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                message: formData.message.trim(),
            };
            await axios.post(`${API_BASE_URL}/contacts`, payload);
            
            setStatus({ open: true, message: 'Message sent successfully!', severity: 'success' });
            setFormData(INITIAL_FORM);
            setErrors({});
        } catch (err) {
            setStatus({
                open: true,
                message: err.response?.data?.message || 'Something went wrong. Please try again later.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseStatus = () => setStatus((prev) => ({ ...prev, open: false }));

    return (
        <Box sx={{ py: 10, color: 'text.primary' }}>
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-1.5px', mb: 2 }}>
                        Get in Touch
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400, color: 'text.secondary' }}
                    >
                        Have a question or feedback? Fill out the form below and we'll be in touch!
                    </Typography>
                </Box>

                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        overflow: 'hidden',
                        borderRadius: '24px',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                    }}
                >
                    <Box
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            color: 'white',
                            p: 6,
                            width: { xs: '100%', md: '40%' },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                            Contact Info
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 6, opacity: 0.8 }}>
                            Reach out to us directly through any of these channels.
                        </Typography>
                        <Stack spacing={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton sx={iconButtonStyle} aria-label="Phone">
                                    <Phone />
                                </IconButton>
                                <Typography sx={{ fontWeight: 500 }}>{CONTACT_INFO.phone}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton sx={iconButtonStyle} aria-label="Email">
                                    <Email />
                                </IconButton>
                                <Typography sx={{ fontWeight: 500 }}>{CONTACT_INFO.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton sx={iconButtonStyle} aria-label="Location">
                                    <LocationOn />
                                </IconButton>
                                <Typography sx={{ fontWeight: 500 }}>{CONTACT_INFO.address}</Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={{ p: { xs: 4, md: 8 }, width: { xs: '100%', md: '60%' } }}>
                        <form onSubmit={handleSubmit} noValidate>
                            <Stack spacing={4}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange('name')}
                                    error={Boolean(errors.name)}
                                    helperText={errors.name}
                                    inputProps={{ maxLength: MAX_LENGTHS.name }}
                                    sx={textFieldStyle}
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
                                    label="Email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    error={Boolean(errors.email)}
                                    helperText={errors.email}
                                    inputProps={{ maxLength: MAX_LENGTHS.email }}
                                    sx={textFieldStyle}
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
                                    label="Message"
                                    multiline
                                    rows={4}
                                    required
                                    value={formData.message}
                                    onChange={handleChange('message')}
                                    error={Boolean(errors.message)}
                                    helperText={
                                        errors.message ||
                                        `${formData.message.length}/${MAX_LENGTHS.message}`
                                    }
                                    inputProps={{ maxLength: MAX_LENGTHS.message }}
                                    sx={textFieldStyle}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                    endIcon={!loading && <Send />}
                                    sx={{
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        py: 1.8,
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`,
                                        '&:hover': {
                                            opacity: 0.9,
                                            transform: 'translateY(-2px)',
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {loading ? 'Sending Message...' : 'Send Message'}
                                </Button>
                            </Stack>
                        </form>
                    </Box>
                </Paper>
            </Container>

            <Snackbar
                open={status.open}
                autoHideDuration={6000}
                onClose={handleCloseStatus}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={status.severity}
                    variant="filled"
                    role="alert"
                    onClose={handleCloseStatus}
                    sx={{
                        borderRadius: '12px',
                        fontWeight: 'bold',
                    }}
                >
                    {status.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContactUs;