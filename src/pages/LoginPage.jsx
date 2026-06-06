import { useEffect } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginThunk } from '../features/auth/authSlice';
import api from '../api/client';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    if (user?.role === 'principal') navigate('/principal');
    if (user?.role === 'teacher') navigate('/teacher');
  }, [user, navigate]);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const { data } = await api.get('/setup/status');
        if (!data.initialized) {
          navigate('/setup');
        }
      } catch (checkError) {
        // If setup endpoint is unavailable, keep login usable for existing deployments.
      }
    };

    checkSetup();
  }, [navigate]);

  const onSubmit = (event) => {
    event.preventDefault();
    dispatch(loginThunk(form));
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
      <Card sx={{ width: '100%', borderRadius: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={700}>
              School Fee Management
            </Typography>
            <Typography variant="body2">Login as Principal or Teacher</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  value={form.username}
                  onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                />
                <TextField
                  type="password"
                  label="Password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                />
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default LoginPage;
