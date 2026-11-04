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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../features/auth/hooks';
import { NotificationBell } from '../features/shared/components/NotificationBell';

const DRAWER_WIDTH = 248;

const patientMenuItems = [
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

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleRoleSwitch = (newRole: 'patient' | 'doctor' | 'admin') => {
    setRoleAnchorEl(null);
    handleProfileMenuClose();
    setMobileOpen(false);
    switchRole(newRole);
    if (newRole === 'patient') navigate('/patient/booking');
    else if (newRole === 'doctor') navigate('/doctor/dashboard');
    else navigate('/admin/dashboard');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'patient': return patientMenuItems;
      case 'doctor': return doctorMenuItems;
      case 'admin': return adminMenuItems;
      default: return patientMenuItems;
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Brand Header */}
      <Box sx={{ px: 2, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)', flexShrink: 0,
        }}>
          <MedicalServicesRounded sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.2, fontSize: '0.95rem' }}>
            DocApp<Box component="span" sx={{ color: 'primary.main' }}>.</Box>
          </Typography>
          <Chip size="small" label={currentRoleInfo.label} color={currentRoleInfo.color}
            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, mt: 0.3, borderRadius: '6px' }} />
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={handleDrawerToggle} sx={{ ml: 'auto', flexShrink: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto' }}>
        <Typography variant="caption" sx={{ px: 2.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
          Navigation
        </Typography>
        <List component="nav" sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                  sx={{
                    borderRadius: '10px', py: 1, px: 1.5, position: 'relative',
                    ...(isSelected && {
                      backgroundColor: 'rgba(2, 132, 199, 0.08) !important',
                      color: 'primary.main',
                      '&::before': {
                        content: '""', position: 'absolute', left: 0,
                        top: '15%', bottom: '15%', width: 3,
                        borderRadius: '0 4px 4px 0', backgroundColor: 'primary.main',
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isSelected ? 'primary.main' : '#64748b' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: isSelected ? 700 : 500 }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Role Switcher */}
      <Box sx={{ px: 1.5, pb: 1 }}>
        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block"
            sx={{ mb: 1, fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Demo Role Switcher
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {(['patient', 'doctor', 'admin'] as const).map((r) => (
              <Chip key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} clickable size="small"
                variant={user?.role === r ? 'filled' : 'outlined'}
                color={user?.role === r ? 'primary' : 'default'}
                onClick={() => handleRoleSwitch(r)}
                sx={{ fontWeight: 600, fontSize: '0.68rem', flex: 1, height: 24 }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Avatar src={user?.photoURL} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>
          {user?.displayName?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#0f172a', fontSize: '0.8rem' }}>
            {user?.displayName || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
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
      {/* AppBar */}
      <AppBar position="fixed" elevation={0} sx={{
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        bgcolor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: theme.zIndex.drawer + 1,
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: '56px', md: '58px' }, px: { xs: 1.5, md: 2.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ color: '#0f172a', mr: 0.5 }}>
                <MenuIcon />
              </IconButton>
            )}
            {isMobile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 26, height: 26, borderRadius: '7px', background: 'linear-gradient(135deg, #0284c7, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MedicalServicesRounded sx={{ fontSize: 14, color: '#fff' }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  DocApp<Box component="span" sx={{ color: 'primary.main' }}>.</Box>
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem' }}>
                Healthcare Appointment & Queue System
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
            <Button size="small" variant="outlined" color="primary" startIcon={<SwapHorizRounded />}
              onClick={(e) => setRoleAnchorEl(e.currentTarget)}
              sx={{
                borderRadius: '20px', px: { xs: 1, md: 1.5 }, py: 0.4,
                fontSize: '0.73rem', textTransform: 'none',
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.5 } },
              }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Switch Role ({user?.role})</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' }, ml: '-2px', textTransform: 'capitalize' }}>{user?.role}</Box>
            </Button>

            <Menu anchorEl={roleAnchorEl} open={Boolean(roleAnchorEl)} onClose={() => setRoleAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { borderRadius: '12px', mt: 0.5 } } }}>
              <MenuItem onClick={() => handleRoleSwitch('patient')} selected={user?.role === 'patient'}>Patient Portal (Jane Doe)</MenuItem>
              <MenuItem onClick={() => handleRoleSwitch('doctor')} selected={user?.role === 'doctor'}>Doctor Portal (Dr. Sarah Jenkins)</MenuItem>
              <MenuItem onClick={() => handleRoleSwitch('admin')} selected={user?.role === 'admin'}>Admin Portal (Hospital Operations)</MenuItem>
            </Menu>

            <NotificationBell />

            <Tooltip title="User Profile & Settings">
              <IconButton onClick={handleProfileMenuOpen} size="small" sx={{ p: 0.3 }}>
                <Avatar src={user?.photoURL} sx={{ width: 32, height: 32, bgcolor: 'primary.main', border: '2px solid #e2e8f0', fontSize: '0.78rem' }}>
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: '#fff' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e2e8f0', bgcolor: '#ffffff' } }}>
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        minWidth: 0,
        mt: { xs: '56px', md: '58px' },
        minHeight: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 58px)' },
        bgcolor: '#f8fafc',
        overflowX: 'hidden',
      }}>
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3, xl: 4 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { width: 200, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', mt: 0.5 } } }}>
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>{user?.displayName}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutRounded fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>
    </Box>
  );
}
