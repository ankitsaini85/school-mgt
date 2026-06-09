import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function MobileNav() {
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  return (
    <Paper
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 12,
        left: 2,
        right: 2,
        borderRadius: 1,
        zIndex: 1400,
        px: 1,
        py: 0.5,
        height: 60  ,
        backdropFilter: 'saturate(140%) blur(6px)',
      }}
      elevation={6}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          switch (newValue) {
            case 0:
              navigate('/teacher');
              break;
            case 1:
              navigate('/students');
              break;
            case 2:
              navigate('/classes');
              break;
            case 3:
              navigate('/fees');
              break;
            case 4:
              navigate('/reports');
              break;
            default:
              navigate('/');
          }
        }}
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Students" icon={<GroupsIcon />} />
        <BottomNavigationAction label="Classes" icon={<SchoolIcon />} />
        <BottomNavigationAction label="Fees" icon={<ReceiptIcon />} />
        <BottomNavigationAction label="Reports" icon={<BarChartIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
