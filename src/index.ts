import express, { Request, Response } from 'express';
import { config } from "dotenv";
import { AiraloService } from './services/airaloService';
import { SolanaService } from './services/solanaService';
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
const firebaseDatabaseUrl: string = process.env.FIREBASE_DB_URL || "";
if (admin.apps.length === 0){
  const serviceAccount = require("../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json"); 
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseDatabaseUrl,
  });
}
const db = admin.database();

const airaloService = new AiraloService()
const solanaService = new SolanaService();

const app = express()
app.use(express.json());


config()

interface PaymentProfile {
  publicKey: string;
  privateKey: string;
}

interface Order {
  orderId: string;
  ppPublicKey: string;
  quantity: number;
  package_id: string;
  package_price: string;
  qrCode?: string;
  iccid?: string;
  paymentReceived?: boolean;
}

// User must have payment profile as unique identifier to manage payment and esim subcription
app.post('/create-payment-profile', async (req: Request, res: Response) => {
  try {
    const { publicKey, privateKey } = await solanaService.createNewSolanaWallet();
    const paymentProfile: PaymentProfile = { publicKey, privateKey }

    await db.ref(`/payment_profiles/${publicKey}`).set(paymentProfile);
    
    res.status(201).json({ publicKey });
  } catch (error: any) {
    console.error("Error creating payment profile:", error);
    res.status(500).json({ error: "Failed to create payment profile" });
  }
});

export async function updatePaymentProfileWithOrder(ppPublicKey: string, orderId: string): Promise<void> {
  try {
    const paymentProfileRef = db.ref(`/payment_profiles/${ppPublicKey}`);
    const paymentProfileSnapshot = await paymentProfileRef.once('value');
    const currentPaymentProfileData = paymentProfileSnapshot.val() || {};

    let orderIds: string[] = currentPaymentProfileData.orderIds || [];
    orderIds.push(orderId);

    await paymentProfileRef.update({ orderIds });
  } catch (error) {
    console.error('Error updating payment profile with order:', error);
    throw error;
  }
}

interface PaymentProfileFirebase {
  orderIds?: string[];
}

// 1. Receive Order (POST)
app.post('/order', async (req: Request, res: Response) => {
  const orderId = Math.random().toString(36).substring(7); // Generate a unique order ID
  const { ppPublicKey, quantity, package_id, package_price } = req.body

  // Check if the payment profile exists
  const paymentProfileSnapshot = await db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
  if (!paymentProfileSnapshot.exists()) {
    return res.status(400).json({ error: 'payment profile not found' });
  }

  const order: Order = {
    orderId,
    ppPublicKey,
    quantity,    
    package_id,    
    package_price,
  };
  await db.ref(`/orders/${orderId}`).set(order);

  // Simulate querying address for payment (in a real app, use a listener)
  setTimeout(async () => {
    try {
      // Check if payment was received
      const { enoughReceived, solBalance } = await solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
      if (enoughReceived) {
        order.paymentReceived = true;
        const { qrcode, iccid } = await airaloService.placeOrder({ quantity, package_id })
        order.qrCode = qrcode;
        order.iccid = iccid;

        await db.ref(`/orders/${orderId}`).set(order);

        await updatePaymentProfileWithOrder(ppPublicKey, orderId);

        // aggregate payment to master wallet
        const privateKey = paymentProfileSnapshot.val().privateKey;
        await solanaService.aggregatePaymentToMasterWallet(privateKey, solBalance);

      }
    } catch (error) {
      console.error("Error processing order payment", error)
    }
  }, 10000);
  res.json({ orderId });
});

// to be routinely called by front-end to check if order has been fulfilled
app.get('/order/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const orderSnapshot = await db.ref(`/orders/${orderId}`).once('value');
  const order = orderSnapshot.val() as Order;

  if (!orderSnapshot.exists()) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.paymentReceived && order.iccid) {
    res.json(order);
  } else {
    res.json({
      orderId: order.orderId,
      paymentReceived: order.paymentReceived,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send("OK");
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});


