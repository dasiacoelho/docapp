import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { Clinic, Doctor, Patient, Appointment, Slot, Notification, Role } from '../types';
import { INITIAL_DOCTORS, INITIAL_PATIENTS, INITIAL_CLINICS, generateSlotsForDate, generateInitialAppointments } from './mockData';

export const COLLECTIONS = {
  CLINICS: 'clinics',
  DOCTORS: 'doctors',
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  SLOTS: 'slots',
  NOTIFICATIONS: 'notifications',
  ADMINS: 'admins',
} as const;

function getDb() {
  return getFirestoreDb();
}

function toDate(timestamp: Timestamp | Date | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

function toTimestamp(date: Date | string | number): Timestamp {
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.fromDate(new Date(date));
}

export const firestoreService = {
  async getDoc<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(getDb(), collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch {
      return null;
    }
  },

  async getDocs<T>(collectionName: string, constraints: any[] = []): Promise<T[]> {
    try {
      const colRef = collection(getDb(), collectionName);
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    } catch {
      return [];
    }
  },

  async setDoc<T extends { id?: string }>(collectionName: string, data: T, id?: string): Promise<string> {
    const docRef = id
      ? doc(getDb(), collectionName, id)
      : doc(collection(getDb(), collectionName));
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateDoc(collectionName: string, id: string, data: Partial<DocumentData>): Promise<void> {
    const docRef = doc(getDb(), collectionName, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    await deleteDoc(doc(getDb(), collectionName, id));
  },

  async runTransaction<T>(updateFn: (transaction: any) => Promise<T>): Promise<T> {
    return runTransaction(getDb(), updateFn);
  },

  batch() {
    return writeBatch(getDb());
  },

  collection(name: string): CollectionReference {
    return collection(getDb(), name);
  },

  docRef(collectionName: string, id: string): DocumentReference {
    return doc(getDb(), collectionName, id);
  },

  onSnapshot(collectionName: string, id: string, callback: (doc: any) => void) {
    try {
      return onSnapshot(doc(getDb(), collectionName, id), callback);
    } catch {
      return () => {};
    }
  },

  get patientService() { return patientService; },
  get doctorService() { return doctorService; },
  get clinicService() { return clinicService; },
  get appointmentService() { return appointmentService; },
};

export const clinicService = {
  async getAll(): Promise<Clinic[]> {
    return firestoreService.getDocs<Clinic>(COLLECTIONS.CLINICS, [orderBy('name')]);
  },

  async getBySpecialization(specialization: string, _date?: string): Promise<Clinic[]> {
    const clinics = await this.getAll();
    const clinicsWithDoctors = await Promise.all(
      clinics.map(async (clinic) => {
        const doctors = await doctorService.getByClinicAndSpecialization(
          clinic.id,
          specialization,
        );
        return { clinic, doctors };
      }),
    );

    return clinicsWithDoctors
      .filter(({ doctors }) => doctors.length > 0)
      .map(({ clinic, doctors }) => ({
        ...clinic,
        availableDoctors: doctors.length,
        availableDoctorDetails: doctors.map((doctor) => ({
          name: doctor.name,
          specialization: doctor.specialization,
          rating: doctor.rating,
          experienceYears: doctor.experienceYears,
          photoUrl: doctor.photoUrl,
        })),
      }));
  },

  async getById(id: string): Promise<Clinic | null> {
    return firestoreService.getDoc<Clinic>(COLLECTIONS.CLINICS, id);
  },

  async create(clinic: Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.CLINICS, clinic as any);
  },

  async update(id: string, data: Partial<Clinic>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.CLINICS, id, data);
  },

  async delete(id: string): Promise<void> {
    return firestoreService.deleteDoc(COLLECTIONS.CLINICS, id);
  },
};

export const doctorService = {
  async getAll(): Promise<Doctor[]> {
    return firestoreService.getDocs<Doctor>(COLLECTIONS.DOCTORS, [orderBy('name')]);
  },

  async getAllSpecializations(): Promise<string[]> {
    try {
      const doctors = await firestoreService.getDocs<Doctor>(COLLECTIONS.DOCTORS, [
        where('status', '==', 'active'),
      ]);
      if (doctors.length > 0) {
        const specializations = [...new Set(doctors.map((d) => d.specialization))];
        return specializations.sort();
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getByClinic(clinicId: string): Promise<Doctor[]> {
    return firestoreService.getDocs<Doctor>(COLLECTIONS.DOCTORS, [
      where('clinicIds', 'array-contains', clinicId),
      where('status', '==', 'active'),
      orderBy('name'),
    ]);
  },

  async getAvailableDoctorsByClinicAndDate(
    clinicId: string,
    _date: string,
    specialization?: string,
  ): Promise<Doctor[]> {
    const doctors = await this.getByClinic(clinicId);
    if (!specialization) return doctors;

    const normalizedSpecialization = specialization.trim().toLocaleLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.specialization?.trim().toLocaleLowerCase() === normalizedSpecialization,
    );
  },

  async getByClinicAndSpecialization(
    clinicId: string,
    specialization: string,
    _date?: string,
  ): Promise<Doctor[]> {
    return this.getAvailableDoctorsByClinicAndDate(
      clinicId,
      '',
      specialization,
    );
  },

  async getById(id: string): Promise<Doctor | null> {
    return firestoreService.getDoc<Doctor>(COLLECTIONS.DOCTORS, id);
  },

  async getByUserId(userId: string): Promise<Doctor | null> {
    const results = await firestoreService.getDocs<Doctor>(COLLECTIONS.DOCTORS, [
      where('userId', '==', userId),
      limit(1),
    ]);
    return results[0] || null;
  },

  async create(doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.DOCTORS, doctor as any);
  },

  async update(id: string, data: Partial<Doctor>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.DOCTORS, id, data);
  },

  async delete(id: string): Promise<void> {
    return firestoreService.deleteDoc(COLLECTIONS.DOCTORS, id);
  },
};

export const patientService = {
  async getByUserId(userId: string): Promise<Patient | null> {
    // Patient profiles are stored under their Firebase Auth UID. Reading by
    // document ID is also permitted by Firestore rules for the signed-in user.
    return firestoreService.getDoc<Patient>(COLLECTIONS.PATIENTS, userId);
  },

  async getById(id: string): Promise<Patient | null> {
    return firestoreService.getDoc<Patient>(COLLECTIONS.PATIENTS, id);
  },

  async create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.PATIENTS, patient as any);
  },

  async update(id: string, data: Partial<Patient>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.PATIENTS, id, data);
  },
};

