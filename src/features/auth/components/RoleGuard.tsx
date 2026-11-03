import React, { useEffect } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks";
import type { Role } from "../../../types";

interface RoleGuardProps {
  children?: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

// A user is always sent to their own portal, never to another role's portal.
// That is what used to make admins bounce between /patient and /doctor forever.
export const ROLE_HOME: Record<Role, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #1976d2",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function SwitchingRoleScreen({ role }: { role: Role }) {
  const { switchRole } = useAuth();

  useEffect(() => {
    switchRole(role);
    // switchRole comes from context and is stable for the life of the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return <LoadingScreen />;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath,
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Demo accounts follow the URL: opening a patient-only deep link while the
    // demo switcher happens to be on "doctor" should show that page instead of
    // silently bouncing to the doctor dashboard. Real accounts are still sent
    // to their own portal.
    if (
      !fallbackPath &&
      user.uid.startsWith("demo-") &&
      allowedRoles.length === 1
    ) {
      return <SwitchingRoleScreen role={allowedRoles[0]} />;
    }

    return <Navigate to={fallbackPath ?? ROLE_HOME[user.role]} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}

export function PatientGuard({ children }: { children?: React.ReactNode }) {
  return <RoleGuard allowedRoles={["patient"]}>{children}</RoleGuard>;
}

export function DoctorGuard({ children }: { children?: React.ReactNode }) {
  return <RoleGuard allowedRoles={["doctor"]}>{children}</RoleGuard>;
}

export function AdminGuard({ children }: { children?: React.ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}

/** Landing route for "/" and unknown paths: resolves the portal from the session. */
export function RoleHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
