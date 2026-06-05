import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './app/store';
import { useAppTheme } from './utils/theme';
import './styles.css';

function AppShell() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppShell />
    </Provider>
  </React.StrictMode>
);