export const appointmentService = {
  async getByPatient(patientId: string): Promise<Appointment[]> {
    return firestoreService.getDocs<Appointment>(COLLECTIONS.APPOINTMENTS, [
      where('patientId', '==', patientId),
      orderBy('scheduledStart', 'desc'),
    ]);
  },

  async getByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    const constraints: any[] = [
      where('doctorId', '==', doctorId),
      orderBy('scheduledStart'),
    ];
    if (date) {
      constraints.unshift(where('scheduledStart', '>=', new Date(date + 'T00:00:00')));
      constraints.unshift(where('scheduledStart', '<=', new Date(date + 'T23:59:59')));
    }
    return firestoreService.getDocs<Appointment>(COLLECTIONS.APPOINTMENTS, constraints);
  },

  async getByClinicAndDate(clinicId: string, date: string): Promise<Appointment[]> {
    return firestoreService.getDocs<Appointment>(COLLECTIONS.APPOINTMENTS, [
      where('clinicId', '==', clinicId),
      where('scheduledStart', '>=', new Date(date + 'T00:00:00')),
      where('scheduledStart', '<=', new Date(date + 'T23:59:59')),
      where('status', 'in', ['booked', 'checked_in', 'in_progress']),
      orderBy('scheduledStart'),
    ]);
  },

  async getByClinicAndDateRange(clinicId: string, startDate: string, endDate: string): Promise<Appointment[]> {
    return firestoreService.getDocs<Appointment>(COLLECTIONS.APPOINTMENTS, [
      where('clinicId', '==', clinicId),
      where('scheduledStart', '>=', new Date(startDate + 'T00:00:00')),
      where('scheduledStart', '<=', new Date(endDate + 'T23:59:59')),
      orderBy('scheduledStart'),
    ]);
  },

  async getById(id: string): Promise<Appointment | null> {
    return firestoreService.getDoc<Appointment>(COLLECTIONS.APPOINTMENTS, id);
  },

  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.APPOINTMENTS, appointment as any);
  },

  async update(id: string, data: Partial<Appointment>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.APPOINTMENTS, id, data);
  },

  async bookWithTransaction(
    slotId: string,
    appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'tokenNumber' | 'queuePosition' | 'estimatedWaitMinutes'>
  ): Promise<{ appointmentId: string; tokenNumber: number }> {
    const db = getDb();
    const start = toDate(appointmentData.scheduledStart) ?? new Date();
    const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const bookedSlots = await slotService.getByDoctorAndDate(appointmentData.doctorId, date);
    const tokenNumber = bookedSlots.filter((slot) => slot.isBooked).length + 1;
    const slotRef = doc(db, COLLECTIONS.SLOTS, slotId);
    const appointmentRef = doc(collection(db, COLLECTIONS.APPOINTMENTS));

    await runTransaction(db, async (transaction) => {
      const slotSnapshot = await transaction.get(slotRef);
      if (!slotSnapshot.exists()) {
        throw new Error('This slot no longer exists. Please choose another slot.');
      }

      const slot = slotSnapshot.data() as Slot;
      if (slot.isBooked || slot.isBlocked) {
        throw new Error('This slot is no longer available. Please choose another.');
      }

      transaction.set(appointmentRef, {
        ...appointmentData,
        tokenNumber,
        queuePosition: tokenNumber,
        estimatedWaitMinutes: tokenNumber * 15,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(slotRef, {
        isBooked: true,
        appointmentId: appointmentRef.id,
        updatedAt: serverTimestamp(),
      });
    });

    return { appointmentId: appointmentRef.id, tokenNumber };
  },
};

export const slotService = {
  async getAvailableSlots(doctorId: string, date: string): Promise<Slot[]> {
    return firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      where('isBooked', '==', false),
      where('isBlocked', '==', false),
      orderBy('startTime'),
    ]);
  },

  async getByDoctorAndDate(doctorId: string, date: string): Promise<Slot[]> {
    return firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
      where('doctorId', '==', doctorId),
      where('date', '==', date),
      orderBy('startTime'),
    ]);
  },

  async getByClinicAndDate(clinicId: string, date: string): Promise<Slot[]> {
    return firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
      where('clinicId', '==', clinicId),
      where('date', '==', date),
      orderBy('startTime'),
    ]);
  },

  async create(slot: Omit<Slot, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.SLOTS, slot as any);
  },

  async update(id: string, data: Partial<Slot>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.SLOTS, id, data);
  },

  async blockSlot(slotId: string, blocked: boolean): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.SLOTS, slotId, { isBlocked: blocked });
  },

  async generateSlotsForDoctor(
    doctorId: string,
    clinicId: string,
    date: string,
    workingHours: { start: string; end: string; slotDuration: number }
  ): Promise<string[]> {
    const { start, end, slotDuration } = workingHours;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const slots: string[] = [];
    let current = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    while (current + slotDuration <= endMins) {
      const slotStart = new Date(`${date}T${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}:00`);
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
      const id = await firestoreService.setDoc(COLLECTIONS.SLOTS, {
        doctorId,
        clinicId,
        date,
        startTime: slotStart,
        endTime: slotEnd,
        durationMinutes: slotDuration,
        isBooked: false,
        isBlocked: false,
      } as any);
      slots.push(id);
      current += slotDuration;
    }
    return slots;
  },
};

export const notificationService = {
  async getByUser(userId: string, limitCount = 50): Promise<Notification[]> {
    return firestoreService.getDocs<Notification>(COLLECTIONS.NOTIFICATIONS, [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ]);
  },

  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.NOTIFICATIONS, notification as any);
  },

  async markAsRead(id: string): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.NOTIFICATIONS, id, { read: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await firestoreService.getDocs<Notification>(COLLECTIONS.NOTIFICATIONS, [
      where('userId', '==', userId),
      where('read', '==', false),
    ]);
    const batch = firestoreService.batch();
    notifications.forEach((n) => {
      batch.update(doc(getDb(), COLLECTIONS.NOTIFICATIONS, n.id), { read: true });
    });
    await batch.commit();
  },
};

export { toDate, toTimestamp };
