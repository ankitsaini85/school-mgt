import { createTheme } from '@mui/material';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useAppTheme = () => {
  const mode = useSelector((state) => state.auth.themeMode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#00695f' },
          secondary: { main: '#d97706' },
          background:
            mode === 'dark'
              ? { default: '#0f172a', paper: '#0b1220' }
              : { default: '#f6fbf9', paper: '#ffffff' },
        },
        typography: {
          fontFamily: 'Poppins, "Segoe UI", sans-serif',
          h4: { fontWeight: 700, fontSize: '1.5rem' },
          h5: { fontWeight: 700 },
          button: { textTransform: 'none' },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiCard: { styleOverrides: { root: { borderRadius: 12, padding: 8 } } },
          MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
          MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
          MuiTableCell: { styleOverrides: { root: { padding: '12px 16px' } } },
        },
        breakpoints: {
          values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
        },
      }),
    [mode]
  );

  return { theme };
};
