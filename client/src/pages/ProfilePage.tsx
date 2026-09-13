import { useState, FormEvent } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import { profileApi } from '../api/profile.api';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { teacher, setTeacher } = useAuth();

  const [name, setName] = useState(teacher?.name ?? '');
  const [dept, setDept] = useState(teacher?.dept ?? '');
  const [photoUrl, setPhotoUrl] = useState(teacher?.photoUrl ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [toast, setToast] = useState('');

  const initials = (teacher?.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const updated = await profileApi.update({ name, dept: dept || null, photoUrl: photoUrl || null });
      setTeacher(updated);
      setToast('Profile updated.');
    } catch (err) {
      setProfileError(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const updated = await profileApi.changePassword({
        currentPassword: teacher?.hasPassword ? currentPassword : undefined,
        newPassword,
      });
      setTeacher(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setToast('Password updated.');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Failed to update password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Profile
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Profile details */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar src={teacher?.photoUrl || undefined} sx={{ width: 64, height: 64, bgcolor: 'secondary.main', fontSize: 22 }}>
                {initials}
              </Avatar>
              <Box>
                <Typography variant="h6">{teacher?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {teacher?.email}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {teacher?.hasPassword && <Chip size="small" icon={<LockIcon />} label="Password" />}
                  {teacher?.hasGoogle && <Chip size="small" icon={<GoogleIcon />} label="Google" />}
                  {teacher?.emailVerified && <Chip size="small" color="success" label="Verified" variant="outlined" />}
                </Stack>
              </Box>
            </Stack>

            {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
            <form onSubmit={handleProfileSave}>
              <Stack spacing={2}>
                <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
                <TextField label="Department" value={dept} onChange={(e) => setDept(e.target.value)} fullWidth />
                <TextField label="Photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} fullWidth />
                <Box>
                  <Button type="submit" variant="contained" disabled={savingProfile}>
                    {savingProfile ? <CircularProgress size={22} /> : 'Save changes'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {teacher?.hasPassword ? 'Change password' : 'Set a password'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {teacher?.hasPassword
                ? 'Enter your current password and a new one.'
                : 'You log in via OTP/Google. Set a password to also log in with email + password.'}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            <form onSubmit={handlePasswordSave}>
              <Stack spacing={2}>
                {teacher?.hasPassword && (
                  <TextField
                    label="Current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    fullWidth
                  />
                )}
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  helperText="At least 6 characters"
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  fullWidth
                />
                <Box>
                  <Button type="submit" variant="contained" disabled={savingPassword}>
                    {savingPassword ? <CircularProgress size={22} /> : 'Update password'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
};

export default ProfilePage;
