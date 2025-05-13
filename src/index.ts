import express, { Request, Response } from 'express';
import { config } from "dotenv";
import { AiraloWrapper, AiraloTopupOrder, AiraloSIMTopup } from './services/airaloService';
import { SolanaService } from './services/solanaService';
import admin from "firebase-admin";
import { initializeFirebase } from './helper';
import { OrderHandler } from './order-handler'; 
import { TopupHandler } from './topup-handler';

// Declare db outside the async function so it's accessible later
let db: admin.database.Database;

const app = express()
app.use(express.json());

config()

interface PaymentProfile {
  publicKey: string;
  privateKey: string;
}

let solanaService: SolanaService;
let airaloWrapper: AiraloWrapper;

async function main() {
  db = await initializeFirebase(); 

  solanaService = new SolanaService();

  airaloWrapper = new AiraloWrapper(db); 
  await airaloWrapper.initialize();

  const orderHandler = new OrderHandler(db, solanaService, airaloWrapper);
  const topupHandler = new TopupHandler(db, solanaService, airaloWrapper);

  // === PAYMENT PROFILE HANDLER ===

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

  // === ORDER HANDLER ===
  app.post('/order', orderHandler.createOrder);
  // to be routinely called by front-end to check if order has been fulfilled
  app.get('/order/:orderId', orderHandler.queryOrder);

  // Endpoint to create a new top-up order
  app.post('/topup', topupHandler.createTopupOrder);

  app.get('/payment-profile/topup/:ppPublicKey', topupHandler.queryPPTopupOrder);
  app.get('/payment-profile/sim/:ppPublicKey', orderHandler.queryPPOrder);

  // Endpoint to get available top-up packages for a SIM
  app.get('/sim/:iccid/topups', async (req: Request, res: Response) => {
    try {
      const { iccid } = req.params;

      if (!iccid) {
        return res.status(400).json({ error: 'Missing required parameter: iccid' });
      }

      const topups: AiraloSIMTopup[] = await airaloWrapper.getSIMTopups(iccid);

      if (!topups) {
        // This typically means the service encountered an error it couldn't recover from,
        // or the method in the service is designed to return undefined in some error cases.
        return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
      }

      res.json(topups);

    } catch (error: any) {
      console.error(`Error getting top-ups for ICCID ${req.params.iccid}:`, error);
      const errorMessage = error.message || "Failed to retrieve SIM top-ups";
      res.status(500).json({ error: errorMessage });
    }
  });

  // GET handler to get packages from getPackagePlans()
  app.get('/packages', async (req: Request, res: Response) => {
    try {
      const { type, country } = req.query;

      if (!type) {
        return res.status(400).json({ error: 'Missing required parameters: type' });
      }

      // Cast type to the expected union type, assuming valid input based on validation above
      const packageType = type as 'global' | 'local' | 'regional';

      const packages = await airaloWrapper.getPackagePlans(packageType, country as string);

      if (packages === undefined) {
        // This case is handled in the service by returning undefined on error
        return res.status(500).json({ error: 'Failed to retrieve package plans' });
      }

      res.json(packages);

    } catch (error: any) {
      console.error("Error in /packages endpoint:", error);
      res.status(500).json({ error: "Failed to retrieve package plans" });
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

}

// Call the main async function to start the application
main().catch(console.error);
