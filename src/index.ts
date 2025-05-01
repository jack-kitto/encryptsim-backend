import express, { Request, Response } from 'express';
import { Keypair, Connection, PublicKey} from '@solana/web3.js';
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
// Placeholder for Solana Master Wallet Keypair (replace with your actual keypair)
const solanaMasterPK = process.env.SOLANA_MASTER_PK;

// In-memory storage for orders (replace with a database in a production environment)

interface PaymentProfile {
  publicKey: string;
  privateKey: string;
}

interface Order {
  orderId: string;
  publicKey: string;
  quantity: number;
  package_id: string;
  package_price: string;
  qrCode?: string;
  iccid?: string;
  paymentReceived?: boolean;
}

const orders: { [key: string]: Order } = {};

app.post('/create-payment-profile', async (req: Request, res: Response) => {
  try {
    const {publicKey, privateKey} = await solanaService.createNewSolanaWallet();
    const paymentProfile: PaymentProfile = {publicKey, privateKey}
    
    await db.ref(`/payment_profiles/${publicKey}`).set(paymentProfile);
    
    res.status(201).json({ publicKey });
  } catch (error: any) {
    console.error("Error creating payment profile:", error);
    res.status(500).json({ error: "Failed to create payment profile" });
  }
});

// 1. Receive Order (POST)
app.post('/order', async (req: Request, res: Response) => {
  const orderId = Math.random().toString(36).substring(7); // Generate a unique order ID
  const {publicKey, quantity, package_id, package_price} = req.body

  const order: Order = {
    orderId,
    publicKey,
    quantity,
    package_id,
    package_price
  };

  orders[orderId] = order;

  // Simulate querying address for payment (in a real app, use a listener)
  setTimeout(async () => {
    // Check if payment was received (this is just a simulation)
    const paymentReceived = await solanaService.checkSolanaPayment(order.publicKey, order.package_price);
    if (paymentReceived) {
      order.paymentReceived = true;      
      const {qrcode, iccid} = await airaloService.placeOrder({quantity, package_id})
      order.qrCode = qrcode;
      order.iccid = iccid;

      // aggregate payment to master wallet
      const paymentProfile = await db.ref(`/payment_profiles/${order.publicKey}`).once("value");
      const privateKey = paymentProfile.val().privateKey
      await solanaService.aggregatePaymentToMasterWallet(privateKey, paymentReceived);      
    }
  }, 10000); // Check after 10 seconds (in real app, listen for changes)

  res.json({ orderId, publicKey });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.send("OK");
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

