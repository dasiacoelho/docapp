import {
  getFirestore,
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
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type {
  Clinic,
  Doctor,
  Patient,
  Appointment,
  Slot,
  Notification,
  Role,
} from "../types";
import {
  INITIAL_CLINICS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  generateSlotsForDate,
  generateInitialAppointments,
} from "./mockData";

export const COLLECTIONS = {
  CLINICS: "clinics",
  DOCTORS: "doctors",
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  SLOTS: "slots",
  NOTIFICATIONS: "notifications",
  ADMINS: "admins",
} as const;

function getDb() {
  return getFirestoreDb();
}

// Reads and writes fall back to mock data on failure, which is intentional for
// this demo app. Log the reason anyway so a denied request or a missing index
// is diagnosable instead of silently invisible.
function logFirestoreError(
  operation: string,
  error: unknown,
  context?: unknown,
) {
  console.error(`[firestore] ${operation} failed`, context ?? "", error);
}

function toDate(
  timestamp: Timestamp | Date | string | undefined,
): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
}

function toTimestamp(date: Date | string | number): Timestamp {
  if (date instanceof Date) return Timestamp.fromDate(date);
  return Timestamp.fromDate(new Date(date));
}

// Firestore returns Timestamps for date fields while the rest of the app (and
// all the mock data) works with Date objects. date-fns throws "Invalid time
// value" on a Timestamp, so normalise every document once at the service
// boundary instead of making each page remember to call toDate().
export function normalizeFirestoreData<T>(value: T): T {
  if (value instanceof Timestamp) return value.toDate() as unknown as T;
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeFirestoreData(entry)) as unknown as T;
  }
  if (value && typeof value === "object" && value.constructor === Object) {
    const normalized: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      normalized[key] = normalizeFirestoreData(entry);
    });
    return normalized as T;
  }
  return value;
}

// In-memory fallback state so operations work smoothly even when Firestore is empty/offline
let localAppointments: Appointment[] = generateInitialAppointments();
let localSlots: Slot[] = [];

// Days whose slot list has already been materialised in memory. Once a day is
// seeded, an empty local result means the doctor removed every slot instead of
// "generate the demo defaults again".
const materializedSlotDays = new Set<string>();

function slotDayKey(doctorId: string, date: string): string {
  return `${doctorId}|${date}`;
}

function hasTimeConflict(
  appointment: Appointment,
  startMs: number,
  endMs: number,
): boolean {
  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    return false;
  }
  const appointmentStart = toDate(appointment.scheduledStart)?.getTime();
  const appointmentEnd = toDate(appointment.scheduledEnd)?.getTime();
  if (appointmentStart === undefined || appointmentEnd === undefined) {
    return false;
  }
  return startMs < appointmentEnd && endMs > appointmentStart;
}

function materializeSlotsForDay(
  doctor: Doctor,
  clinicId: string,
  date: string,
): Slot[] {
  const key = slotDayKey(doctor.id, date);
  const existing = localSlots.filter(
    (slot) => slot.doctorId === doctor.id && slot.date === date,
  );
  if (materializedSlotDays.has(key)) return existing;

  const generated = generateSlotsForDate(doctor, clinicId, date);
  for (const slot of generated) {
    const slotStart = toDate(slot.startTime)?.getTime();
    const slotEnd = toDate(slot.endTime)?.getTime();
    // A slot already covered by an appointment must never be offered again,
    // even if the demo slot data still marks it as free.
    if (
      slotStart !== undefined &&
      slotEnd !== undefined &&
      localAppointments.some(
        (appt) =>
          appt.doctorId === doctor.id &&
          hasTimeConflict(appt, slotStart, slotEnd),
      )
    ) {
      slot.isBooked = true;
    }
    if (!localSlots.some((local) => local.id === slot.id)) {
      localSlots.push(slot);
    }
  }
  materializedSlotDays.add(key);
  return generated;
}

