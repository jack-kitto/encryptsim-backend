import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { getStorage } from "firebase-admin/storage";

export type { DecodedIdToken } from "firebase-admin/auth";
export { FieldValue, Timestamp } from "firebase-admin/firestore";
export type { Firestore, UpdateData } from "firebase-admin/firestore";

// Utility function to safely get the Firebase app instance
function getOrThrow<T extends object, K extends keyof T>(
  objOrArr: T | (T | null)[],
  keyOrIndex: K | number,
  errorMessage?: string
): NonNullable<T[K]> | NonNullable<T> {
  const value =
    //@ts-ignore
    typeof keyOrIndex === "number" ? objOrArr[keyOrIndex] : objOrArr[keyOrIndex];

  if (value == null) {
    throw new Error(errorMessage || "Value not found");
  }

  return value as NonNullable<T[K]> | NonNullable<T>;
}

// Initialize Firebase Admin SDK
if (!admin.apps.length && 'initializeApp' in admin && typeof admin.initializeApp === 'function') {
  if (process.env.FUNCTIONS_EMULATOR) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: `http://localhost:9000?ns=${process.env.GCLOUD_PROJ_ID}`,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.DATABASE_URL
    });
  }

  //@ts-ignore
  const db = getFirestore(getOrThrow(admin.apps, 0));

  db.settings({
    ignoreUndefinedProperties: true,
  });
}

// Get the initialized Firebase app
function getApp() {
  return getOrThrow(admin.apps, 0);
}

const firebaseApp = getApp();

// Export Firebase services
//@ts-ignore
export const auth = getAuth(firebaseApp);
//@ts-ignore
export const db = getFirestore(firebaseApp);
//@ts-ignore
export const database = getDatabase(firebaseApp);
//@ts-ignore
export const storage = getStorage(firebaseApp);
//@ts-ignore
export const functions = getFunctions(firebaseApp);
