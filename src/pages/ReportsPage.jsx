import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
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
import api from '../api/client';
import { MONTHS } from '../utils/months';
import './reports.css';

const normalizeFundCasteMap = (fundCasteMap) => {
  if (!fundCasteMap) return {};
  if (fundCasteMap instanceof Map) return Object.fromEntries(fundCasteMap.entries());
  return fundCasteMap;
};

const sumAllocations = (allocations) =>
  Number(
    (allocations || []).reduce((sum, allocation) => sum + Number(allocation?.amount || 0), 0).toFixed(2)
  );

function ReportsPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({ totalStudents: 0, cashPaid: 0, onlinePaid: 0, pending: 0, paidTotal: 0 });
  const [rows, setRows] = useState([]);
  const [fundNames, setFundNames] = useState([]);
  const [fundTotals, setFundTotals] = useState({});
  const [filters, setFilters] = useState({ teacherId: '', classId: '', month: '', year: new Date().getFullYear() });
 

  useEffect(() => {
    Promise.all([api.get('/teachers').catch(() => ({ data: [] })), api.get('/classes')]).then(([teacherRes, classRes]) => {
      setTeachers(teacherRes.data || []);
      setClasses(classRes.data || []);
    });
  }, []);

  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const paidRows = rows.filter((row) => ['cash', 'online'].includes(row.paymentMethod));
  const renewalTotal = rows.reduce((sum, row) => sum + Number(row.renewalCharge || 0), 0);
  const fundCards = Object.entries(fundTotals).map(([name, value]) => ({ name, value }));

  

  const search = async () => {
    const { data } = await api.get('/reports', { params: filters });
    const fetchedRows = data.rows || [];
    const enhancedRows = (fetchedRows || []).map((r) => {
      if (r.teacherName) return r;
      const classObj = classes.find((c) => String(c._id) === String(r.classId)) || {};
      let teacherName = '';
      if (classObj.teacherId) {
        const t = teachers.find((tt) => String(tt._id) === String(classObj.teacherId));
        teacherName = t ? t.name : '';
      }
      return { ...r, teacherName };
    });
    setRows(enhancedRows);
    setFundNames(data.fundNames || []);
    // keep backend summary but we'll override paidTotal to match displayed paid students
    const backendSummary = data.summary || { totalStudents: 0, cashPaid: 0, onlinePaid: 0, pending: 0, paidTotal: 0 };

    // consider only paid rows when computing totals
    const paidRows = (enhancedRows || []).filter((r) => ['cash', 'online'].includes(r.paymentMethod));

    // compute displayed paid total (sum of per-student displayed totals)
    const computedPaidTotal = paidRows.reduce((s, row) => s + Number(computeStudentTotal(row) || 0), 0);

    const selectedClass = classes.find((c) => c._id === filters.classId) || {};
    const classFeeAllocations = selectedClass?.feeSetup?.fundAllocations || [];
    const classFundCasteMap = normalizeFundCasteMap(selectedClass?.fundCasteMap);

    const getAppliedFundBreakdown = (row) => {
      const caste = row.caste || 'GENERAL';
      const allowed = Array.isArray(classFundCasteMap[caste]) ? classFundCasteMap[caste] : classFeeAllocations.map((f) => f.fundName);
      const allowedSet = new Set(allowed);

      return classFeeAllocations.reduce((accumulator, fund) => {
        accumulator[fund.fundName] = allowedSet.has(fund.fundName) ? Number(fund.amount || 0) : 0;
        return accumulator;
      }, {});
    };

    // compute per-fund totals from paid rows
    const totals = {};
    if (Array.isArray(paidRows) && paidRows.length) {
      paidRows.forEach((row) => {
        const breakdown = getAppliedFundBreakdown(row);
        Object.entries(breakdown).forEach(([fundName, amount]) => {
          totals[fundName] = (totals[fundName] || 0) + Number(amount || 0);
        });
      });
    }

    setSummary({ ...backendSummary, paidTotal: computedPaidTotal });
    setFundTotals(totals);
  };

  const computeStudentTotal = (row) => {
    // Always compute applied total from class fee allocations and caste mapping
    const selectedClass = classes.find((c) => c._id === filters.classId) || {};
    const classFeeAllocations = selectedClass?.feeSetup?.fundAllocations || [];
    const classFundCasteMap = normalizeFundCasteMap(selectedClass?.fundCasteMap);
    const caste = row.caste || 'GENERAL';
    const allowed = Array.isArray(classFundCasteMap[caste]) ? classFundCasteMap[caste] : classFeeAllocations.map((f) => f.fundName);
    const allowedSet = new Set(allowed);
    const applied = classFeeAllocations.filter((f) => allowedSet.has(f.fundName));
    const base = Number(row.baseFee ?? sumAllocations(applied));
    return base + Number(row.fineAmount || 0) + Number(row.renewalCharge || 0);
  };
  const download = async (format) => {
    const resp = await api.get('/reports', {
      params: { ...filters, format },
      responseType: 'blob',
    });
    const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const disposition = resp.headers['content-disposition'] || '';
    const match = /filename="?(.*?)"?$/.exec(disposition);
    const filename = match ? match[1] : `reports.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={2} className="reports-page">
      <Typography variant="h5" fontWeight={700}>
        Reports
      </Typography>
      <Paper sx={{ p: 2 }} className="filters-paper">
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
          <TextField select fullWidth label="Class" value={filters.classId} onChange={(e) => setFilters((s) => ({ ...s, classId: e.target.value }))}>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Month" value={filters.month} onChange={(e) => setFilters((s) => ({ ...s, month: e.target.value }))}>
            {MONTHS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Year" type="number" fullWidth value={filters.year} onChange={(e) => setFilters((s) => ({ ...s, year: e.target.value }))} />
          <Button variant="contained" onClick={() => { setFilters((s) => ({ ...s })); search(); }}>
            Search
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }} className="summary-paper">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={2.4}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }} className="summary-card">
              <CardContent>
                <Typography variant="caption" color="text.secondary" className="card-label">
                  Total Students
                </Typography>
                <Typography variant="h5" fontWeight={700} className="card-value">
                  {summary.totalStudents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Cash Paid
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {summary.cashPaid}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Online Paid
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {summary.onlinePaid}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {summary.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Paid Total
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {summary.paidTotal ?? paidRows.reduce((sum, row) => sum + computeStudentTotal(row), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }} className="summary-card">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Fund Breakdown
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" className="fund-stack">
                  {fundCards.length > 0 ? (
                    fundCards.map((fund) => (
                      <Chip key={fund.name} label={`${fund.name}: ${fund.value}`} variant="outlined" className="fund-chip" />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No fund data available
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Renewal Summary
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {renewalTotal}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Renewal charges collected in the selected month.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => download('excel')}>
            Export Excel
          </Button>
          <Button variant="outlined" onClick={() => download('pdf')}>
            Export PDF
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }} className="rows-paper">
        {isSmall ? (
          <Grid container spacing={2}>
            {rows.map((row, idx) => (
              <Grid item xs={12} key={`${row.studentName}-${idx}`}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1">{row.studentName}</Typography>
                    <Typography variant="body2">{row.className} • {row.teacherName}</Typography>
                    <Typography variant="body2">Status: {row.feeStatus || row.paymentMethod}</Typography>
                    <Typography variant="body2">Fine: {Number(row.fineAmount || 0)} • Renewal: {Number(row.renewalCharge || 0)} • Total: {computeStudentTotal(row)}</Typography>
                    <Typography variant="caption">{row.month} {row.year} — {row.paymentMethod}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Table className="reports-table">
            <TableHead>
              <TableRow>
                <TableCell className="tbl-head">Student</TableCell>
                <TableCell className="tbl-head">Class</TableCell>
                <TableCell className="tbl-head">Teacher</TableCell>
                <TableCell className="tbl-head">Month</TableCell>
                <TableCell className="tbl-head">Year</TableCell>
                <TableCell className="tbl-head">Payment</TableCell>
                <TableCell className="tbl-head">Status</TableCell>
                <TableCell className="tbl-head">Fine</TableCell>
                <TableCell className="tbl-head">Renewal</TableCell>
                <TableCell className="tbl-head">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={`${row.studentName}-${idx}`}>
                  <TableCell className="student-name">{row.studentName}</TableCell>
                  <TableCell className="class-name">{row.className}</TableCell>
                  <TableCell className="teacher-name">{row.teacherName}</TableCell>
                  <TableCell className="month">{row.month}</TableCell>
                  <TableCell className="year">{row.year}</TableCell>
                  <TableCell className="payment">{row.paymentMethod}</TableCell>
                  <TableCell className="status">{row.feeStatus ?? row.paymentMethod ?? '-'}</TableCell>
                  <TableCell className="fine">{Number(row.fineAmount || 0)}</TableCell>
                  <TableCell className="renewal">{Number(row.renewalCharge || 0)}</TableCell>
                  <TableCell className="total">{computeStudentTotal(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}

export default ReportsPage;