export const firestoreService = {
  async getDoc<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(getDb(), collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return normalizeFirestoreData({ id: docSnap.id, ...docSnap.data() }) as T;
    } catch (error) {
      logFirestoreError("getDoc", error, `${collectionName}/${id}`);
      return null;
    }
  },

  async getDocs<T>(
    collectionName: string,
    constraints: any[] = [],
  ): Promise<T[]> {
    try {
      const colRef = collection(getDb(), collectionName);
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (d) => normalizeFirestoreData({ id: d.id, ...d.data() }) as T,
      );
    } catch (error) {
      logFirestoreError("getDocs", error, collectionName);
      return [];
    }
  },

  async setDoc<T extends { id?: string }>(
    collectionName: string,
    data: T,
    id?: string,
  ): Promise<string> {
    try {
      const docRef = id
        ? doc(getDb(), collectionName, id)
        : doc(collection(getDb(), collectionName));
      const finalData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, finalData);
      return docRef.id;
    } catch (error) {
      logFirestoreError(
        "setDoc",
        error,
        `${collectionName}/${id ?? "(generated)"}`,
      );
      return id || `mock-${Date.now()}`;
    }
  },

  async updateDoc(
    collectionName: string,
    id: string,
    data: Partial<DocumentData>,
  ): Promise<void> {
    try {
      const docRef = doc(getDb(), collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logFirestoreError("updateDoc", error, `${collectionName}/${id}`);
    }
  },

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(getDb(), collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      logFirestoreError("deleteDoc", error, `${collectionName}/${id}`);
    }
  },

  async runTransaction<T>(
    updateFn: (transaction: any) => Promise<T>,
  ): Promise<T> {
    try {
      return await runTransaction(getDb(), updateFn);
    } catch (e) {
      throw e;
    }
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

  // Backwards compatibility for nested legacy calls
  get firestoreService() {
    return {
      collection: (name: string) => ({
        doc: (id: string) => ({
          onSnapshot: (
            callback: (doc: any) => void,
            errorCallback?: (error: any) => void,
          ) => {
            const docRef = doc(getDb(), name, id);
            try {
              return onSnapshot(docRef, callback, errorCallback);
            } catch (error) {
              logFirestoreError("onSnapshot", error, `${name}/${id}`);
              return () => {};
            }
          },
        }),
      }),
    };
  },
  get patientService() {
    return patientService;
  },
  get doctorService() {
    return doctorService;
  },
  get clinicService() {
    return clinicService;
  },
  get appointmentService() {
    return appointmentService;
  },
};

