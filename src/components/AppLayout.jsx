import { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, toggleTheme } from '../features/auth/authSlice';
import MobileNav from './MobileNav';

const drawerWidth = 260;

function AppLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const links = useMemo(() => {
    if (user?.role === 'principal') {
      return [
        { label: 'Principal Dashboard', to: '/principal' },
        { label: 'Teachers Management', to: '/teachers' },
        { label: 'Classes Management', to: '/classes' },
        { label: 'Reports', to: '/reports' },
      ];
    }

    return [
      { label: 'Teacher Dashboard', to: '/teacher' },
      { label: 'Student Management', to: '/students' },
      { label: 'Fee Entry', to: '/fees' },
      { label: 'Reports', to: '/reports' },
    ];
  }, [user?.role]);

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          School Fee MS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {links.map((item) => (
          <ListItemButton
            key={item.to}
            component={Link}
            to={item.to}
            selected={location.pathname === item.to}
            onClick={() => setOpen(false)}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen((v) => !v)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {user?.name} ({user?.role})
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={() => dispatch(toggleTheme())} startIcon={<Brightness4Icon />}>
              Theme
            </Button>
            <Button color="inherit" onClick={() => dispatch(logout())}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            top: '64px',
          },
          display: { xs: 'none', md: 'block' },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { md: 'none' } }}>
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: 8,
          ml: { md: `10px` },
          minHeight: 'calc(100vh - 64px)',
          background: 'transparent',
          pb: { xs: '96px', md: 0 },
        }}
      >
        <Box sx={{ width: '100%', minWidth: 0 }}>{children}</Box>
      </Box>
      <MobileNav />
    </Box>
  );
}

export default AppLayout;
