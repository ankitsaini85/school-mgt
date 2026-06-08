import { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Stack,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import api from '../api/client';

function TeacherDashboardPage() {
  const [stats, setStats] = useState({ assignedClasses: [], totalStudents: 0, currentMonthCollection: 0 });

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setStats(res.data));
  }, []);

  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography color="text.secondary">Total Students</Typography>
            <Typography variant="h4" fontWeight={700}>
              {stats.totalStudents}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography color="text.secondary">Current Month Collection</Typography>
            <Typography variant="h4" fontWeight={700}>
              {stats.currentMonthCollection}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Assigned Classes
        </Typography>
        <Stack spacing={2}>
          {(stats.assignedClasses || []).map((item) => (
            <Paper key={item._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {item.name}
                </Typography>
                {item.feeSetup?.totalFee ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Total Fee: {item.feeSetup.totalFee}
                    </Typography>
                    <Divider />
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fund</TableCell>
                          <TableCell>Percentage</TableCell>
                          <TableCell>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.feeSetup.fundAllocations.map((fund) => (
                          <TableRow key={fund.fundName}>
                            <TableCell>{fund.fundName}</TableCell>
                            <TableCell>{fund.percentage}%</TableCell>
                            <TableCell>{fund.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Fee setup not added yet for this class.
                  </Typography>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default TeacherDashboardPage;