export const clinicService = {
  async getAll(): Promise<Clinic[]> {
    try {
      const clinics = await firestoreService.getDocs<Clinic>(
        COLLECTIONS.CLINICS,
        [orderBy("name")],
      );
      if (clinics.length > 0) return clinics;
    } catch {
      // Fallback
    }
    return INITIAL_CLINICS;
  },

  async getBySpecialization(specialization: string, date?: string): Promise<Clinic[]> {
    try {
      // Get all clinics
      const clinics = await clinicService.getAll();
      if (clinics.length === 0) return [];
      
      // Get doctors for each clinic and check if they have the specialization and availability
      const clinicsWithSpecialization = [];
      for (const clinic of clinics) {
        const doctors = await doctorService.getByClinicAndSpecialization(clinic.id, specialization, date);
        if (doctors.length > 0) {
          clinicsWithSpecialization.push({ ...clinic, availableDoctors: doctors.length });
        }
      }
      return clinicsWithSpecialization;
    } catch {
      // Fallback
    }
    return INITIAL_CLINICS.filter((c) => 
      INITIAL_DOCTORS.some(d => 
        d.clinicIds.includes(c.id) && 
        d.specialization.toLowerCase() === specialization.toLowerCase() && 
        d.status === "active"
      )
    ).map(c => ({ ...c, availableDoctors: 1 }));
  },

  async getById(id: string): Promise<Clinic | null> {
    try {
      const clinic = await firestoreService.getDoc<Clinic>(
        COLLECTIONS.CLINICS,
        id,
      );
      if (clinic) return clinic;
    } catch {
      // Fallback
    }
    return (
      INITIAL_CLINICS.find((c) => c.id === id) || INITIAL_CLINICS[0] || null
    );
  },

  async create(
    clinic: Omit<Clinic, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
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
    try {
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        [orderBy("name")],
      );
      if (doctors.length > 0) return doctors;
    } catch {
      // Fallback
    }
    return INITIAL_DOCTORS;
  },

  async getByClinic(clinicId: string): Promise<Doctor[]> {
    try {
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        [
          where("clinicIds", "array-contains", clinicId),
          where("status", "==", "active"),
          orderBy("name"),
        ],
      );
      if (doctors.length > 0) return doctors;
    } catch {
      // Fallback
    }
    const filtered = INITIAL_DOCTORS.filter(
      (d) => d.clinicIds.includes(clinicId) && d.status === "active",
    );
    return filtered.length > 0 ? filtered : INITIAL_DOCTORS;
  },

  async getById(id: string): Promise<Doctor | null> {
    try {
      const doc = await firestoreService.getDoc<Doctor>(
        COLLECTIONS.DOCTORS,
        id,
      );
      if (doc) return doc;
    } catch {
      // Fallback
    }
    return (
      INITIAL_DOCTORS.find((d) => d.id === id) || INITIAL_DOCTORS[0] || null
    );
  },

  async getByClinicAndSpecialization(
    clinicId: string,
    specialization: string,
    date?: string,
  ): Promise<Doctor[]> {
    try {
      let constraints = [
        where("clinicIds", "array-contains", clinicId),
        where("specialization", "==", specialization),
        where("status", "==", "active"),
        orderBy("name"),
      ];
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        constraints,
      );
      if (doctors.length > 0) {
        if (date) {
          // Filter to only doctors with available slots on that date
          const availableDoctors = [];
          for (const doc of doctors) {
            const slots = await slotService.getAvailableSlots(doc.id, date);
            if (slots.length > 0) {
              availableDoctors.push(doc);
            }
          }
          return availableDoctors;
        }
        return doctors;
      }
    } catch {
      // Fallback
    }
    const filtered = INITIAL_DOCTORS.filter(
      (d) =>
        d.clinicIds.includes(clinicId) &&
        d.specialization.toLowerCase() === specialization.toLowerCase() &&
        d.status === "active",
    );
    return filtered;
  },

  async getAvailableDoctorsByClinicAndDate(
    clinicId: string,
    date: string,
    specialization?: string,
  ): Promise<Doctor[]> {
    try {
      let constraints = [
        where("clinicIds", "array-contains", clinicId),
        where("status", "==", "active"),
        orderBy("name"),
      ];
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        constraints,
      );
      if (doctors.length > 0) {
        let filtered = doctors;
        if (specialization) {
          filtered = doctors.filter(
            (d) => d.specialization.toLowerCase() === specialization.toLowerCase(),
          );
        }
        const availableDoctors = [];
        for (const doc of filtered) {
          const slots = await slotService.getAvailableSlots(doc.id, date);
          if (slots.length > 0) {
            availableDoctors.push(doc);
          }
        }
        return availableDoctors;
      }
    } catch {
      // Fallback
    }
    let filtered = INITIAL_DOCTORS.filter(
      (d) => d.clinicIds.includes(clinicId) && d.status === "active",
    );
    if (specialization) {
      filtered = filtered.filter(
        (d) => d.specialization.toLowerCase() === specialization.toLowerCase(),
      );
    }
    return filtered;
  },

  async getByUserId(userId: string): Promise<Doctor | null> {
    try {
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        [where("userId", "==", userId), limit(1)],
      );
      if (doctors.length > 0) return doctors[0];
    } catch {
      // Fallback
    }
    return (
      INITIAL_DOCTORS.find((d) => d.userId === userId || d.id === userId) ||
      INITIAL_DOCTORS[0] ||
      null
    );
  },

  async getAllSpecializations(): Promise<string[]> {
    try {
      const doctors = await firestoreService.getDocs<Doctor>(
        COLLECTIONS.DOCTORS,
        [where("status", "==", "active")],
      );
      if (doctors.length > 0) {
        const specializations = [...new Set(doctors.map((d) => d.specialization))];
        return specializations.sort();
      }
    } catch {
      // Fallback
    }
    return [...new Set(INITIAL_DOCTORS.filter(d => d.status === "active").map((d) => d.specialization))].sort();
  },

  async create(
    doctor: Omit<Doctor, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
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
    try {
      const patients = await firestoreService.getDocs<Patient>(
        COLLECTIONS.PATIENTS,
        [where("userId", "==", userId), limit(1)],
      );
      if (patients.length > 0) return patients[0];
    } catch {
      // Fallback
    }
    return (
      INITIAL_PATIENTS.find((p) => p.userId === userId || p.id === userId) ||
      INITIAL_PATIENTS[0] ||
      null
    );
  },

  async getById(id: string): Promise<Patient | null> {
    try {
      const patient = await firestoreService.getDoc<Patient>(
        COLLECTIONS.PATIENTS,
        id,
      );
      if (patient) return patient;
    } catch {
      // Fallback
    }
    return (
      INITIAL_PATIENTS.find((p) => p.id === id) || INITIAL_PATIENTS[0] || null
    );
  },

  async create(
    patient: Omit<Patient, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.PATIENTS, patient as any);
  },

  async update(id: string, data: Partial<Patient>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.PATIENTS, id, data);
  },
};

