import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
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
  const { login, resetPassword, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // RoleHome will redirect to appropriate portal based on user role
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(friendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(resetEmail || email);
      setResetSent(true);
    } catch (err: any) {
      setError(friendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f8fafc',
      background: 'radial-gradient(at 0% 0%, #e0f2fe 0, transparent 50%), radial-gradient(at 100% 100%, #ccfbf1 0, transparent 50%), #f8fafc',
      p: { xs: 2, sm: 4 },
    }}>
      <Box sx={{
        maxWidth: 940,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.12)',
        bgcolor: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.8)',
      }}>
        {/* ── Left Hero ── */}
        <Box sx={{
          p: { xs: 4, md: 5 },
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0d9488 100%)',
          color: '#ffffff',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px',
                bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MedicalServices sx={{ color: '#ffffff', fontSize: 26 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">DocApp.</Typography>
            </Box>

            <Typography variant="h4" fontWeight={800} sx={{ mb: 2, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
              Healthcare without the wait.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.6 }}>
              Real-time queue tracking, live doctor availability, and smart appointment scheduling.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { icon: <AccessTime sx={{ color: '#38bdf8' }} />, label: 'Live Queue Position & Wait Times' },
                { icon: <NotificationsActive sx={{ color: '#2dd4bf' }} />, label: 'Instant SMS & Push Notifications' },
                { icon: <VerifiedUser sx={{ color: '#facc15' }} />, label: 'Board-Certified Doctors & Specialists' },
              ].map((f) => (
                <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {f.icon}
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>{f.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Trusted by thousands of patients and top clinics.
            </Typography>
          </Box>
        </Box>

        {/* ── Right Form ── */}
        <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Mobile brand */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 3 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#0284c7,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MedicalServices sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>DocApp.</Typography>
          </Box>

          {forgotPassword ? (
            /* ── Forgot Password ── */
            <form onSubmit={handleResetPassword}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Reset Your Password</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email and we'll send a recovery link.
              </Typography>

              {resetSent ? (
                <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
                  Reset link sent! Check your inbox.
                </Alert>
              ) : (
                <>
                  <TextField fullWidth label="Email Address" type="email" value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)} required sx={{ mb: 2 }}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: '#94a3b8' }} /></InputAdornment> } }} />
                  {displayError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{displayError}</Alert>}
                  <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mb: 1.5 }}>
                    {loading ? <CircularProgress size={18} color="inherit" /> : 'Send Reset Link'}
                  </Button>
                </>
              )}
              <Button fullWidth variant="text" onClick={() => { setForgotPassword(false); setResetSent(false); }}>
                Back to Sign In
              </Button>
            </form>
          ) : (
            /* ── Sign In ── */
            <form onSubmit={handleSubmit} autoComplete="off">
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em" sx={{ mb: 0.5 }}>Welcome back</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sign in to your DocApp portal</Typography>

              <TextField fullWidth name="account-email" autoComplete="off" label="Email address" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: '#94a3b8' }} /></InputAdornment> } }} />

              <TextField fullWidth name="account-password" autoComplete="off" label="Password" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 1.5 }}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#94a3b8' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }} />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}>
                <Link component="button" type="button" variant="body2"
                  onClick={() => setForgotPassword(true)}
                  sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </Box>

              {displayError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{displayError}</Alert>
              )}

              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                sx={{ py: 1.3, fontSize: '0.95rem' }}>
                Sign In
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link component="button" type="button" variant="body2"
                    onClick={() => navigate('/register')}
                    sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>
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

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-email': 'Please enter a valid email address.',
  };
  return map[code] || code || 'An error occurred. Please try again.';
}
