import express, { Request, Response } from 'express';
import { config } from "dotenv";
import { AiraloWrapper, AiraloTopupOrder, AiraloSIMTopup } from './services/airaloService';
import { SolanaService } from './services/solanaService';
import admin from "firebase-admin";
import { GCloudLogger, initializeFirebase } from './helper';
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

  const logger = new GCloudLogger();
  solanaService = new SolanaService(logger);

  airaloWrapper = new AiraloWrapper(db, logger);
  await airaloWrapper.initialize();

  const orderHandler = new OrderHandler(db, solanaService, airaloWrapper, logger);
  const topupHandler = new TopupHandler(db, solanaService, airaloWrapper, logger);

  // === PAYMENT PROFILE HANDLER ===

  // User must have payment profile as unique identifier to manage payment and esim subcription
  app.post('/create-payment-profile', async (req: Request, res: Response) => {
    try {
      const { publicKey, privateKey } = await solanaService.createNewSolanaWallet();
      const paymentProfile: PaymentProfile = { publicKey, privateKey }

      await db.ref(`/payment_profiles/${publicKey}`).set(paymentProfile);

      res.status(201).json({ publicKey });
    } catch (error: any) {
      this.logger.logERROR("Error creating payment profile:", error);
      // Log error to Firebase
      res.status(500).json({ error: "Failed to create payment profile" });
    }
  });  

  // === ORDER HANDLER ===
  app.post('/order', orderHandler.createOrder);
  // to be routinely called by front-end to check if order has been fulfilled
  app.get('/order/:orderId', orderHandler.queryOrder);

  // Endpoint to create a new top-up order
  app.post('/topup', topupHandler.createTopupOrder);
  app.get('/topup/:orderId', topupHandler.queryTopUpOrder);

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
        // Log error to Firebase
        return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
      }

      res.json(topups);

    } catch (error: any) {
      this.logger.logERROR(`Error getting top-ups for ICCID ${req.params.iccid}:`, error);
      const errorMessage = error.message || "Failed to retrieve SIM top-ups";
       // Log error to Firebase
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get('/sim/:iccid/usage', async (req: Request, res: Response) => {
    try {
      const { iccid } = req.params;

      if (!iccid) {
        return res.status(400).json({ error: 'Missing required parameter: iccid' });
      }
      const usage: any = await airaloWrapper.getDataUsage(iccid);

      // if (!usage) {
      //   // This typically means the service encountered an error it couldn't recover from,
      //   // or the method in the service is designed to return undefined in some error cases.
      //   return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
      // }

      res.json(usage);

    } catch (error: any) {
      this.logger.logERROR(`Error getting usage for ICCID ${req.params.iccid}:`, error);
      const errorMessage = error.message || "Failed to retrieve SIM usage";
      // Log error to Firebase
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
         // Log error to Firebase
        return res.status(500).json({ error: 'Failed to retrieve package plans' });
      }

      res.json(packages);

    } catch (error: any) {
      this.logger.logERROR("Error in /packages endpoint:", error);
       // Log error to Firebase
      res.status(500).json({ error: "Failed to retrieve package plans" });
    }
  });

  // Endpoint to log errors from the frontend or other sources
  app.post('/error', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      const errorLog = {
        message: message
      };
      
      // Save error log to Firebase
      const timestamp = new Date().toISOString();
      const timestampKey = timestamp.replace(/[^a-zA-Z0-9]/g, '_'); // Create a valid key
      await db.ref(`/error_logs/${timestampKey}`).set(errorLog);

      logger.logINFO(`error logged: ${message}`)
      
      res.status(200).send("OK")
    } catch (error: any) {
      this.logger.logERROR("Error processing error log request:", error);
       // Log error about the logging process itself
      res.status(500).json({ success: false, message: "Failed to process log request" });
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
