import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../api/client';
import './principal.css';

const deriveTotalFee = (feeSetup) => {
  const storedTotal = Number(feeSetup?.totalFee || 0);
  if (storedTotal > 0) return storedTotal;

  const allocations = Array.isArray(feeSetup?.fundAllocations) ? feeSetup.fundAllocations : [];
  return Number(
    allocations.reduce((sum, allocation) => sum + Number(allocation?.amount || 0), 0).toFixed(2)
  );
};

const StatCard = ({ label, value }) => (
  <Paper className="stat-card" sx={{ p: 3, borderRadius: 3 }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography variant="h4" fontWeight={700}>
      {value}
    </Typography>
  </Paper>
);

const normalizeFundCasteMap = (fundCasteMap) => {
  if (!fundCasteMap) return {};
  if (fundCasteMap instanceof Map) {
    return Object.fromEntries(fundCasteMap.entries());
  }

  return fundCasteMap;
};

function PrincipalDashboardPage() {
  const fundNames = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], []);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalFeeRecords: 0,
  });
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeClass, setActiveClass] = useState(null);
  const [form, setForm] = useState({ totalFee: '', fundPercentages: Array(8).fill('') });
  const [openCaste, setOpenCaste] = useState(false);
  const [casteForm, setCasteForm] = useState({ SC: [], OBC: [], GENERAL: [] });

  const previewAllocations = useMemo(() => {
    const totalFee = Number(form.totalFee || deriveTotalFee(activeClass?.feeSetup) || 0);
    const canCalculate = totalFee > 0;
    const firstEightPercentages = form.fundPercentages.slice(0, 8).map((value) => Number(value || 0));
    const firstEight = fundNames.map((fundName, index) => {
      const percentage = firstEightPercentages[index];
      const amount = canCalculate ? Number(((totalFee * percentage) / 100).toFixed(2)) : null;
      return { fundName, percentage, amount };
    });

    const firstEightTotal = canCalculate
      ? firstEight.reduce((sum, allocation) => sum + Number(allocation.amount || 0), 0)
      : 0;
    const derivedOthersAmount = canCalculate ? Number(Math.max(totalFee - firstEightTotal, 0).toFixed(2)) : null;
    const derivedOthersPercentage = canCalculate ? Number(((derivedOthersAmount / totalFee) * 100).toFixed(2)) : 0;

    return [...firstEight, { fundName: 'Others', percentage: derivedOthersPercentage, amount: derivedOthersAmount }];
  }, [form.fundPercentages, form.totalFee, fundNames]);

  useEffect(() => {
    const load = async () => {
      const [dashboardRes, classRes] = await Promise.all([api.get('/reports/dashboard'), api.get('/classes')]);
      setStats(dashboardRes.data);
      setClasses(classRes.data);
    };

    load();
  }, []);

  const openSetup = (classItem) => {
    setActiveClass(classItem);
    setForm({
      totalFee: deriveTotalFee(classItem.feeSetup) || '',
      fundPercentages: fundNames.map((_, index) => classItem.feeSetup?.fundAllocations?.[index]?.percentage ?? ''),
    });
    setOpen(true);
  };

  const openCasteConfig = (classItem) => {
    setActiveClass(classItem);
    const existing = normalizeFundCasteMap(classItem.fundCasteMap);
    setCasteForm({
      SC: existing.SC || [],
      OBC: existing.OBC || [],
      GENERAL: existing.GENERAL || [],
    });
    setOpenCaste(true);
  };

  const saveCasteConfig = async () => {
    if (!activeClass) return;
    const payload = { fundCasteMap: casteForm };
    const { data } = await api.put(`/classes/${activeClass._id}/fund-caste-map`, payload);
    toast.success(`Saved caste fund mapping for ${data.name}`);
    setOpenCaste(false);
    setActiveClass(null);
    const classRes = await api.get('/classes');
    setClasses(classRes.data);
  };

  const saveFeeSetup = async () => {
    if (!activeClass) return;

    const resolvedTotalFee = Number(form.totalFee || deriveTotalFee(activeClass.feeSetup) || 0);

    const payload = {
      totalFee: resolvedTotalFee,
      fundPercentages: form.fundPercentages.map((value) => Number(value || 0)),
    };

    const { data } = await api.put(`/classes/${activeClass._id}/fee-setup`, payload);
    toast.success(`Fee setup saved for ${data.name}`);
    setOpen(false);
    setActiveClass(null);
    const classRes = await api.get('/classes');
    setClasses(classRes.data);
  };

  return (
    <Stack spacing={2} className="principal-dashboard">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard label="Total Teachers" value={stats.totalTeachers} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard label="Total Classes" value={stats.totalClasses} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard label="Total Students" value={stats.totalStudents} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard label="Total Fee Records" value={stats.totalFeeRecords} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 3 }} className="class-fee-paper">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
            <div className="section-header">
              <Typography variant="h6" fontWeight={700} className="section-title">
                Class Fee Setup
              </Typography>
              <Typography variant="body2" color="text.secondary" className="section-subtitle">
                Set total fees and the 8 fund percentages for each class.
              </Typography>
            </div>
          </Stack>

          <div className="table-container">
            <Table size="small" className="class-fee-table">
              <TableHead>
                <TableRow>
                  <TableCell className="tbl-head">Class</TableCell>
                  <TableCell className="tbl-head">Teacher</TableCell>
                  <TableCell className="tbl-head">Total Fee</TableCell>
                  <TableCell className="tbl-head">Funds</TableCell>
                  <TableCell className="tbl-head" />
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((item) => (
                  <TableRow key={item._id}>
                      <TableCell className="class-name">{item.name}</TableCell>
                      <TableCell className="teacher-name">{item.teacherId?.name || 'Unassigned'}</TableCell>
                      <TableCell className="total-fee">{deriveTotalFee(item.feeSetup) || '-'}</TableCell>
                      <TableCell className="funds-cell">
                      {item.feeSetup?.fundAllocations?.length ? (
                        <div className="fund-list">
                          {item.feeSetup.fundAllocations.map((fund, idx) => (
                            <span key={fund.fundName + idx} className="fund-chip">
                              <span className="fund-dot" aria-hidden />
                              <span className="fund-name">{fund.fundName}</span>
                              <span className="fund-percent">{fund.percentage}%</span>
                              <span className="fund-eq">=</span>
                              <span className="fund-amount">{fund.amount}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Not set'
                      )}
                    </TableCell>
                    <TableCell align="right" className="actions-cell">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button variant="outlined" onClick={() => openSetup(item)} className="outline-btn">
                          Setup Fee
                        </Button>
                        <Button variant="outlined" onClick={() => openCasteConfig(item)} className="outline-btn">
                          Configure Caste Funds
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Stack>
      </Paper>

      <Dialog open={openCaste} onClose={() => setOpenCaste(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure fund applicability by caste for {activeClass?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Select which funds should apply to students of each caste. Unselected funds will be hidden for that caste and their amounts deducted from per-student totals.
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fund</TableCell>
                <TableCell>General</TableCell>
                <TableCell>OBC</TableCell>
                <TableCell>SC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...fundNames, 'Others'].map((fund) => (
                <TableRow key={fund}>
                  <TableCell>{fund}</TableCell>
                  {['GENERAL', 'OBC', 'SC'].map((caste) => (
                    <TableCell key={caste} align="center">
                      <input
                        type="checkbox"
                        checked={(casteForm[caste] || []).includes(fund)}
                        onChange={(e) => {
                          setCasteForm((prev) => {
                            const list = new Set(prev[caste] || []);
                            if (e.target.checked) list.add(fund); else list.delete(fund);
                            return { ...prev, [caste]: Array.from(list) };
                          });
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCaste(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCasteConfig} disabled={!activeClass}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Setup fee for {activeClass?.name}</DialogTitle>p
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Total Fee"
              type="number"
              value={form.totalFee}
              onChange={(e) => setForm((s) => ({ ...s, totalFee: e.target.value }))}
              fullWidth
            />
            <Alert severity="info">Enter the percentage for each fund. Amounts are calculated automatically.</Alert>
            <Grid container spacing={2}>
              {fundNames.map((fundName, index) => (
                <Grid key={fundName} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label={`Fund ${fundName} %`}
                    type="number"
                    value={form.fundPercentages[index]}
                    onChange={(e) =>
                      setForm((s) => {
                        const next = [...s.fundPercentages];
                        next[index] = e.target.value;
                        return { ...s, fundPercentages: next };
                      })
                    }
                    fullWidth
                  />
                </Grid>
              ))}
            </Grid>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Calculated Amount Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Set a total fee above to calculate fund amounts.
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fund</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewAllocations.map((fund) => (
                    <TableRow key={fund.fundName}>
                      <TableCell>{fund.fundName}</TableCell>
                      <TableCell>{fund.percentage}%</TableCell>
                      <TableCell>{fund.amount ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveFeeSetup} disabled={!activeClass}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default PrincipalDashboardPage;
