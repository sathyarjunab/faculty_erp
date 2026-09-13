import { useState, FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  Link,
  Stack,
  CircularProgress,
} from '@mui/material';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { authApi } from '../api/auth.api';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // otp
  const [otpEmail, setOtpEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');

  const reset = () => {
    setError('');
    setInfo('');
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await authApi.requestOtp(otpEmail);
      setOtpSent(true);
      setInfo(res.devCode ? `Dev mode: your code is ${res.devCode}` : 'A login code has been sent to your email.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const result = await authApi.verifyOtp(otpEmail, code);
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (resp: CredentialResponse) => {
    reset();
    if (!resp.credential) {
      setError('Google did not return a credential.');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.google(resp.credential);
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Google login failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <Tabs value={tab} onChange={(_, v) => { setTab(v); reset(); }} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="Password" />
        <Tab label="Email OTP" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

      {tab === 0 && (
        <form onSubmit={handlePasswordLogin}>
          <Stack spacing={2}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Log in'}
            </Button>
          </Stack>
        </form>
      )}

      {tab === 1 && (
        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              required
              fullWidth
              disabled={otpSent}
            />
            {otpSent && (
              <TextField label="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required fullWidth />
            )}
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : otpSent ? 'Verify & log in' : 'Send code'}
            </Button>
            {otpSent && (
              <Button variant="text" size="small" onClick={() => { setOtpSent(false); setCode(''); reset(); }}>
                Use a different email
              </Button>
            )}
          </Stack>
        </form>
      )}

      {googleClientId && (
        <>
          <Divider sx={{ my: 2 }}>or</Divider>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google login failed.')} />
          </Box>
        </>
      )}

      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        New here?{' '}
        <Link component={RouterLink} to="/signup">
          Create an account
        </Link>
      </Typography>
    </AuthShell>
  );
};

export default LoginPage;
