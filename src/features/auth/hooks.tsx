import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  IdTokenResult,
} from "firebase/auth";
import { getFirebaseAuth, getFirestoreDb } from "../../services/firebase";
import {
  firestoreService,
  doctorService,
  patientService,
  COLLECTIONS,
} from "../../services/firestore";
import type { User, Role, Doctor, Patient } from "../../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: Role) => void;
  switchRole: (role: Role) => void;
  register: (
    email: string,
    password: string,
    displayName: string,
    role: Role,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  getIdTokenResult: () => Promise<IdTokenResult | null>;
}

const DEMO_ACCOUNTS: Record<Role, User> = {
  patient: {
    uid: "demo-patient-1",
    email: "patient.demo@docapp.health",
    displayName: "Jane Doe",
    role: "patient",
    photoURL:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  doctor: {
    uid: "demo-doctor-1",
    email: "dr.sarah@docapp.health",
    displayName: "Dr. Sarah Jenkins, MD",
    role: "doctor",
    photoURL:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
  },
  admin: {
    uid: "demo-admin-1",
    email: "admin@docapp.health",
    displayName: "Dr. Marcus Rivera (Director)",
    role: "admin",
    photoURL:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("docapp_demo_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(
    async (firebaseUser: FirebaseUser): Promise<User> => {
      let role: Role | null = null;
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        role = (tokenResult.claims.role as Role) || null;
      } catch {
        // Ignore
      }

      // No custom claim: derive the role from the profile documents, which are
      // keyed by uid (see register below) so these lookups are direct gets.
      if (!role) {
        const adminDoc = await firestoreService.getDoc(
          COLLECTIONS.ADMINS,
          firebaseUser.uid,
        );
        if (adminDoc) {
          role = "admin";
        } else {
          const doctorDoc = await firestoreService.getDoc(
            COLLECTIONS.DOCTORS,
            firebaseUser.uid,
          );
          role = doctorDoc ? "doctor" : "patient";
        }
      }

      let name = firebaseUser.displayName || "";
      let photoUrl = firebaseUser.photoURL || undefined;

      if (role === "doctor") {
        try {
          const profile = await doctorService.getByUserId(firebaseUser.uid);
          if (profile) {
            name = profile.name;
            photoUrl = profile.photoUrl;
          }
        } catch {
          // Ignore
        }
      } else if (role === "patient") {
        try {
          const profile = await patientService.getByUserId(firebaseUser.uid);
          if (profile) {
            name = profile.name;
          }
        } catch {
          // Ignore
        }
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName:
          name || (role === "doctor" ? "Dr. Provider" : "Patient User"),
        photoURL: photoUrl,
        role,
      };
    },
    [],
  );

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await fetchUserRole(firebaseUser);
          setUser(userData);
          localStorage.removeItem("docapp_demo_user");
        } catch (err) {
          console.error("Error fetching user role:", err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || undefined,
            role: "patient",
          });
        }
      } else {
        // If not in Firebase Auth, see if we have a demo session saved
        try {
          const saved = localStorage.getItem("docapp_demo_user");
          if (saved) {
            setUser(JSON.parse(saved));
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  const demoLogin = (role: Role) => {
    const demoUser = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.patient;
    setUser(demoUser);
    localStorage.setItem("docapp_demo_user", JSON.stringify(demoUser));
    setError(null);
  };

  const switchRole = (role: Role) => {
    demoLogin(role);
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.removeItem("docapp_demo_user");
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    role: Role,
  ) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(firebaseUser, { displayName });
      localStorage.removeItem("docapp_demo_user");

      if (role === "doctor") {
        await firestoreService.setDoc(
          COLLECTIONS.DOCTORS,
          {
            userId: firebaseUser.uid,
            clinicIds: ["clinic-1"],
            name: displayName,
            specialization: "General Medicine",
            role: "doctor",
            workingHours: {},
            status: "active",
          } as any,
          firebaseUser.uid,
        );
      } else if (role === "patient") {
        await firestoreService.setDoc(
          COLLECTIONS.PATIENTS,
          {
            userId: firebaseUser.uid,
            name: displayName,
            phone: "",
            email,
            dateOfBirth: new Date(),
            gender: "other",
            preferredClinicIds: ["clinic-1"],
          } as any,
          firebaseUser.uid,
        );
      }

      // onAuthStateChanged already ran while the profile document above was
      // still missing, so pin the session to the role the user signed up for.
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName,
        photoURL: firebaseUser.photoURL || undefined,
        role,
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem("docapp_demo_user");
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      // Ignore
    }
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const refreshToken = async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      return auth.currentUser.getIdToken(true);
    }
    return null;
  };

  const getIdTokenResult = async () => {
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      return auth.currentUser.getIdTokenResult();
    }
    return null;
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    demoLogin,
    switchRole,
    register,
    logout,
    resetPassword,
    refreshToken,
    getIdTokenResult,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRole() {
  const { user } = useAuth();
  return user?.role || null;
}

export function useUser() {
  const { user } = useAuth();
  return user;
}
