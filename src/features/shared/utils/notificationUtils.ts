import type { NotificationType } from '../../../types';

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'appointment_booked':
      return '✅';
    case 'queue_update':
      return '🔔';
    case 'doctor_changed':
      return '🔄';
    case 'reminder':
      return '⏰';
    default:
      return '📢';
  }
}

export function getNotificationColor(type: NotificationType): 'success' | 'info' | 'warning' | 'error' {
  switch (type) {
    case 'appointment_booked':
      return 'success';
    case 'queue_update':
      return 'info';
    case 'doctor_changed':
      return 'warning';
    case 'reminder':
      return 'info';
    default:
      return 'info';
  }
}

export function formatNotificationTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - d.getTime()) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
}

export function groupNotificationsByDate(notifications: Array<{ createdAt: Date | string }>) {
  const groups: Record<string, typeof notifications> = {};
  
  notifications.forEach((notification) => {
    const date = typeof notification.createdAt === 'string' 
      ? new Date(notification.createdAt) 
      : notification.createdAt;
    const key = date.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(notification);
  });
  
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}