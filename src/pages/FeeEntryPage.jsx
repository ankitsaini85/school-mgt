import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../api/client';
import { MONTHS } from '../utils/months';

const FEE_MONTHS = ['April', 'October'];

const getDefaultFeeMonth = () => {
  const currentMonth = MONTHS[new Date().getMonth()];
  return FEE_MONTHS.includes(currentMonth) ? currentMonth : 'April';
};

const normalizeFundCasteMap = (fundCasteMap) => {
  if (!fundCasteMap) return {};
  if (fundCasteMap instanceof Map) return Object.fromEntries(fundCasteMap.entries());
  return fundCasteMap;
};

const sumAllocations = (allocations) =>
  Number((allocations || []).reduce((sum, allocation) => sum + Number(allocation?.amount || 0), 0).toFixed(2));

function FeeEntryPage() {
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ classId: '', month: getDefaultFeeMonth(), year: new Date().getFullYear(), search: '' });
  const [rows, setRows] = useState([]);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    api.get('/classes').then((res) => {
      setClasses(res.data);
      if (res.data[0]?._id) setFilters((s) => ({ ...s, classId: res.data[0]._id }));
    });
  }, []);

  const selectedClass = classes.find((c) => c._id === filters.classId);
  const classTotalFee = selectedClass?.feeSetup?.totalFee ?? null;
  const feeAllocations = selectedClass?.feeSetup?.fundAllocations ?? [];
  const classFundCasteMap = normalizeFundCasteMap(selectedClass?.fundCasteMap);
  const isAllowedMonth = FEE_MONTHS.includes(filters.month);

  const getAppliedAllocations = (row) => {
    const caste = row.caste || 'GENERAL';
    const allowed = Array.isArray(classFundCasteMap[caste]) ? classFundCasteMap[caste] : feeAllocations.map((fund) => fund.fundName);
    const allowedSet = new Set(allowed);
    return feeAllocations.filter((fund) => allowedSet.has(fund.fundName));
  };

  const getAppliedFunds = (row) => {
    const caste = row.caste || 'GENERAL';
    const allowed = Array.isArray(classFundCasteMap[caste]) ? classFundCasteMap[caste] : feeAllocations.map((fund) => fund.fundName);
    const allowedSet = new Set(allowed);

    return feeAllocations.reduce((accumulator, fund) => {
      accumulator[fund.fundName] = allowedSet.has(fund.fundName) ? Number(fund.amount || 0) : 0;
      return accumulator;
    }, {});
  };

  const getDisplayedTotalFee = (row) => {
    const appliedAllocations = getAppliedAllocations(row);
    const base = appliedAllocations.length ? sumAllocations(appliedAllocations) : 0;
    return Number((base + Number(row.fineAmount || 0) + Number(row.renewalCharge || 0)).toFixed(2));
  };

  const loadFees = async () => {
    if (!filters.classId) return;
    if (!isAllowedMonth) {
      setRows([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/fees', {
        params: { ...filters, page: page + 1, limit: rowsPerPage },
      });
      setRows(data.rows);
      setTotal(data.total);
      setChanges({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [page, rowsPerPage, filters.classId, filters.month, filters.year]);

  const composedRows = useMemo(
    () => rows.map((r) => ({ ...r, currentPayment: changes[r.studentId] ?? r.paymentMethod })),
    [rows, changes]
  );

  const setPayment = (studentId, method) => {
    const base = rows.find((r) => r.studentId === studentId)?.paymentMethod;
    const next = method;
    setChanges((prev) => {
      if (base === next) {
        const cloned = { ...prev };
        delete cloned[studentId];
        return cloned;
      }
      return { ...prev, [studentId]: next };
    });
  };

  const onSelectAll = (method, checked) => {
    const draft = { ...changes };
    rows.forEach((row) => {
      const next = checked ? method : 'unpaid';
      if (row.paymentMethod === next) {
        delete draft[row.studentId];
      } else {
        draft[row.studentId] = next;
      }
    });
    setChanges(draft);
  };

  const saveAllChanges = async () => {
    if (!isAllowedMonth) {
      toast.error('Fee entry is allowed only in April and October');
      return;
    }
    const updates = Object.entries(changes).map(([studentId, paymentMethod]) => ({ studentId, paymentMethod }));
    if (!updates.length) {
      toast('No changes to save');
      return;
    }

    const { data } = await api.post('/fees/bulk-update', {
      classId: filters.classId,
      month: filters.month,
      year: Number(filters.year),
      updates,
    });

    toast.success(`Saved ${data.modifiedCount} changed records`);
    loadFees();
  };

  const renewStudent = async (studentId) => {
    if (!isAllowedMonth) {
      toast.error('Fee entry is allowed only in April and October');
      return;
    }

    await api.post('/fees/renew', {
      classId: filters.classId,
      studentId,
      month: filters.month,
      year: Number(filters.year),
    });

    toast.success('Student renewed');
    loadFees();
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Fee Entry
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
          <TextField select fullWidth label="Class" value={filters.classId} onChange={(e) => setFilters((s) => ({ ...s, classId: e.target.value }))}>
            {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select fullWidth label="Month" value={filters.month} onChange={(e) => setFilters((s) => ({ ...s, month: e.target.value }))}>
            {FEE_MONTHS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Year" type="number" fullWidth value={filters.year} onChange={(e) => setFilters((s) => ({ ...s, year: e.target.value }))} />
          <TextField label="Search" fullWidth value={filters.search} onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))} />
          <Button variant="contained" onClick={() => { setPage(0); loadFees(); }}>
            Search
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Class Total Fee</div>
              <div style={{ fontWeight: 700 }}>{classTotalFee !== null ? classTotalFee : '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Allowed Months</div>
              <div style={{ fontWeight: 700 }}>{FEE_MONTHS.join(', ')}</div>
            </div>
          </div>
        </Stack>
      </Paper>

      <Paper>
        <Stack direction="row" spacing={2} sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => onSelectAll('cash', true)}>
            Select All Cash
          </Button>
          <Button variant="outlined" onClick={() => onSelectAll('online', true)}>
            Select All Online
          </Button>
          <Button variant="contained" onClick={saveAllChanges}>
            Save All Changes ({Object.keys(changes).length})
          </Button>
        </Stack>
        {loading ? (
          <Stack alignItems="center" sx={{ p: 3 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            <div className="table-responsive">
              <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Checkbox</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Base Fee</TableCell>
                  <TableCell>Fine</TableCell>
                  <TableCell>Renew Charge</TableCell>
                  <TableCell>Total Fee</TableCell>
                  {feeAllocations.map((fund) => (
                    <TableCell key={fund.fundName}>{fund.fundName}</TableCell>
                  ))}
                  <TableCell>Action</TableCell>
                  <TableCell>Cash Paid</TableCell>
                  <TableCell>Online Paid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {composedRows.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell data-label="Select">
                      <Checkbox checked={row.currentPayment !== 'unpaid'} onChange={(e) => setPayment(row.studentId, e.target.checked ? 'cash' : 'unpaid')} />
                    </TableCell>
                    <TableCell data-label="Student">{row.studentName}</TableCell>
                    <TableCell data-label="Base Fee">{Number(classTotalFee || 0)}</TableCell>
                    <TableCell data-label="Fine">{Number(row.fineAmount || 0)}</TableCell>
                    <TableCell data-label="Renew Charge">{Number(row.renewalCharge || 0)}</TableCell>
                    <TableCell data-label="Total Fee">{getDisplayedTotalFee(row)}</TableCell>
                    {feeAllocations.map((fund) => (
                      <TableCell key={fund.fundName}>{getAppliedFunds(row)[fund.fundName] ? Number(getAppliedFunds(row)[fund.fundName]) : '-'}</TableCell>
                    ))}
                    <TableCell data-label="Action">
                      {row.canRenew ? (
                        <Button size="small" variant="outlined" onClick={() => renewStudent(row.studentId)}>
                          Renew
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell data-label="Cash">
                      <Checkbox checked={row.currentPayment === 'cash'} onChange={(e) => setPayment(row.studentId, e.target.checked ? 'cash' : 'unpaid')} />
                    </TableCell>
                    <TableCell data-label="Online">
                      <Checkbox checked={row.currentPayment === 'online'} onChange={(e) => setPayment(row.studentId, e.target.checked ? 'online' : 'unpaid')} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>
    </Stack>
  );
}

export default FeeEntryPage;
