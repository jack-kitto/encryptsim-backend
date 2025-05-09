import admin from 'firebase-admin';
import { updatePaymentProfileWithOrder } from '../src/index'; // Assuming you are testing updatePaymentProfileWithOrder
import * as dotenv from 'dotenv';
import { accessSecretJSON } from '../src/helper'

dotenv.config();

let db: admin.database.Database; // Declare db here

async function initializeFirebase() {
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
  return admin.database(); // Return the initialized database
}

describe('updatePaymentProfileWithOrder', () => {
  const ppPublicKey = 'testPublicKeyMultiOrders';
  let paymentProfilesRef: admin.database.Reference; // Declare ref here
  let testRef: admin.database.Reference; // Declare testRef here

  // Helper function to get the orderIds array from the database
  async function getOrderIds(): Promise<string[]> {
    const snapshot = await testRef.once('value');
    if (snapshot.exists() && snapshot.hasChild('orderIds')) {
        return snapshot.val().orderIds;
    } else {
        return [];
    }
  }

    beforeEach(async () => {
      // Initialize Firebase and get db instance
      db = await initializeFirebase();
      // Define references after db is initialized
      paymentProfilesRef = db.ref('payment_profiles');
      testRef = paymentProfilesRef.child(ppPublicKey); // Reference to the test location

      // Clear any existing data in the test location before each test
      await testRef.remove().catch(error => {
          console.error("Error during cleanup:", error);
      });
    });

    it('should correctly add multiple orderIds to orderIds array', async () => {
        const orderIdsToAdd = ['orderId1', 'orderId2', 'orderId3'];
        const initialOrderIds = ['existingOrderId1', 'existingOrderId2'];

        // Set initial data
        await testRef.set({ orderIds: initialOrderIds });

        // Add each orderId sequentially
        for (const orderId of orderIdsToAdd) {
            await updatePaymentProfileWithOrder(ppPublicKey, orderId);
        }
        
        const snapshot = await testRef.once('value');
        const data = snapshot.val();
    
        expect(snapshot.exists()).toBe(true);
        expect(data.orderIds.length).toBe(initialOrderIds.length + orderIdsToAdd.length);
        expect(data.orderIds).toEqual([...initialOrderIds, ...orderIdsToAdd]);
    });

    it('should create orderIds array and add orderId if it does not exist', async () => {
        const orderId = 'testOrderId';
        await updatePaymentProfileWithOrder(ppPublicKey, orderId);
        const orderIds = await getOrderIds();

        expect(orderIds).toEqual([orderId]);
    });
    
    afterEach(async () => {
        // Clean up any data left in the test location after each test
        await testRef.remove().catch(error => {
            console.error("Error during cleanup:", error);
        });
    });
    
});