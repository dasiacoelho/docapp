import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardRounded,
  PersonRounded,
  HistoryRounded,
  LogoutRounded,
  LocalHospitalRounded,
  AnalyticsRounded,
  PeopleRounded,
  ScheduleRounded,
  MedicalServicesRounded,
  SwapHorizRounded,
} from '@mui/icons-material';
import { useAuth } from '../features/auth/hooks';
import { NotificationBell } from '../features/shared/components/NotificationBell';

const drawerWidth = 270;

const patientMenuItems = [
  { text: 'Patient Dashboard', icon: <DashboardRounded />, path: '/patient/dashboard' },
  { text: 'Book Appointment', icon: <LocalHospitalRounded />, path: '/patient/booking' },
  { text: 'My Live Queue', icon: <PersonRounded />, path: '/patient/queue' },
  { text: 'Medical History', icon: <HistoryRounded />, path: '/patient/history' },
];

const doctorMenuItems = [
  { text: 'Doctor Console', icon: <DashboardRounded />, path: '/doctor/dashboard' },
  { text: 'Patient Queue', icon: <PersonRounded />, path: '/doctor/queue' },
  { text: 'Weekly Schedule', icon: <ScheduleRounded />, path: '/doctor/schedule' },
];

const adminMenuItems = [
  { text: 'Admin Overview', icon: <DashboardRounded />, path: '/admin/dashboard' },
  { text: 'Clinics Registry', icon: <LocalHospitalRounded />, path: '/admin/clinics' },
  { text: 'Doctor Directory', icon: <PeopleRounded />, path: '/admin/doctors' },
  { text: 'Operations Analytics', icon: <AnalyticsRounded />, path: '/admin/analytics' },
];

export function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [roleAnchorEl, setRoleAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = (newRole: 'patient' | 'doctor' | 'admin') => {
    setRoleAnchorEl(null);
    handleProfileMenuClose();
    switchRole(newRole);
    if (newRole === 'patient') navigate('/patient/dashboard');
    else if (newRole === 'doctor') navigate('/doctor/dashboard');
    else if (newRole === 'admin') navigate('/admin/dashboard');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'patient':
        return patientMenuItems;
      case 'doctor':
        return doctorMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return patientMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const roleLabels: Record<string, { label: string; color: 'primary' | 'secondary' | 'success' }> = {
    patient: { label: 'Patient Portal', color: 'primary' },
    doctor: { label: 'Doctor Portal', color: 'secondary' },
    admin: { label: 'Admin Portal', color: 'success' },
  };

  const currentRoleInfo = roleLabels[user?.role || 'patient'];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9' }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
          }}
        >
          <MedicalServicesRounded sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2 }}>
            DocApp<Box component="span" sx={{ color: 'primary.main' }}>.</Box>
          </Typography>
          <Chip
            size="small"
            label={currentRoleInfo.label}
            color={currentRoleInfo.color}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              mt: 0.4,
              borderRadius: '6px',
            }}
          />
        </Box>
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, py: 2 }}>
        <Typography variant="caption" sx={{ px: 3, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Navigation
        </Typography>
        <List component="nav" sx={{ mt: 1, px: 1 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: '10px',
                    py: 1.2,
                    px: 2,
                    position: 'relative',
                    ...(isSelected && {
                      backgroundColor: 'rgba(2, 132, 199, 0.08) !important',
                      color: 'primary.main',
                      fontWeight: 700,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '15%',
                        bottom: '15%',
                        width: 4,
                        borderRadius: '0 4px 4px 0',
                        backgroundColor: 'primary.main',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: isSelected ? 'primary.main' : '#64748b' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Role Switcher Widget */}
      <Box sx={{ p: 2, m: 1.5, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
          DEMO ROLE SWITCHER
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(['patient', 'doctor', 'admin'] as const).map((r) => (
            <Chip
              key={r}
              label={r.charAt(0).toUpperCase() + r.slice(1)}
              clickable
              size="small"
              variant={user?.role === r ? 'filled' : 'outlined'}
              color={user?.role === r ? 'primary' : 'default'}
              onClick={() => handleRoleSwitch(r)}
              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
            />
          ))}
        </Box>
      </Box>

      {/* Footer User Info */}
      <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={user?.photoURL}
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}
        >
          {user?.displayName?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#0f172a' }}>
            {user?.displayName || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || 'authenticated'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} title="Sign Out">
          <LogoutRounded fontSize="small" color="action" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ color: '#0f172a' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', display: { xs: 'none', sm: 'block' } }}>
              Healthcare Appointment & Queue System
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quick Role Switcher Pill */}
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<SwapHorizRounded />}
              onClick={(e) => setRoleAnchorEl(e.currentTarget)}
              sx={{ borderRadius: '20px', px: 1.5, py: 0.5, fontSize: '0.78rem' }}
            >
              Switch Role ({user?.role})
            </Button>

            <Menu
              anchorEl={roleAnchorEl}
              open={Boolean(roleAnchorEl)}
              onClose={() => setRoleAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => handleRoleSwitch('patient')} selected={user?.role === 'patient'}>
                Patient Portal (Jane Doe)
              </MenuItem>
              <MenuItem onClick={() => handleRoleSwitch('doctor')} selected={user?.role === 'doctor'}>
                Doctor Portal (Dr. Sarah Jenkins)
              </MenuItem>
              <MenuItem onClick={() => handleRoleSwitch('admin')} selected={user?.role === 'admin'}>
                Admin Portal (Hospital Operations)
              </MenuItem>
            </Menu>

            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile Avatar */}
            <Tooltip title="User Profile & Settings">
              <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ p: 0.5 }}>
                <Avatar
                  src={user?.photoURL}
                  sx={{ width: 36, height: 36, bgcolor: 'primary.main', border: '2px solid #e2e8f0' }}
                >
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: '#f8fafc',
        }}
      >
        <Outlet />
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 220, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {user?.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRounded fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>
    </Box>
  );
}