export type Role = 'patient' | 'doctor' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: Role;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  settings: ClinicSettings;
  createdAt: Date;
  updatedAt: Date;
  availableDoctors?: number;
  availableDoctorDetails?: Array<{
    name: string;
    specialization: string;
    rating?: number;
    experienceYears?: number;
    photoUrl?: string;
  }>;
}

export interface ClinicSettings {
  tokenPrefix?: string;
  slotDurationDefault?: number;
  maxAdvanceBookingDays?: number;
  allowWalkIns?: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  clinicIds: string[];
  name: string;
  specialization: string;
  role: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  defaultVisitDuration?: number;
  availability?: any[];
  workingHours: Record<string, WorkingHours>;
  status: 'active' | 'inactive' | 'on_leave';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  dayOfWeek: number;
  start: string;
  end: string;
  slotDuration: number;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  preferredClinicIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentType = 'consultation' | 'followup' | 'procedure';
export type AppointmentStatus = 'booked' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentType: AppointmentType;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: AppointmentStatus;
  tokenNumber: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
  notes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Slot {
  id: string;
  doctorId: string;
  clinicId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  isBooked: boolean;
  appointmentId?: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 'appointment_booked' | 'queue_update' | 'doctor_changed' | 'reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface BookingData {
  doctorId: string;
  clinicId: string;
  slotId: string;
  appointmentType: AppointmentType;
  notes?: string;
}