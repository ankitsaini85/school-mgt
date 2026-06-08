import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

function SetupWizardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    principalName: 'Principal Admin',
    principalEmail: 'principal@school.com',
    principalUsername: 'principal',
    principalPassword: 'principal123',
    confirmPassword: 'principal123',
    includeDemoData: true,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await api.get('/setup/status', {
          params: { _: Date.now() },
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        if (data.initialized) {
          navigate('/login', { replace: true });
        }
      } catch (checkError) {
        setError('Unable to check setup status. Verify backend is running.');
      }
    };

    checkStatus();
  }, [navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.principalPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/setup/bootstrap', {
        principalName: form.principalName,
        principalEmail: form.principalEmail,
        principalUsername: form.principalUsername,
        principalPassword: form.principalPassword,
        includeDemoData: form.includeDemoData,
      });

      toast.success('Setup completed. You can login now.');
      navigate('/login', { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
      <Card sx={{ width: '100%', borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              First-Time Setup Wizard
            </Typography>
            <Typography variant="body2">
              Create principal account and optionally load demo classes, teachers, students and fee records.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Principal Full Name"
                  value={form.principalName}
                  onChange={(e) => setForm((s) => ({ ...s, principalName: e.target.value }))}
                />
                <TextField
                  label="Principal Email"
                  value={form.principalEmail}
                  onChange={(e) => setForm((s) => ({ ...s, principalEmail: e.target.value }))}
                />
                <TextField
                  label="Principal Username"
                  value={form.principalUsername}
                  onChange={(e) => setForm((s) => ({ ...s, principalUsername: e.target.value }))}
                />
                <TextField
                  type="password"
                  label="Principal Password"
                  value={form.principalPassword}
                  onChange={(e) => setForm((s) => ({ ...s, principalPassword: e.target.value }))}
                />
                <TextField
                  type="password"
                  label="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.includeDemoData}
                      onChange={(e) => setForm((s) => ({ ...s, includeDemoData: e.target.checked }))}
                    />
                  }
                  label="Load demo classes/teachers/students"
                />
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default SetupWizardPage;
