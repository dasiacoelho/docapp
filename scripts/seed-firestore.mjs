#!/usr/bin/env node
/**
 * Seeds the Firestore project with the same demo catalogue the app falls back
 * to in src/services/mockData.ts, so pages read real documents instead of
 * silently switching to mock data.
 *
 * Every document uses a deterministic id, so the script is idempotent: running
 * it again overwrites the demo records and never deletes anything else.
 *
 * Usage
 *   node scripts/seed-firestore.mjs --dry-run      # show what would be written
 *   npm i -D firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
 *     node scripts/seed-firestore.mjs
 *
 * Without GOOGLE_APPLICATION_CREDENTIALS the Admin SDK falls back to
 * application default credentials (gcloud auth application-default login).
 * When firebase-admin or credentials are unavailable, the script falls back to
 * the Firestore REST API using the token from `firebase login`.
 */
import { readFileSync } from "node:fs";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "docapp-e64d9";
const DRY_RUN = process.argv.includes("--dry-run");
const DAYS_OF_SLOTS = 7;

const CLINICS = [
  {
    id: "clinic-1",
    name: "City General Health & Polyclinic",
    address: "450 Wellness Blvd, Medical District, Suite 100",
    phone: "+1 (555) 234-5678",
    timezone: "America/New_York",
    settings: {
      tokenPrefix: "CG",
      slotDurationDefault: 20,
      maxAdvanceBookingDays: 30,
      allowWalkIns: true,
    },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "clinic-2",
    name: "St. Jude Specialist Health Pavilion",
    address: "820 West End Ave, Pavilion Center, Floor 4",
    phone: "+1 (555) 876-5432",
    timezone: "America/New_York",
    settings: {
      tokenPrefix: "SJ",
      slotDurationDefault: 30,
      maxAdvanceBookingDays: 60,
      allowWalkIns: false,
    },
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
  },
  {
    id: "clinic-3",
    name: "Apex Care Cardiology & Wellness Hub",
    address: "108 Riverside Parkway, Suite 250",
    phone: "+1 (555) 432-1098",
    timezone: "America/New_York",
    settings: {
      tokenPrefix: "AC",
      slotDurationDefault: 15,
      maxAdvanceBookingDays: 14,
      allowWalkIns: true,
    },
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
];

const DOCTORS = [
  {
    id: "doctor-1",
    userId: "demo-doctor-1",
    clinicIds: ["clinic-1", "clinic-2"],
    name: "Dr. Sarah Jenkins, MD",
    specialization: "Cardiology",
    role: "doctor",
    email: "dr.sarah@docapp.health",
    phone: "+1 (555) 301-8842",
    qualification: "MD, FACC - Harvard Medical School",
    experienceYears: 14,
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&auto=format&fit=crop&q=80",
    status: "active",
    workingHours: {
      mon: { dayOfWeek: 1, start: "09:00", end: "17:00", slotDuration: 20 },
      tue: { dayOfWeek: 2, start: "09:00", end: "17:00", slotDuration: 20 },
      wed: { dayOfWeek: 3, start: "09:00", end: "17:00", slotDuration: 20 },
      thu: { dayOfWeek: 4, start: "09:00", end: "17:00", slotDuration: 20 },
      fri: { dayOfWeek: 5, start: "09:00", end: "15:00", slotDuration: 20 },
    },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "doctor-2",
    userId: "demo-doctor-2",
    clinicIds: ["clinic-1", "clinic-3"],
    name: "Dr. Marcus Vance, MD",
    specialization: "Neurology & Surgery",
    role: "doctor",
    email: "dr.marcus@docapp.health",
    phone: "+1 (555) 302-9951",
    qualification: "MD, PhD - Johns Hopkins University",
    experienceYears: 18,
    photoUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250&auto=format&fit=crop&q=80",
    status: "active",
    workingHours: {
      mon: { dayOfWeek: 1, start: "08:30", end: "16:30", slotDuration: 30 },
      wed: { dayOfWeek: 3, start: "08:30", end: "16:30", slotDuration: 30 },
      fri: { dayOfWeek: 5, start: "08:30", end: "14:00", slotDuration: 30 },
    },
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
  {
    id: "doctor-3",
    userId: "demo-doctor-3",
    clinicIds: ["clinic-1", "clinic-2", "clinic-3"],
    name: "Dr. Priya Sharma, MD",
    specialization: "Pediatrics & Adolescent Care",
    role: "doctor",
    email: "dr.priya@docapp.health",
    phone: "+1 (555) 303-6612",
    qualification: "MD, FAAP - Stanford University",
    experienceYears: 11,
    photoUrl:
      "https://images.unsplash.com/photo-1594824813511-209214749f7b?w=250&auto=format&fit=crop&q=80",
    status: "active",
    workingHours: {
      mon: { dayOfWeek: 1, start: "10:00", end: "18:00", slotDuration: 20 },
      tue: { dayOfWeek: 2, start: "10:00", end: "18:00", slotDuration: 20 },
      thu: { dayOfWeek: 4, start: "10:00", end: "18:00", slotDuration: 20 },
    },
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
  },
  {
    id: "doctor-4",
    userId: "demo-doctor-4",
    clinicIds: ["clinic-2"],
    name: "Dr. Robert Rodriguez, MD",
    specialization: "Orthopedics & Sports Rehab",
    role: "doctor",
    email: "dr.robert@docapp.health",
    phone: "+1 (555) 304-7723",
    qualification: "MD, FAAOS - Mayo Clinic College of Medicine",
    experienceYears: 15,
    photoUrl:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250&auto=format&fit=crop&q=80",
    status: "active",
    workingHours: {
      tue: { dayOfWeek: 2, start: "09:00", end: "16:00", slotDuration: 20 },
      thu: { dayOfWeek: 4, start: "09:00", end: "16:00", slotDuration: 20 },
    },
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
  },
  {
    id: "doctor-5",
    userId: "demo-doctor-5",
    clinicIds: ["clinic-1", "clinic-3"],
    name: "Dr. Emily Chen, DO",
    specialization: "Family Medicine & Preventive Care",
    role: "doctor",
    email: "dr.emily@docapp.health",
    phone: "+1 (555) 305-1190",
    qualification: "DO, FAAFP - Columbia University",
    experienceYears: 9,
    photoUrl:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&auto=format&fit=crop&q=80",
    status: "active",
    workingHours: {
      mon: { dayOfWeek: 1, start: "08:00", end: "16:00", slotDuration: 15 },
      tue: { dayOfWeek: 2, start: "08:00", end: "16:00", slotDuration: 15 },
      wed: { dayOfWeek: 3, start: "08:00", end: "16:00", slotDuration: 15 },
      thu: { dayOfWeek: 4, start: "08:00", end: "16:00", slotDuration: 15 },
      fri: { dayOfWeek: 5, start: "08:00", end: "13:00", slotDuration: 15 },
    },
    createdAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-05"),
  },
];

const PATIENTS = [
  {
    id: "patient-1",
    userId: "demo-patient-1",
    name: "Jane Doe",
    phone: "+1 (555) 901-2345",
    email: "patient.demo@docapp.health",
    dateOfBirth: new Date("1992-05-14"),
    gender: "female",
    preferredClinicIds: ["clinic-1", "clinic-2"],
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "patient-2",
    userId: "demo-patient-2",
    name: "Michael Chang",
    phone: "+1 (555) 902-3456",
    email: "m.chang@example.com",
    dateOfBirth: new Date("1985-09-21"),
    gender: "male",
    preferredClinicIds: ["clinic-1"],
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
  {
    id: "patient-3",
    userId: "demo-patient-3",
    name: "Sophia Patel",
    phone: "+1 (555) 903-4567",
    email: "sophia.p@example.com",
    dateOfBirth: new Date("1998-11-03"),
    gender: "female",
    preferredClinicIds: ["clinic-1", "clinic-3"],
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
  },
  {
    id: "patient-4",
    userId: "demo-patient-4",
    name: "David Miller",
    phone: "+1 (555) 904-5678",
    email: "dmiller@example.com",
    dateOfBirth: new Date("1976-03-30"),
    gender: "male",
    preferredClinicIds: ["clinic-2"],
    createdAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-04"),
  },
];

const SLOT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function atTime(day, hours, minutes) {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

function buildSlots(doctor, day) {
  const dateStr = isoDate(day);
  const clinicId = doctor.clinicIds[0];
  return SLOT_TIMES.map((time, index) => {
    const [hours, minutes] = time.split(":").map(Number);
    const startTime = atTime(day, hours, minutes);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
    return {
      collection: "slots",
      id: `slot-${doctor.id}-${dateStr}-${index}`,
      data: {
        doctorId: doctor.id,
        clinicId,
        date: dateStr,
        startTime,
        endTime,
        durationMinutes: 30,
        isBooked: index === 1 || index === 4,
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  });
}

function buildAppointments() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const make = (hours, minutes, day = now) => {
    const start = atTime(day, hours, minutes);
    return { start, end: new Date(start.getTime() + 30 * 60 * 1000) };
  };
  const first = make(9, 30);
  const second = make(10, 0);
  const third = make(11, 30);
  const fourth = make(14, 0, tomorrow);

  return [
    {
      id: "appt-1",
      patientId: "patient-1",
      doctorId: "doctor-1",
      clinicId: "clinic-1",
      appointmentType: "consultation",
      scheduledStart: first.start,
      scheduledEnd: first.end,
      actualStart: first.start,
      status: "in_progress",
      tokenNumber: 12,
      queuePosition: 1,
      estimatedWaitMinutes: 5,
      notes:
        "Routine cardiovascular wellness checkup and blood pressure assessment.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "appt-2",
      patientId: "patient-2",
      doctorId: "doctor-1",
      clinicId: "clinic-1",
      appointmentType: "followup",
      scheduledStart: second.start,
      scheduledEnd: second.end,
      status: "checked_in",
      tokenNumber: 13,
      queuePosition: 2,
      estimatedWaitMinutes: 20,
      notes: "Post-medication ECG review.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "appt-3",
      patientId: "patient-3",
      doctorId: "doctor-1",
      clinicId: "clinic-1",
      appointmentType: "consultation",
      scheduledStart: third.start,
      scheduledEnd: third.end,
      status: "booked",
      tokenNumber: 14,
      queuePosition: 3,
      estimatedWaitMinutes: 45,
      notes: "Consultation for mild chest tightness during morning exercise.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "appt-4",
      patientId: "patient-1",
      doctorId: "doctor-2",
      clinicId: "clinic-1",
      appointmentType: "consultation",
      scheduledStart: fourth.start,
      scheduledEnd: fourth.end,
      status: "booked",
      tokenNumber: 4,
      queuePosition: 4,
      estimatedWaitMinutes: 60,
      notes: "Migraine consultation with Dr. Vance.",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

function buildDocuments() {
  const documents = [
    ...CLINICS.map(({ id, ...data }) => ({ collection: "clinics", id, data })),
    ...DOCTORS.map(({ id, ...data }) => ({ collection: "doctors", id, data })),
    ...PATIENTS.map(({ id, ...data }) => ({
      collection: "patients",
      id,
      data,
    })),
    ...buildAppointments().map(({ id, ...data }) => ({
      collection: "appointments",
      id,
      data,
    })),
  ];

  const today = new Date();
  for (let offset = 0; offset < DAYS_OF_SLOTS; offset += 1) {
    const day = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    for (const doctor of DOCTORS) {
      documents.push(...buildSlots(doctor, day));
    }
  }

  return documents;
}

async function loadAdminSdk() {
  try {
    const app = await import("firebase-admin/app");
    const firestore = await import("firebase-admin/firestore");
    return { ...app, getFirestore: firestore.getFirestore };
  } catch {
    return null;
  }
}

const documents = buildDocuments();
const counts = documents.reduce((acc, entry) => {
  acc[entry.collection] = (acc[entry.collection] || 0) + 1;
  return acc;
}, {});

if (DRY_RUN) {
  console.log(`Would write ${documents.length} documents to ${PROJECT_ID}:`);
  for (const [collection, count] of Object.entries(counts)) {
    console.log(`  ${collection.padEnd(14)} ${count}`);
  }
  process.exit(0);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    return { mapValue: { fields: toFirestoreFields(value) } };
  }
  throw new Error(`Unsupported value type: ${typeof value}`);
}

function toFirestoreFields(object) {
  return Object.fromEntries(
    Object.entries(object)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)]),
  );
}

function readCliAccessToken() {
  const configPath = `${process.env.HOME}/.config/configstore/firebase-tools.json`;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    const { access_token: accessToken, expires_at: expiresAt } =
      config.tokens || {};
    if (!accessToken || !expiresAt || expiresAt <= Date.now()) {
      return null;
    }
    return accessToken;
  } catch {
    return null;
  }
}

async function seedWithRest(entries) {
  const accessToken = readCliAccessToken();
  if (!accessToken) {
    console.error(
      "No Firestore credentials found. Either install firebase-admin and set\n" +
        "GOOGLE_APPLICATION_CREDENTIALS, or run `firebase login` first.\n",
    );
    process.exit(1);
  }

  const queue = [...entries];
  let written = 0;

  const worker = async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      const path = `projects/${PROJECT_ID}/databases/(default)/documents/${entry.collection}/${encodeURIComponent(entry.id)}`;
      const response = await fetch(
        `https://firestore.googleapis.com/v1/${path}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: toFirestoreFields(entry.data) }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to write ${entry.collection}/${entry.id}: ${response.status} ${await response.text()}`,
        );
      }
      written += 1;
      if (written % 50 === 0) {
        console.log(`  ${written}/${entries.length} documents written`);
      }
    }
  };

  await Promise.all(Array.from({ length: 8 }, worker));
  return written;
}

let written = 0;
const admin = await loadAdminSdk();

if (admin) {
  try {
    const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? admin.cert(
          JSON.parse(
            readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"),
          ),
        )
      : admin.applicationDefault();

    const db = admin.getFirestore(
      admin.initializeApp({ credential, projectId: PROJECT_ID }),
    );

    let batch = db.batch();
    let pending = 0;

    for (const entry of documents) {
      batch.set(db.collection(entry.collection).doc(entry.id), entry.data, {
        merge: true,
      });
      pending += 1;
      written += 1;

      if (pending === 400) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.warn(
      `Admin SDK write failed (${error.message}); falling back to Firestore REST.`,
    );
    written = await seedWithRest(documents);
  }
} else {
  console.log(
    "firebase-admin not installed; using Firestore REST with the CLI token.",
  );
  written = await seedWithRest(documents);
}

console.log(`Wrote ${written} documents to ${PROJECT_ID}:`);
for (const [collection, count] of Object.entries(counts)) {
  console.log(`  ${collection.padEnd(14)} ${count}`);
}