export const appointmentService = {
  async getByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const appts = await firestoreService.getDocs<Appointment>(
        COLLECTIONS.APPOINTMENTS,
        [
          where("patientId", "==", patientId),
          orderBy("scheduledStart", "desc"),
        ],
      );
      if (appts.length > 0) return appts;
    } catch {
      // Fallback
    }
    const filtered = localAppointments.filter((a) => a.patientId === patientId);
    return filtered.length > 0 ? filtered : localAppointments;
  },

  async getByDoctor(doctorId: string, date?: string): Promise<Appointment[]> {
    try {
      const constraints = [
        where("doctorId", "==", doctorId),
        orderBy("scheduledStart"),
      ];
      if (date) {
        constraints.unshift(
          where("scheduledStart", ">=", new Date(date + "T00:00:00")),
        );
        constraints.unshift(
          where("scheduledStart", "<=", new Date(date + "T23:59:59")),
        );
      }
      const appts = await firestoreService.getDocs<Appointment>(
        COLLECTIONS.APPOINTMENTS,
        constraints,
      );
      if (appts.length > 0) return appts;
    } catch {
      // Fallback
    }
    return localAppointments.filter(
      (a) => a.doctorId === doctorId || !doctorId,
    );
  },

  async getByClinicAndDate(
    clinicId: string,
    date: string,
  ): Promise<Appointment[]> {
    try {
      const startOfDay = new Date(date + "T00:00:00");
      const endOfDay = new Date(date + "T23:59:59");
      const appts = await firestoreService.getDocs<Appointment>(
        COLLECTIONS.APPOINTMENTS,
        [
          where("clinicId", "==", clinicId),
          where("scheduledStart", ">=", startOfDay),
          where("scheduledStart", "<=", endOfDay),
          where("status", "in", ["booked", "checked_in", "in_progress"]),
          orderBy("scheduledStart"),
        ],
      );
      if (appts.length > 0) return appts;
    } catch {
      // Fallback
    }
    return localAppointments.filter(
      (a) => a.clinicId === clinicId || !clinicId,
    );
  },

  async getByClinicAndDateRange(
    clinicId: string,
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    try {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      const appts = await firestoreService.getDocs<Appointment>(
        COLLECTIONS.APPOINTMENTS,
        [
          where("clinicId", "==", clinicId),
          where("scheduledStart", ">=", start),
          where("scheduledStart", "<=", end),
          orderBy("scheduledStart"),
        ],
      );
      if (appts.length > 0) return appts;
    } catch {
      // Fallback
    }
    return localAppointments;
  },

  async getById(id: string): Promise<Appointment | null> {
    try {
      const appt = await firestoreService.getDoc<Appointment>(
        COLLECTIONS.APPOINTMENTS,
        id,
      );
      if (appt) return appt;
    } catch {
      // Fallback
    }
    return (
      localAppointments.find((a) => a.id === id) || localAppointments[0] || null
    );
  },

  async create(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const id = `appt-${Date.now()}`;
    const newAppt: Appointment = {
      ...appointment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localAppointments = [newAppt, ...localAppointments];
    try {
      await firestoreService.setDoc(COLLECTIONS.APPOINTMENTS, newAppt, id);
    } catch {
      // Ignore
    }
    return id;
  },

  async update(id: string, data: Partial<Appointment>): Promise<void> {
    localAppointments = localAppointments.map((a) =>
      a.id === id ? { ...a, ...data, updatedAt: new Date() } : a,
    );
    try {
      await firestoreService.updateDoc(COLLECTIONS.APPOINTMENTS, id, data);
    } catch {
      // Ignore
    }
  },

  async bookWithTransaction(
    slotId: string,
    appointmentData: Omit<
      Appointment,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "tokenNumber"
      | "queuePosition"
      | "estimatedWaitMinutes"
    >,
  ): Promise<{ appointmentId: string; tokenNumber: number }> {
    const scheduledStart = toDate(appointmentData.scheduledStart);
    const scheduledEnd = toDate(appointmentData.scheduledEnd);
    if (!scheduledStart || !scheduledEnd || scheduledEnd <= scheduledStart) {
      throw new Error("Invalid appointment time");
    }

    const startMs = scheduledStart.getTime();
    const endMs = scheduledEnd.getTime();

    const localSlot = localSlots.find((slot) => slot.id === slotId);
    if (localSlot && (localSlot.isBooked || localSlot.isBlocked)) {
      throw new Error("That slot was just booked. Please choose another time.");
    }

    const hasLocalConflict = localAppointments.some(
      (appt) =>
        appt.doctorId === appointmentData.doctorId &&
        hasTimeConflict(appt, startMs, endMs),
    );
    if (hasLocalConflict) {
      throw new Error(
        "That time is already booked. Please choose another slot.",
      );
    }

    // Re-check persisted data for real auth sessions. Demo reads are denied and
    // resolve to empty results, leaving the local guards above in charge.
    const persistedSlot = await firestoreService.getDoc<Slot>(
      COLLECTIONS.SLOTS,
      slotId,
    );
    if (persistedSlot && (persistedSlot.isBooked || persistedSlot.isBlocked)) {
      throw new Error("That slot was just booked. Please choose another time.");
    }

    const dayStart = new Date(scheduledStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledStart);
    dayEnd.setHours(23, 59, 59, 999);
    const persistedAppointments = await firestoreService.getDocs<Appointment>(
      COLLECTIONS.APPOINTMENTS,
      [
        where("doctorId", "==", appointmentData.doctorId),
        where("scheduledStart", ">=", dayStart),
        where("scheduledStart", "<=", dayEnd),
      ],
    );
    if (
      persistedAppointments.some((appt) =>
        hasTimeConflict(appt, startMs, endMs),
      )
    ) {
      throw new Error(
        "That time is already booked. Please choose another slot.",
      );
    }

    const tokenNumber = Math.floor(Math.random() * 20) + 15;
    const appointmentId = `appt-${Date.now()}`;
    const newAppointment: Appointment = {
      ...appointmentData,
      id: appointmentId,
      tokenNumber,
      queuePosition: tokenNumber - 10,
      estimatedWaitMinutes: (tokenNumber - 10) * 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    localAppointments = [newAppointment, ...localAppointments];

    // Mark slot booked in localSlots
    localSlots = localSlots.map((s) =>
      s.id === slotId ? { ...s, isBooked: true, appointmentId } : s,
    );

    try {
      await firestoreService.setDoc(
        COLLECTIONS.APPOINTMENTS,
        newAppointment,
        appointmentId,
      );
      await firestoreService.updateDoc(COLLECTIONS.SLOTS, slotId, {
        isBooked: true,
        appointmentId,
      });
    } catch {
      // Handled locally
    }

    return { appointmentId, tokenNumber };
  },
};

export const slotService = {
  async getAvailableSlots(doctorId: string, date: string): Promise<Slot[]> {
    try {
      const slots = await firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
        where("doctorId", "==", doctorId),
        where("date", "==", date),
        where("isBooked", "==", false),
        where("isBlocked", "==", false),
        orderBy("startTime"),
      ]);
      if (slots.length > 0) return slots;
    } catch {
      // Fallback
    }

    const doctor =
      INITIAL_DOCTORS.find((d) => d.id === doctorId) || INITIAL_DOCTORS[0];
    return materializeSlotsForDay(doctor, doctor.clinicIds[0], date).filter(
      (slot) => !slot.isBooked && !slot.isBlocked,
    );
  },

  async getByDoctorAndDate(doctorId: string, date: string): Promise<Slot[]> {
    try {
      const slots = await firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
        where("doctorId", "==", doctorId),
        where("date", "==", date),
        orderBy("startTime"),
      ]);
      if (slots.length > 0) return slots;
    } catch {
      // Fallback
    }

    const doctor =
      INITIAL_DOCTORS.find((d) => d.id === doctorId) || INITIAL_DOCTORS[0];
    return materializeSlotsForDay(doctor, doctor.clinicIds[0], date);
  },

  async getByClinicAndDate(clinicId: string, date: string): Promise<Slot[]> {
    try {
      const slots = await firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
        where("clinicId", "==", clinicId),
        where("date", "==", date),
        orderBy("startTime"),
      ]);
      if (slots.length > 0) return slots;
    } catch {
      // Fallback
    }
    const doctor = INITIAL_DOCTORS[0];
    return generateSlotsForDate(doctor, clinicId, date);
  },

  async create(
    slot: Omit<Slot, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    return firestoreService.setDoc(COLLECTIONS.SLOTS, slot as any);
  },

  async update(id: string, data: Partial<Slot>): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.SLOTS, id, data);
  },

  async blockSlot(slotId: string, blocked: boolean): Promise<void> {
    // Keep the in-memory copy in sync first: unauthenticated demo sessions
    // cannot write to Firestore, but the schedule must still react.
    localSlots = localSlots.map((slot) =>
      slot.id === slotId
        ? { ...slot, isBlocked: blocked, updatedAt: new Date() }
        : slot,
    );
    await firestoreService.updateDoc(COLLECTIONS.SLOTS, slotId, {
      isBlocked: blocked,
    });
  },

  async delete(slotId: string): Promise<void> {
    localSlots = localSlots.filter((slot) => slot.id !== slotId);
    await firestoreService.deleteDoc(COLLECTIONS.SLOTS, slotId);
  },

  async generateSlotsForDoctor(
    doctorId: string,
    clinicId: string,
    date: string,
    workingHours: { start: string; end: string; slotDuration: number },
  ): Promise<string[]> {
    const duration = Math.max(5, Number(workingHours.slotDuration) || 15);
    const [startHour, startMinute] = workingHours.start.split(":").map(Number);
    const [endHour, endMinute] = workingHours.end.split(":").map(Number);

    const day = new Date(`${date}T00:00:00`);
    const rangeStart = new Date(day);
    rangeStart.setHours(startHour || 0, startMinute || 0, 0, 0);
    const rangeEnd = new Date(day);
    rangeEnd.setHours(endHour || 0, endMinute || 0, 0, 0);

    if (rangeEnd <= rangeStart) {
      throw new Error("End time must be after start time");
    }

    // Skip ids that already exist so regenerating a day never overwrites a
    // booked or blocked slot.
    const existing = await firestoreService.getDocs<Slot>(COLLECTIONS.SLOTS, [
      where("doctorId", "==", doctorId),
      where("date", "==", date),
    ]);
    // Booked/blocked slots must not be overlapped by freshly generated ones.
    const protectedSlots = [
      ...existing.filter((slot) => slot.isBooked || slot.isBlocked),
      ...localSlots.filter(
        (slot) =>
          slot.doctorId === doctorId &&
          slot.date === date &&
          (slot.isBooked || slot.isBlocked),
      ),
    ];

    const writes: Array<{ id: string; data: Record<string, unknown> }> = [];
    const generated: Slot[] = [];

    for (
      let cursor = rangeStart.getTime();
      cursor + duration * 60000 <= rangeEnd.getTime();
      cursor += duration * 60000
    ) {
      const startTime = new Date(cursor);
      const endTime = new Date(cursor + duration * 60000);

      const overlapsProtected = protectedSlots.some((protectedSlot) => {
        const protectedStart = toDate(protectedSlot.startTime)?.getTime();
        const protectedEnd = toDate(protectedSlot.endTime)?.getTime();
        if (protectedStart === undefined || protectedEnd === undefined) {
          return false;
        }
        return (
          startTime.getTime() < protectedEnd &&
          endTime.getTime() > protectedStart
        );
      });
      if (overlapsProtected) continue;

      // Time-based ids stay stable for a given start time, so regenerating
      // with another duration never collides with an unrelated slot.
      const id = `slot-${doctorId}-${date}-${startTime.getTime()}`;
      if (protectedSlots.some((slot) => slot.id === id)) continue;

      writes.push({
        id,
        data: {
          doctorId,
          clinicId,
          date,
          startTime: toTimestamp(startTime),
          endTime: toTimestamp(endTime),
          durationMinutes: duration,
          isBooked: false,
          isBlocked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });

      generated.push({
        id,
        doctorId,
        clinicId,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        isBooked: false,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Mark the day as materialised so later reads reuse this exact set instead
    // of falling back to the demo defaults.
    materializedSlotDays.add(slotDayKey(doctorId, date));
    // Regenerating a day replaces the unused demo slots so a new duration does
    // not overlap the defaults; booked and blocked slots are preserved.
    localSlots = localSlots.filter(
      (slot) =>
        slot.doctorId !== doctorId ||
        slot.date !== date ||
        slot.isBooked ||
        slot.isBlocked,
    );
    for (const slot of generated) {
      const existingIndex = localSlots.findIndex(
        (local) => local.id === slot.id,
      );
      if (existingIndex === -1) {
        localSlots.push(slot);
      } else if (
        !localSlots[existingIndex].isBooked &&
        !localSlots[existingIndex].isBlocked
      ) {
        localSlots[existingIndex] = slot;
      }
    }

    // Firestore batches are capped at 500 writes.
    try {
      const unusedRemoteSlots = existing.filter(
        (slot) => !slot.isBooked && !slot.isBlocked,
      );
      if (unusedRemoteSlots.length > 0) {
        const deleteBatch = firestoreService.batch();
        for (const slot of unusedRemoteSlots) {
          deleteBatch.delete(
            firestoreService.docRef(COLLECTIONS.SLOTS, slot.id),
          );
        }
        await deleteBatch.commit();
      }
      for (let offset = 0; offset < writes.length; offset += 450) {
        const batch = firestoreService.batch();
        for (const write of writes.slice(offset, offset + 450)) {
          batch.set(
            firestoreService.docRef(COLLECTIONS.SLOTS, write.id),
            write.data,
          );
        }
        await batch.commit();
      }
    } catch (error) {
      // Unauthenticated demo sessions cannot write; keep the slots in memory so
      // the schedule still reflects what was generated.
      logFirestoreError("generateSlotsForDoctor", error, `${doctorId}/${date}`);
      for (const slot of generated) {
        if (!localSlots.some((local) => local.id === slot.id)) {
          localSlots.push(slot);
        }
      }
    }

    return writes.map((write) => write.id);
  },
};

export const notificationService = {
  async getByUser(userId: string, limitCount = 50): Promise<Notification[]> {
    try {
      const notifs = await firestoreService.getDocs<Notification>(
        COLLECTIONS.NOTIFICATIONS,
        [
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(limitCount),
        ],
      );
      if (notifs.length > 0) return notifs;
    } catch {
      // Fallback
    }
    return [
      {
        id: "notif-1",
        userId,
        type: "queue_update",
        title: "Queue Moving Promptly",
        body: "Dr. Sarah Jenkins is now seeing token #12. Estimated wait: 15 mins.",
        read: false,
        createdAt: new Date(),
      },
      {
        id: "notif-2",
        userId,
        type: "appointment_booked",
        title: "Appointment Confirmed",
        body: "Your consultation with Dr. Marcus Vance is scheduled for tomorrow at 2:00 PM.",
        read: true,
        createdAt: new Date(Date.now() - 3600000),
      },
    ];
  },

  async create(
    notification: Omit<Notification, "id" | "createdAt">,
  ): Promise<string> {
    return firestoreService.setDoc(
      COLLECTIONS.NOTIFICATIONS,
      notification as any,
    );
  },

  async markAsRead(id: string): Promise<void> {
    return firestoreService.updateDoc(COLLECTIONS.NOTIFICATIONS, id, {
      read: true,
    });
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await firestoreService.getDocs<Notification>(
        COLLECTIONS.NOTIFICATIONS,
        [where("userId", "==", userId), where("read", "==", false)],
      );

      const batch = firestoreService.batch();
      notifications.forEach((n) => {
        batch.update(doc(getDb(), COLLECTIONS.NOTIFICATIONS, n.id), {
          read: true,
        });
      });
      await batch.commit();
    } catch (error) {
      logFirestoreError("markAllAsRead", error, userId);
    }
  },
};

export { toDate, toTimestamp };
