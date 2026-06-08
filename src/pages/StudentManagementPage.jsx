import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
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
  Grid,
} from '@mui/material';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../api/client';

function StudentManagementPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualBatch, setManualBatch] = useState([]);
  const [manualCaste, setManualCaste] = useState('GENERAL');
  const [manualRegistration, setManualRegistration] = useState('registered');
  const [students, setStudents] = useState([]);
  const [preview, setPreview] = useState([]);

  const loadClasses = async () => {
    const { data } = await api.get('/classes');
    setClasses(data);
    if (!selectedClass && data[0]?._id) setSelectedClass(data[0]._id);
  };

  const loadStudents = async (classId) => {
    if (!classId) return;
    const { data } = await api.get('/students', { params: { classId } });
    setStudents(data);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents(selectedClass);
  }, [selectedClass]);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const addToBatch = () => {
    if (!manualName.trim()) return;
    setManualBatch((arr) => [...arr, { name: manualName.trim(), caste: manualCaste, registrationStatus: manualRegistration }]);
    setManualName('');
  };

  const addStudentImmediate = async () => {
    if (!manualName.trim() || !selectedClass) return;
    try {
      await api.post('/students', { name: manualName.trim(), classId: selectedClass, caste: manualCaste, registrationStatus: manualRegistration });
      toast.success('Student added');
      setManualName('');
      loadStudents(selectedClass);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add student');
    }
  };

  const saveBatch = async () => {
    if (!selectedClass || !manualBatch.length) return;
    // normalize payload to names or objects accepted by backend (we expect name objects with caste/status)
    const payloadStudents = manualBatch.map((s) => (typeof s === 'string' ? s : { name: s.name, caste: s.caste, registrationStatus: s.registrationStatus }));
    await api.post('/students/bulk', { classId: selectedClass, students: payloadStudents });
    toast.success('Students added');
    setManualBatch([]);
    loadStudents(selectedClass);
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const onFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClass) return;

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const names = rows
      .flat()
      .map((v) => (v || '').toString().trim())
      .filter((v) => v && v.toLowerCase() !== 'student name');

    setPreview(names);

    await api.post('/students/import', {
      classId: selectedClass,
      fileData: arrayBufferToBase64(buffer),
    });
    toast.success('Imported students from Excel/CSV');
    loadStudents(selectedClass);
  };

  const onEdit = async (student) => {
    const nextName = window.prompt('Edit student name', student.name);
    if (!nextName || nextName === student.name) return;
    await api.put(`/students/${student._id}`, { name: nextName });
    toast.success('Student updated');
    loadStudents(selectedClass);
  };

  const onDelete = async (studentId) => {
    if (!window.confirm('Delete this student?')) return;
    await api.delete(`/students/${studentId}`);
    toast.success('Student deleted');
    loadStudents(selectedClass);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Student Management
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
          <TextField select fullWidth label="Select Class" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Student Name" value={manualName} onChange={(e) => setManualName(e.target.value)} />
          <TextField select label="Caste" value={manualCaste} onChange={(e) => setManualCaste(e.target.value)} sx={{ width: 160 }}>
            <MenuItem value="GENERAL">General</MenuItem>
            <MenuItem value="OBC">OBC</MenuItem>
            <MenuItem value="SC">SC</MenuItem>
          </TextField>
          <TextField select label="Registration" value={manualRegistration} onChange={(e) => setManualRegistration(e.target.value)} sx={{ width: 180 }}>
            <MenuItem value="registered">Registered</MenuItem>
            <MenuItem value="new">New Registration</MenuItem>
          </TextField>
          <Button variant="contained" onClick={addStudentImmediate}>
            Add Student
          </Button>
          <Button variant="outlined" onClick={saveBatch}>
            Save All Students
          </Button>
        </Stack>
        {manualBatch.length > 0 && (
          <Typography sx={{ mt: 1 }} variant="body2">
            Pending: {manualBatch.map((b) => (typeof b === 'string' ? b : b.name)).join(', ')}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button component="label" variant="contained">
            Upload Excel/CSV
            <input hidden type="file" accept=".xlsx,.csv" onChange={onFileUpload} />
          </Button>
          <Typography variant="body2">Preview: {preview.slice(0, 6).join(', ')}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }}>
        {isSmall ? (
          <Grid container spacing={2}>
            {students.map((student) => (
              <Grid item xs={12} key={student._id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">{student.name}</Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => onEdit(student)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => onDelete(student._id)}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Caste</TableCell>
                <TableCell>Registration</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.caste || 'GENERAL'}</TableCell>
                  <TableCell>{student.registrationStatus || 'registered'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => onEdit(student)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" onClick={() => onDelete(student._id)}>
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
    </Stack>
  );
}

export default StudentManagementPage;
