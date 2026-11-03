import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';

type EventParams = Record<string, string | number | boolean | undefined>;

class AnalyticsService {
  private analytics: Analytics | null = null;
  private enabled = false;

  init() {
    const analytics = getFirebaseAnalytics();
    if (analytics) {
      this.analytics = analytics;
      this.enabled = true;
    }
  }

  track(eventName: string, params?: EventParams) {
    if (!this.enabled || !this.analytics) return;
    try {
      logEvent(this.analytics, eventName, params);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  trackPageView(pageName: string) {
    this.track('page_view', { page_name: pageName });
  }

  trackAppointmentBooked(data: { doctorId: string; clinicId: string; appointmentType: string }) {
    this.track('appointment_booked', data);
  }

  trackAppointmentCancelled(data: { appointmentId: string; reason?: string }) {
    this.track('appointment_cancelled', data);
  }

  trackSlotBlocked(data: { doctorId: string; clinicId: string; date: string }) {
    this.track('slot_blocked', data);
  }

  trackPatientCheckIn(data: { appointmentId: string; clinicId: string }) {
    this.track('patient_check_in', data);
  }

  trackAppointmentCompleted(data: { appointmentId: string; durationMinutes: number }) {
    this.track('appointment_completed', data);
  }

  trackSearchDoctors(data: { clinicId: string; specialization?: string }) {
    this.track('search_doctors', data);
  }

  trackViewQueue(data: { appointmentId: string }) {
    this.track('view_queue', data);
  }

  trackError(error: Error, context?: string) {
    this.track('app_error', { message: error.message, context });
  }

  setUserId(userId: string) {
    if (this.analytics) {
      (this.analytics as any).setUserId?.(userId);
    }
  }

  setUserProperties(properties: Record<string, string | number | boolean>) {
    if (this.analytics) {
      (this.analytics as any).setUserProperties?.(properties);
    }
  }
}

export const analytics = new AnalyticsService();