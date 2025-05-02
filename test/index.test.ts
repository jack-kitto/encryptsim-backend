import admin from 'firebase-admin';
import { updatePaymentProfileWithOrder } from '../src/index'; // Assuming you are testing updatePaymentProfileWithOrder
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseDatabaseUrl: string = process.env.FIREBASE_DB_URL || "";
if (admin.apps.length === 0){
  const serviceAccount = require("../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json"); 
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseDatabaseUrl,
  });
}
const db = admin.database();
const paymentProfilesRef = db.ref('payment_profiles');

describe('updatePaymentProfileWithOrder', () => {
  const ppPublicKey = 'testPublicKeyMultiOrders';
  const testRef = paymentProfilesRef.child(ppPublicKey); // Reference to the test location
  
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