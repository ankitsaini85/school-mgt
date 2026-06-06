import { useEffect, useState } from 'react';
import { Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import api from '../api/client';
import './classes.css';

function ClassesManagementPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const load = async () => {
    const [classRes, teacherRes] = await Promise.all([api.get('/classes'), api.get('/teachers')]);
    setClasses(classRes.data);
    setTeachers(teacherRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createClass = async () => {
    await api.post('/classes', { name, teacherId: teacherId || undefined });
    setName('');
    setTeacherId('');
    toast.success('Class created');
    load();
  };

  return (
    <Stack spacing={2} className="classes-page">
      <div className="section-header">
        <Typography variant="h5" fontWeight={700} className="section-title">
          Classes Management
        </Typography>
        <Button variant="contained" className="add-btn" onClick={() => {}} sx={{ display: 'none' }}>
          Add Class
        </Button>
      </div>
      <Paper className="create-paper" sx={{ p: 2 }}>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
          <TextField fullWidth label="Class Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField select fullWidth label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <MenuItem value="">Unassigned</MenuItem>
            {teachers.map((t) => (
              <MenuItem key={t._id} value={t._id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={createClass} className="add-btn">
            Add Class
          </Button>
        </Stack>
      </Paper>
      <Paper className="list-paper">
        <Table className="classes-table">
          <TableHead>
            <TableRow>
              <TableCell className="tbl-head">Class</TableCell>
              <TableCell className="tbl-head">Teacher</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((item) => (
              <TableRow key={item._id} className="class-row" data-status={item.teacherId?.name ? 'assigned' : 'unassigned'}>
                <TableCell className="class-name">{item.name}</TableCell>
                <TableCell className="class-teacher">{item.teacherId?.name || 'Unassigned'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

export default ClassesManagementPage;
