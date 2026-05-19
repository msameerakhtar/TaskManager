import React, { useState, useEffect, useCallback } from 'react';
import { 
  TextField, Button, Typography, Stack, Box, Alert, Link, useTheme 
} from '@mui/material';
import CustomLoader from '../../components/CustomLoader';
import { authApi } from '../../api/authApi';
import { useMutation } from '@tanstack/react-query';

const OtpVerification = ({ email, onSuccess, onCancel }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(60);

  // Decrement countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const verifyMutation = useMutation({
    mutationFn: (data) => authApi.verifyOtp(data).then(res => res.data),
    onSuccess: (data) => {
      setSuccessMsg('Account verified successfully! Welcome.');
      setTimeout(() => {
        onSuccess(data);
      }, 1000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  });

  const resendMutation = useMutation({
    mutationFn: (data) => authApi.resendOtp(data).then(res => res.data),
    onSuccess: (data) => {
      setSuccessMsg(data.message || 'Verification code resent successfully.');
      setError('');
      setTimer(60);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    }
  });

  const handleVerify = useCallback((e) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      return setError('Please enter a valid 6-digit OTP code.');
    }
    setError('');
    setSuccessMsg('');
    verifyMutation.mutate({ email, otpCode: otpCode.trim() });
  }, [otpCode, email, verifyMutation]);

  const handleResend = useCallback(() => {
    if (timer > 0) return;
    setError('');
    setSuccessMsg('');
    resendMutation.mutate({ email });
  }, [email, timer, resendMutation]);

  const loading = verifyMutation.isPending;
  const resendLoading = resendMutation.isPending;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="900" sx={{ color: 'text.primary', mb: 1, letterSpacing: '-1px' }}>
        Verify Email
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        We sent a 6-digit OTP code to <strong style={{ color: theme.palette.primary.main }}>{email}</strong>. Please enter it below to activate your account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'error.main' + '1A', color: 'error.main' }}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', bgcolor: 'success.main' + '1A', color: 'success.main' }}>
          {successMsg}
        </Alert>
      )}

      <form onSubmit={handleVerify} noValidate>
        <TextField 
          fullWidth 
          label="Verification Code (OTP)" 
          margin="normal" 
          variant="filled"
          placeholder="123456"
          inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.25rem', letterSpacing: '8px', fontWeight: 'bold' } }}
          value={otpCode} 
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // only allow digits
          sx={{ 
            '& .MuiFilledInput-root': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', color: 'text.primary' },
            '& .MuiFilledInput-underline:before': { borderBottom: 'none' },
            mb: 3
          }}
        />

        <Button 
          fullWidth 
          variant="contained" 
          type="submit" 
          disabled={loading || resendLoading} 
          sx={{ 
            py: 1.8, borderRadius: '14px', fontWeight: 'bold', textTransform: 'none',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            boxShadow: `0 10px 20px ${theme.palette.primary.main}4D`,
            mb: 2
          }}
        >
          {loading ? <CustomLoader size={24} sx={{ color: '#fff' }} /> : 'Verify and Start'}
        </Button>
      </form>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <Link 
          component="button" 
          onClick={onCancel}
          sx={{ color: 'text.secondary', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}
        >
          ← Back to Login
        </Link>

        {timer > 0 ? (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Resend in {timer}s
          </Typography>
        ) : (
          <Link 
            component="button" 
            onClick={handleResend}
            disabled={resendLoading}
            sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.875rem' }}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </Link>
        )}
      </Stack>
    </Box>
  );
};

export default OtpVerification;
