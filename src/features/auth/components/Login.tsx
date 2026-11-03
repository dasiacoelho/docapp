import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Typography,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  MedicalServices,
  AccessTime,
  NotificationsActive,
  VerifiedUser,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '../hooks';

export function Login() {
  const navigate = useNavigate();
  const { login, demoLogin, resetPassword, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = (role: 'patient' | 'doctor' | 'admin') => {
    demoLogin(role);
    if (role === 'patient') navigate('/patient/dashboard');
    else if (role === 'doctor') navigate('/doctor/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(resetEmail || email);
      setError('Password reset email sent! Check your inbox.');
      setForgotPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        background: 'radial-gradient(at 0% 0%, #e0f2fe 0, transparent 50%), radial-gradient(at 100% 100%, #ccfbf1 0, transparent 50%), #f8fafc',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 960,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12)',
          bgcolor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Left Branding Hero Banner */}
        <Box
          sx={{
            p: { xs: 4, md: 5 },
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0d9488 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MedicalServices sx={{ color: '#ffffff', fontSize: 26 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                DocApp.
              </Typography>
            </Box>

            <Typography variant="h4" fontWeight={800} sx={{ mb: 2, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Healthcare without the wait.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 4, lineHeight: 1.6 }}>
              Real-time queue tracking, live doctor availability, and smart appointment scheduling across modern clinics.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccessTime sx={{ color: '#38bdf8' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
                  Live Queue Position & Wait Times
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <NotificationsActive sx={{ color: '#2dd4bf' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
                  Instant SMS & Push Notifications
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <VerifiedUser sx={{ color: '#facc15' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 500 }}>
                  Board-Certified Doctors & Specialists
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              Trusted by 50,000+ patients and top clinics worldwide.
            </Typography>
          </Box>
        </Box>

        {/* Right Form Card */}
        <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Quick Demo Access Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: '16px',
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="primary.main" letterSpacing="0.05em">
                ⚡ 1-CLICK INSTANT DEMO
              </Typography>
              <Chip label="Ready to Test" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDemoSignIn('patient')}
                sx={{
                  bgcolor: '#0284c7',
                  fontSize: '0.75rem',
                  py: 0.8,
                  '&:hover': { bgcolor: '#0369a1' },
                }}
              >
                Patient
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDemoSignIn('doctor')}
                sx={{
                  bgcolor: '#0d9488',
                  fontSize: '0.75rem',
                  py: 0.8,
                  '&:hover': { bgcolor: '#0f766e' },
                }}
              >
                Doctor
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleDemoSignIn('admin')}
                sx={{
                  bgcolor: '#334155',
                  fontSize: '0.75rem',
                  py: 0.8,
                  '&:hover': { bgcolor: '#1e293b' },
                }}
              >
                Admin
              </Button>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              OR SIGN IN WITH EMAIL
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {forgotPassword ? (
            <form onSubmit={handleResetPassword}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Reset Your Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email address and we'll send a recovery link.
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {displayError && <Alert severity="info" sx={{ mb: 2 }}>{displayError}</Alert>}
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mb: 1.5 }}>
                Send Reset Link
              </Button>
              <Button fullWidth variant="text" onClick={() => setForgotPassword(false)}>
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em" sx={{ mb: 0.5 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Sign in to your DocApp portal
              </Typography>

              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 1.5 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => setForgotPassword(true)}
                  sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </Box>

              {displayError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{displayError}</Alert>}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                sx={{ py: 1.3, fontSize: '0.95rem' }}
              >
                Sign In
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => navigate('/register')}
                    sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Create Account
                  </Link>
                </Typography>
              </Box>
            </form>
          )}
        </Box>
      </Box>
    </Box>
  );
}