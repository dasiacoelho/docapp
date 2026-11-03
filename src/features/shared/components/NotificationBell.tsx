import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import { Notifications, MarkEmailRead, Delete } from '@mui/icons-material';
import { notificationManager, InAppNotification } from '../../../services/notifications';
import { formatNotificationTime, getNotificationIcon, getNotificationColor } from '../utils/notificationUtils';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    notificationManager.remove(id);
    handleMenuClose();
  };

  const handleMarkAllAsRead = () => {
    notificationManager.clear();
    handleMenuClose();
  };

  const handleAction = (notification: InAppNotification) => {
    if (notification.action) {
      notification.action.onClick();
      notificationManager.remove(notification.id);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}>
        <IconButton
          color="inherit"
          aria-label="Notifications"
          onClick={handleMenuOpen}
          edge="end"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              width: isMobile ? '95vw' : 360,
              maxHeight: isMobile ? '80vh' : 480,
            },
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h3">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead} startIcon={<MarkEmailRead />}>
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: isMobile ? '70vh' : 400, overflow: 'auto' }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <MenuItem
                  onClick={() => handleAction(notification)}
                  sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}
                  dense
                >
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ minWidth: 36, color: getNotificationColor(notification.type) }}>
                      <span role="img" aria-label={notification.type}>{getNotificationIcon(notification.type)}</span>
                    </ListItemIcon>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatNotificationTime(new Date())}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      {notification.action && (
                        <Button size="small" onClick={(e) => { e.stopPropagation(); handleAction(notification); }}>
                          {notification.action.label}
                        </Button>
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </MenuItem>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
}