import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import admin from "firebase-admin";


const client = new SecretManagerServiceClient();

export async function accessSecretJSON(secretName: string, versionId = 'latest'): Promise<any> {
  const [version] = await client.accessSecretVersion({
    name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
  }
  return JSON.parse(payload)
}

export async function accessSecretValue(secretName: string, versionId = 'latest'): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
  }
  return payload
}

export async function initializeFirebase(): Promise<admin.database.Database> {
  // Initialize Firebase Admin SDK
  const firebaseDatabaseUrl: string = process.env.FIREBASE_DB_URL
  if (admin.apps.length === 0){
    // Fetch the service account using the async function
    const serviceAccount = await accessSecretJSON('firebase-admin'); // Use the correct secret name

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any), // Use the fetched service account
      databaseURL: firebaseDatabaseUrl,
    });
  }
  return admin.database(); // Assign the initialized database to the global variable
}