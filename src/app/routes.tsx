import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "../features/auth/hooks";
import {
  PatientGuard,
  DoctorGuard,
  AdminGuard,
  AuthGuard,
  RoleHome,
} from "../features/auth/components/RoleGuard";
import { PatientDashboard } from "../features/patient/pages/PatientDashboard";
import { BookingPage } from "../features/patient/pages/BookingPage";
import { BookingPickerPage } from "../features/patient/pages/BookingPickerPage";
import { QueuePage } from "../features/patient/pages/QueuePage";
import { HistoryPage } from "../features/patient/pages/HistoryPage";
import { DoctorDashboard } from "../features/doctor/pages/DoctorDashboard";
import { SchedulePage } from "../features/doctor/pages/SchedulePage";
import { DoctorQueuePage } from "../features/doctor/pages/QueuePage";
import { AdminDashboard } from "../features/admin/pages/AdminDashboard";
import { ClinicsPage } from "../features/admin/pages/ClinicsPage";
import { DoctorsPage } from "../features/admin/pages/DoctorsPage";
import { AnalyticsPage } from "../features/admin/pages/AnalyticsPage";
import { Login } from "../features/auth/components/Login";
import { Register } from "../features/auth/components/Register";
import { Layout } from "./layout";

export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<RoleHome />} />

          <Route element={<PatientGuard />}>
            <Route index element={<BookingPickerPage />} />
            <Route path="patient" element={<BookingPickerPage />} />
            <Route path="patient/booking" element={<BookingPickerPage />} />
            <Route path="patient/booking/:doctorId" element={<BookingPage />} />
            <Route path="patient/queue" element={<QueuePage />} />
            <Route
              path="patient/queue/:appointmentId"
              element={<QueuePage />}
            />
            <Route path="patient/history" element={<HistoryPage />} />
          </Route>

          <Route element={<DoctorGuard />}>
            <Route path="doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="doctor/schedule" element={<SchedulePage />} />
            <Route path="doctor/queue" element={<DoctorQueuePage />} />
          </Route>

          <Route element={<AdminGuard />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/clinics" element={<ClinicsPage />} />
            <Route path="admin/doctors" element={<DoctorsPage />} />
            <Route path="admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<RoleHome />} />
      </Routes>
    </AuthProvider>
  );
}
