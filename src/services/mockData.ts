import type { Clinic, Doctor, Patient, Appointment, Slot } from '../types';

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'City General Health & Polyclinic',
    address: '450 Wellness Blvd, Medical District, Suite 100',
    phone: '+1 (555) 234-5678',
    timezone: 'America/New_York',
    settings: {
      tokenPrefix: 'CG',
      slotDurationDefault: 20,
      maxAdvanceBookingDays: 30,
      allowWalkIns: true,
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'clinic-2',
    name: 'St. Jude Specialist Health Pavilion',
    address: '820 West End Ave, Pavilion Center, Floor 4',
    phone: '+1 (555) 876-5432',
    timezone: 'America/New_York',
    settings: {
      tokenPrefix: 'SJ',
      slotDurationDefault: 30,
      maxAdvanceBookingDays: 60,
      allowWalkIns: false,
    },
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
  },
  {
    id: 'clinic-3',
    name: 'Apex Care Cardiology & Wellness Hub',
    address: '108 Riverside Parkway, Suite 250',
    phone: '+1 (555) 432-1098',
    timezone: 'America/New_York',
    settings: {
      tokenPrefix: 'AC',
      slotDurationDefault: 15,
      maxAdvanceBookingDays: 14,
      allowWalkIns: true,
    },
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10'),
  },
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doctor-1',
    userId: 'demo-doctor-1',
    clinicIds: ['clinic-1', 'clinic-2'],
    name: 'Dr. Sarah Jenkins, MD',
    specialization: 'Cardiology',
    role: 'doctor',
    email: 'dr.sarah@docapp.health',
    phone: '+1 (555) 301-8842',
    qualification: 'MD, FACC - Harvard Medical School',
    experienceYears: 14,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&auto=format&fit=crop&q=80',
    status: 'active',
    workingHours: {
      mon: { dayOfWeek: 1, start: '09:00', end: '17:00', slotDuration: 20 },
      tue: { dayOfWeek: 2, start: '09:00', end: '17:00', slotDuration: 20 },
      wed: { dayOfWeek: 3, start: '09:00', end: '17:00', slotDuration: 20 },
      thu: { dayOfWeek: 4, start: '09:00', end: '17:00', slotDuration: 20 },
      fri: { dayOfWeek: 5, start: '09:00', end: '15:00', slotDuration: 20 },
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'doctor-2',
    userId: 'demo-doctor-2',
    clinicIds: ['clinic-1', 'clinic-3'],
    name: 'Dr. Marcus Vance, MD',
    specialization: 'Neurology & Surgery',
    role: 'doctor',
    email: 'dr.marcus@docapp.health',
    phone: '+1 (555) 302-9951',
    qualification: 'MD, PhD - Johns Hopkins University',
    experienceYears: 18,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250&auto=format&fit=crop&q=80',
    status: 'active',
    workingHours: {
      mon: { dayOfWeek: 1, start: '08:30', end: '16:30', slotDuration: 30 },
      wed: { dayOfWeek: 3, start: '08:30', end: '16:30', slotDuration: 30 },
      fri: { dayOfWeek: 5, start: '08:30', end: '14:00', slotDuration: 30 },
    },
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
  {
    id: 'doctor-3',
    userId: 'demo-doctor-3',
    clinicIds: ['clinic-1', 'clinic-2', 'clinic-3'],
    name: 'Dr. Priya Sharma, MD',
    specialization: 'Pediatrics & Adolescent Care',
    role: 'doctor',
    email: 'dr.priya@docapp.health',
    phone: '+1 (555) 303-6612',
    qualification: 'MD, FAAP - Stanford University',
    experienceYears: 11,
    photoUrl: 'https://images.unsplash.com/photo-1594824813511-209214749f7b?w=250&auto=format&fit=crop&q=80',
    status: 'active',
    workingHours: {
      mon: { dayOfWeek: 1, start: '10:00', end: '18:00', slotDuration: 20 },
      tue: { dayOfWeek: 2, start: '10:00', end: '18:00', slotDuration: 20 },
      thu: { dayOfWeek: 4, start: '10:00', end: '18:00', slotDuration: 20 },
    },
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  },
  {
    id: 'doctor-4',
    userId: 'demo-doctor-4',
    clinicIds: ['clinic-2'],
    name: 'Dr. Robert Rodriguez, MD',
    specialization: 'Orthopedics & Sports Rehab',
    role: 'doctor',
    email: 'dr.robert@docapp.health',
    phone: '+1 (555) 304-7723',
    qualification: 'MD, FAAOS - Mayo Clinic College of Medicine',
    experienceYears: 15,
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250&auto=format&fit=crop&q=80',
    status: 'active',
    workingHours: {
      tue: { dayOfWeek: 2, start: '09:00', end: '16:00', slotDuration: 20 },
      thu: { dayOfWeek: 4, start: '09:00', end: '16:00', slotDuration: 20 },
    },
    createdAt: new Date('2025-01-04'),
    updatedAt: new Date('2025-01-04'),
  },
  {
    id: 'doctor-5',
    userId: 'demo-doctor-5',
    clinicIds: ['clinic-1', 'clinic-3'],
    name: 'Dr. Emily Chen, DO',
    specialization: 'Family Medicine & Preventive Care',
    role: 'doctor',
    email: 'dr.emily@docapp.health',
    phone: '+1 (555) 305-1190',
    qualification: 'DO, FAAFP - Columbia University',
    experienceYears: 9,
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&auto=format&fit=crop&q=80',
    status: 'active',
    workingHours: {
      mon: { dayOfWeek: 1, start: '08:00', end: '16:00', slotDuration: 15 },
      tue: { dayOfWeek: 2, start: '08:00', end: '16:00', slotDuration: 15 },
      wed: { dayOfWeek: 3, start: '08:00', end: '16:00', slotDuration: 15 },
      thu: { dayOfWeek: 4, start: '08:00', end: '16:00', slotDuration: 15 },
      fri: { dayOfWeek: 5, start: '08:00', end: '13:00', slotDuration: 15 },
    },
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-05'),
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'patient-1',
    userId: 'demo-patient-1',
    name: 'Jane Doe',
    phone: '+1 (555) 901-2345',
    email: 'patient.demo@docapp.health',
    dateOfBirth: new Date('1992-05-14'),
    gender: 'female',
    preferredClinicIds: ['clinic-1', 'clinic-2'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'patient-2',
    userId: 'demo-patient-2',
    name: 'Michael Chang',
    phone: '+1 (555) 902-3456',
    email: 'm.chang@example.com',
    dateOfBirth: new Date('1985-09-21'),
    gender: 'male',
    preferredClinicIds: ['clinic-1'],
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
  {
    id: 'patient-3',
    userId: 'demo-patient-3',
    name: 'Sophia Patel',
    phone: '+1 (555) 903-4567',
    email: 'sophia.p@example.com',
    dateOfBirth: new Date('1998-11-03'),
    gender: 'female',
    preferredClinicIds: ['clinic-1', 'clinic-3'],
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03'),
  },
  {
    id: 'patient-4',
    userId: 'demo-patient-4',
    name: 'David Miller',
    phone: '+1 (555) 904-5678',
    email: 'dmiller@example.com',
    dateOfBirth: new Date('1976-03-30'),
    gender: 'male',
    preferredClinicIds: ['clinic-2'],
    createdAt: new Date('2025-01-04'),
    updatedAt: new Date('2025-01-04'),
  },
];

export function generateSlotsForDate(doctor: Doctor, clinicId: string, dateStr: string): Slot[] {
  const slots: Slot[] = [];
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  
  times.forEach((time, index) => {
    const [h, m] = time.split(':').map(Number);
    const start = new Date(dateStr + 'T' + time + ':00');
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    // Mark a couple as booked for realism
    const isBooked = index === 1 || index === 4;

    slots.push({
      id: `slot-${doctor.id}-${dateStr}-${index}`,
      doctorId: doctor.id,
      clinicId,
      date: dateStr,
      startTime: start,
      endTime: end,
      durationMinutes: 30,
      isBooked,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  return slots;
}

export function generateInitialAppointments(): Appointment[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  const start1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30);
  const end1 = new Date(start1.getTime() + 30 * 60000);

  const start2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0);
  const end2 = new Date(start2.getTime() + 30 * 60000);

  const start3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30);
  const end3 = new Date(start3.getTime() + 30 * 60000);

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const start4 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0);
  const end4 = new Date(start4.getTime() + 30 * 60000);

  return [
    {
      id: 'appt-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      clinicId: 'clinic-1',
      appointmentType: 'consultation',
      scheduledStart: start1,
      scheduledEnd: end1,
      actualStart: start1,
      status: 'in_progress',
      tokenNumber: 12,
      queuePosition: 1,
      estimatedWaitMinutes: 5,
      notes: 'Routine cardiovascular wellness checkup and blood pressure assessment.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'appt-2',
      patientId: 'patient-2',
      doctorId: 'doctor-1',
      clinicId: 'clinic-1',
      appointmentType: 'followup',
      scheduledStart: start2,
      scheduledEnd: end2,
      status: 'checked_in',
      tokenNumber: 13,
      queuePosition: 2,
      estimatedWaitMinutes: 20,
      notes: 'Post-medication ECG review.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'appt-3',
      patientId: 'patient-3',
      doctorId: 'doctor-1',
      clinicId: 'clinic-1',
      appointmentType: 'consultation',
      scheduledStart: start3,
      scheduledEnd: end3,
      status: 'booked',
      tokenNumber: 14,
      queuePosition: 3,
      estimatedWaitMinutes: 45,
      notes: 'Consultation for mild chest tightness during morning exercise.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'appt-4',
      patientId: 'patient-1',
      doctorId: 'doctor-2',
      clinicId: 'clinic-1',
      appointmentType: 'consultation',
      scheduledStart: start4,
      scheduledEnd: end4,
      status: 'booked',
      tokenNumber: 4,
      queuePosition: 4,
      estimatedWaitMinutes: 60,
      notes: 'Migraine consultation with Dr. Vance.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

