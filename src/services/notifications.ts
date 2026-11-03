import type { Notification, NotificationType } from '../types';
import { notificationService } from './firestore';

export interface InAppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type NotificationListener = (notifications: InAppNotification[]) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private notifications: InAppNotification[] = [];
  private unsubscribeFirestore: (() => void) | null = null;
  private currentUserId: string | null = null;

  subscribe(listener: (notifications: InAppNotification[]) => void) {
    this.listeners.add(listener);
    listener(this.notifications);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  add(notification: Omit<InAppNotification, 'id'>) {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newNotification: InAppNotification = { id, ...notification };
    this.notifications = [newNotification, ...this.notifications].slice(0, 20);
    this.notify();

    if (notification.duration !== 0) {
      setTimeout(() => this.remove(id), notification.duration || 5000);
    }
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  success(title: string, message: string, options?: Partial<InAppNotification>) {
    this.add({ type: 'success', title, message, ...options });
  }

  error(title: string, message: string, options?: Partial<InAppNotification>) {
    this.add({ type: 'error', title, message, duration: 8000, ...options });
  }

  warning(title: string, message: string, options?: Partial<InAppNotification>) {
    this.add({ type: 'warning', title, message, ...options });
  }

  info(title: string, message: string, options?: Partial<InAppNotification>) {
    this.add({ type: 'info', title, message, ...options });
  }

  setupFirestoreListener(userId: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }
    this.currentUserId = userId;

    const unsubscribe = notificationService.getByUser(userId, 20).then((notifications) => {
      const unread = notifications.filter((n) => !n.read);
      unread.forEach((n) => {
        this.add({
          type: this.mapType(n.type),
          title: n.title,
          message: n.body,
          duration: 0,
          action: n.data?.actionUrl
            ? {
                label: 'View',
                onClick: () => {
                  window.location.href = n.data?.actionUrl as string;
                },
              }
            : undefined,
        });
      });
    });

    this.unsubscribeFirestore = () => {
      // Firestore real-time listener would be set up here
    };
  }

  cleanup() {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }
    this.currentUserId = null;
  }

  private mapType(type: NotificationType): InAppNotification['type'] {
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
}

export const notificationManager = new NotificationManager();

export async function sendAppointmentBookedNotification(
  userId: string,
  appointmentData: { doctorName: string; clinicName: string; date: string; time: string; tokenNumber: number }
) {
  await notificationService.create({
    userId,
    type: 'appointment_booked',
    title: 'Appointment Confirmed',
    body: `Your appointment with Dr. ${appointmentData.doctorName} at ${appointmentData.clinicName} on ${appointmentData.date} at ${appointmentData.time} is confirmed. Token: #${appointmentData.tokenNumber}`,
    data: { appointmentData },
    read: false,
  });
}

export async function sendQueueUpdateNotification(
  userId: string,
  data: { position: number; estimatedWait: number; doctorName: string }
) {
  await notificationService.create({
    userId,
    type: 'queue_update',
    title: 'Queue Update',
    body: `Your position is now #${data.position}. Estimated wait: ${data.estimatedWait} minutes.`,
    data,
    read: false,
  });
}

export async function sendDoctorChangedNotification(
  userId: string,
  data: { oldDoctor: string; newDoctor: string; clinicName: string }
) {
  await notificationService.create({
    userId,
    type: 'doctor_changed',
    title: 'Doctor Changed',
    body: `Your appointment has been moved from Dr. ${data.oldDoctor} to Dr. ${data.newDoctor} at ${data.clinicName}.`,
    data,
    read: false,
  });
}

export async function sendReminderNotification(
  userId: string,
  data: { doctorName: string; clinicName: string; date: string; time: string; minutesUntil: number }
) {
  await notificationService.create({
    userId,
    type: 'reminder',
    title: 'Appointment Reminder',
    body: `Your appointment with Dr. ${data.doctorName} at ${data.clinicName} is in ${data.minutesUntil} minutes (${data.time} on ${data.date}).`,
    data,
    read: false,
  });
}