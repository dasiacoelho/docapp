import type { Appointment } from '../../../types';

export function calculateQueuePosition(
  appointments: Appointment[],
  patientAppointmentId: string
): number {
  const relevantAppointments = appointments
    .filter((a) => ['booked', 'checked_in', 'in_progress'].includes(a.status))
    .sort((a, b) => a.tokenNumber - b.tokenNumber);
  
  const index = relevantAppointments.findIndex((a) => a.id === patientAppointmentId);
  return index >= 0 ? index + 1 : 0;
}

export function calculateEstimatedWait(
  appointments: Appointment[],
  patientAppointmentId: string,
  currentAppointmentIndex: number = -1
): number {
  const relevantAppointments = appointments
    .filter((a) => ['booked', 'checked_in', 'in_progress'].includes(a.status))
    .sort((a, b) => a.tokenNumber - b.tokenNumber);
  
  const patientIndex = relevantAppointments.findIndex((a) => a.id === patientAppointmentId);
  if (patientIndex < 0) return 0;
  
  let totalWait = 0;
  const now = new Date();
  
  for (let i = 0; i < patientIndex; i++) {
    const appointment = relevantAppointments[i];
    const duration = getAppointmentDuration(appointment);
    
    if (appointment.status === 'in_progress' && appointment.actualStart) {
      const elapsed = Math.floor((now.getTime() - new Date(appointment.actualStart).getTime()) / 60000);
      const remaining = Math.max(0, duration - elapsed);
      totalWait += remaining;
    } else {
      totalWait += duration;
    }
  }
  
  return totalWait;
}

export function getAppointmentDuration(appointment: Appointment): number {
  const start = new Date(appointment.scheduledStart);
  const end = new Date(appointment.scheduledEnd);
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function getQueueStats(appointments: Appointment[]) {
  const relevant = appointments.filter((a) => 
    ['booked', 'checked_in', 'in_progress'].includes(a.status)
  );
  
  const booked = relevant.filter((a) => a.status === 'booked').length;
  const checkedIn = relevant.filter((a) => a.status === 'checked_in').length;
  const inProgress = relevant.filter((a) => a.status === 'in_progress').length;
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
  const noShow = appointments.filter((a) => a.status === 'no_show').length;
  
  return {
    total: relevant.length,
    booked,
    checkedIn,
    inProgress,
    completed,
    cancelled,
    noShow,
    waiting: booked + checkedIn,
  };
}

export function sortAppointmentsForQueue(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => {
    const statusOrder = { in_progress: 0, checked_in: 1, booked: 2, completed: 3, cancelled: 4, no_show: 5 };
    const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    if (statusDiff !== 0) return statusDiff;
    return a.tokenNumber - b.tokenNumber;
  });
}

export function getNextPatient(appointments: Appointment[]): Appointment | null {
  const waiting = appointments
    .filter((a) => ['booked', 'checked_in'].includes(a.status))
    .sort((a, b) => a.tokenNumber - b.tokenNumber);
  
  return waiting[0] || null;
}

export function getCurrentPatient(appointments: Appointment[]): Appointment | null {
  const inProgress = appointments.find((a) => a.status === 'in_progress');
  return inProgress || null;
}