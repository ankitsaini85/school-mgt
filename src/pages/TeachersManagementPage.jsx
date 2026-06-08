import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../api/client';
import './teachers.css';

const initialForm = { name: '', email: '', username: '', password: '', assignedClasses: [] };

function TeachersManagementPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const load = async () => {
    const [teachersRes, classesRes] = await Promise.all([api.get('/teachers'), api.get('/classes')]);
    setTeachers(teachersRes.data);
    setClasses(classesRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    try {
      if (editing) {
        await api.put(`/teachers/${editing._id}`, form);
      } else {
        await api.post('/teachers', form);
      }
      toast.success('Teacher saved');
      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setError('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save teacher');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    await api.delete(`/teachers/${id}`);
    toast.success('Teacher deleted');
    load();
  };

  return (
    <Stack spacing={2} className="teachers-page">
      <Stack direction="row" justifyContent="space-between" alignItems="center" className="section-header">
        <Typography variant="h5" fontWeight={700} className="section-title">
          Teachers Management
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setOpen(true);
            setEditing(null);
            setForm(initialForm);
          }}
          className="add-btn"
        >
          Add Teacher
        </Button>
      </Stack>
      <Paper sx={{ p: 1 }} className="teachers-paper">
        {isSmall ? (
          <Grid container spacing={2}>
            {teachers.map((t) => (
              <Grid item xs={12} key={t._id}>
                <Card className="teacher-card">
                  <CardContent>
                    <Typography variant="h6">{t.name}</Typography>
                    <Typography variant="body2">{t.email}</Typography>
                    <Typography variant="caption">{t.username}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {(t.assignedClasses || []).map((c) => c.name).join(', ')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => { setEditing(t); setForm({ name: t.name, email: t.email, username: t.username, password: '', assignedClasses: (t.assignedClasses || []).map((c) => c._id) }); setOpen(true); }}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => onDelete(t._id)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Table className="teachers-table">
            <TableHead>
              <TableRow>
                <TableCell className="tbl-head">Name</TableCell>
                <TableCell className="tbl-head">Email</TableCell>
                <TableCell className="tbl-head">Username</TableCell>
                <TableCell className="tbl-head">Assigned Classes</TableCell>
                <TableCell className="tbl-head">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="teacher-name">{t.name}</TableCell>
                  <TableCell className="teacher-email">{t.email}</TableCell>
                  <TableCell className="teacher-username">{t.username}</TableCell>
                  <TableCell className="teacher-classes">{(t.assignedClasses || []).map((c) => c.name).join(', ')}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} className="action-stack">
                      <Button
                        size="small"
                        onClick={() => {
                          setEditing(t);
                          setForm({
                            name: t.name,
                            email: t.email,
                            username: t.username,
                            password: '',
                            assignedClasses: (t.assignedClasses || []).map((c) => c._id),
                          });
                          setOpen(true);
                        }}
                        className="outline-btn"
                      >
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => onDelete(t._id)} className="delete-btn">
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            <TextField label="Username" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              helperText={editing ? 'Leave empty to keep old password' : ''}
            />
            <TextField
              select
              label="Assigned Classes"
              SelectProps={{
                multiple: true,
                value: form.assignedClasses,
                onChange: (e) => setForm((s) => ({ ...s, assignedClasses: e.target.value })),
              }}
            >
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default TeachersManagementPage;
