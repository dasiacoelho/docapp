import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

/**
 * Callable function to create a doctor's Firebase Auth account
 * Creates user with matching UID, sets custom claims, updates Firestore
 */
export const createDoctorLogin = functions.https.onCall(
  async (data: { doctorId: string; email: string; name: string }, context) => {
    // Verify caller is admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    // Check if caller is admin
    const adminDoc = await db.collection("admins").doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can create doctor logins"
      );
    }

    const { doctorId, email, name } = data;

    if (!doctorId || !email || !name) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: doctorId, email, name"
      );
    }

    // Generate secure password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      // Create user in Firebase Auth with the doctor's Firestore UID
      const userRecord = await auth.createUser({
        uid: doctorId,
        email,
        password,
        displayName: name,
        emailVerified: false,
        disabled: false,
      });

      // Set custom claims for role detection
      await auth.setCustomUserClaims(doctorId, { role: "doctor" });

      // Update Firestore doctor document
      await db.collection("doctors").doc(doctorId).update({
        authCreated: true,
        authCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Return credentials to admin
      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        password,
        message: "Doctor login created successfully",
      };
    } catch (error: any) {
      if (error.code === "auth/uid-already-exists") {
        // Update existing user with new password
        await auth.updateUser(doctorId, { password });
        await auth.setCustomUserClaims(doctorId, { role: "doctor" });
        
        return {
          success: true,
          uid: doctorId,
          email,
          password: "Existing user - password unchanged",
          message: "Doctor login updated (UID already existed)",
        };
      }
      
      console.error("createDoctorLogin error:", error);
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Failed to create doctor login"
      );
    }
  }
);

/**
 * Callable function to create a patient's Firebase Auth account
 */
export const createPatientLogin = functions.https.onCall(
  async (data: { patientId: string; email: string; name: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
    }

    const adminDoc = await db.collection("admins").doc(context.auth.uid).get();
    if (!adminDoc.exists) {
      throw new functions.https.HttpsError("permission-denied", "Only admins can create patient logins");
    }

    const { patientId, email, name } = data;

    if (!patientId || !email || !name) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
    }

    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
      let password = "";
      for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const userRecord = await auth.createUser({
        uid: patientId,
        email,
        password,
        displayName: name,
        emailVerified: false,
        disabled: false,
      });

      await auth.setCustomUserClaims(patientId, { role: "patient" });

      await db.collection("patients").doc(patientId).update({
        authCreated: true,
        authCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        uid: userRecord.uid,
        email: userRecord.email,
        password,
        message: "Patient login created successfully",
      };
    } catch (error: any) {
      if (error.code === "auth/uid-already-exists") {
        await auth.setCustomUserClaims(patientId, { role: "patient" });
        return {
          success: true,
          uid: patientId,
          email,
          password: "Existing user - password unchanged",
          message: "Patient login updated",
        };
      }
      
      console.error("createPatientLogin error:", error);
      throw new functions.https.HttpsError("internal", error.message || "Failed to create patient login");
    }
  }
);