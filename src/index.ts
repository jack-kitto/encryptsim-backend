import express, { Request, Response } from 'express';
import { config } from "dotenv";
import { AiraloWrapper, AiraloTopupOrder, AiraloSIMTopup } from './services/airaloService';
import { SolanaService } from './services/solanaService';
import admin from "firebase-admin";
import { initializeFirebase } from './helper';
import { OrderHandler } from './order-handler'; // Import the new handler

// Declare db outside the async function so it's accessible later
let db: admin.database.Database;

const app = express()
app.use(express.json());

config()

interface PaymentProfile {
  publicKey: string;
  privateKey: string;
}

interface TopupsOrder {
  orderId: string;
  ppPublicKey: string;
  iccid: string;
  quantity: number;
  package_id: string;
  package_price: string;
  paymentReceived: boolean;
  paidToMaster: boolean;
  paymentInSol?: number;
  topup?: AiraloTopupOrder
}

let solanaService: SolanaService;
let airaloWrapper: AiraloWrapper;

async function main() {
  db = await initializeFirebase(); // Wait for Firebase to be initialized

  solanaService = new SolanaService();

  // Now that Firebase is initialized, initialize services that depend on it.
  airaloWrapper = new AiraloWrapper(db); // Initialize AiraloWrapper with the db instance
  await airaloWrapper.initialize();

  const orderHandler = new OrderHandler(db, solanaService, airaloWrapper);

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
  app.post('/topup', async (req: Request, res: Response) => {
    try {
      const orderId = Math.random().toString(36).substring(21); 
      const { ppPublicKey, package_id, iccid, package_price } = req.body;

      const paymentProfileSnapshot = await db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
      if (!paymentProfileSnapshot.exists()) {
        return res.status(400).json({ error: 'payment profile not found' });
      }

      if (!package_id || iccid == undefined) {
        return res.status(400).json({ error: 'Missing required parameters: package_id, quantity, iccid' });
      }

      const order: TopupsOrder = {
        orderId,
        ppPublicKey,
        iccid,
        quantity: 1,    
        package_id,    
        package_price,
        paymentReceived: false,
        paidToMaster: false,
      };

      await db.ref(`/topup_orders/${orderId}`).set(order);

      const paymentCheckDuration = 600000; // 10 minutes
      const pollingInterval = 30000; // Poll every 10 seconds
      const startTime = Date.now();

      const paymentCheckInterval = setInterval(async () => {
        // Check if the total duration has passed
        if (Date.now() - startTime > paymentCheckDuration) {
          console.log(`Payment check duration exceeded for order ${orderId}. Stopping polling.`);
          clearInterval(paymentCheckInterval);
          return;
        }
    
        try {
          // Check if payment was received
          const { enoughReceived, expectedAmountSOL } = await solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
          order.paymentInSol = expectedAmountSOL;
          console.log(`processing order ${order.orderId}`, enoughReceived, expectedAmountSOL)
          if (enoughReceived) {
            console.log(`Payment received for order ${orderId}.`);
            clearInterval(paymentCheckInterval);
    
            // Retrieve the latest order data before updating
            const latestOrderSnapshot = await db.ref(`/topup_orders/${orderId}`).once('value');
            const latestOrder = latestOrderSnapshot.val() as TopupsOrder;
    
            // Only proceed if payment hasn't been processed by another check instance (unlikely but good practice)
            if (!latestOrder.paymentReceived) {
              latestOrder.paymentReceived = true;
              // const topup = await airaloWrapper.createTopupOrder({ iccid, package_id, description: "" });
              
              // latestOrder.topup = topup;
              await db.ref(`/topup_orders/${orderId}`).set(latestOrder);
              // await updatePaymentProfileWithOrder(ppPublicKey, orderId);
            }
    
            
            if (latestOrder.paymentReceived) {
              const privateKey = paymentProfileSnapshot.val().privateKey;
              const sig = await solanaService.aggregatePaymentToMasterWallet(privateKey, parseFloat(order.package_price));
              if (sig) {
                latestOrder.paidToMaster = true;
                await db.ref(`/orders/${orderId}`).set(latestOrder);
              } else {
                console.error(`Failed to aggregate payment to master wallet for order ${orderId}.`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing order payment for order ${orderId}:`, error);
          // Depending on error handling requirements, you might want to stop the interval here
          clearInterval(paymentCheckInterval)
        }
      }, pollingInterval);

      // const topupOrderParams: AiraloTopupOrderParams = {
      //   package_id,
      //   iccid,
      //   description
      // };

      // const orderResult: AiraloOrder = await airaloWrapper.createTopupOrder(topupOrderParams);

      // res.status(201).json(orderResult);
    } catch (error: any) {
      console.error("Error creating top-up order:", error);
      // Check if the error has a message property for a more informative response
      const errorMessage = error.message || "Failed to create top-up order";
      res.status(500).json({ error: errorMessage });
    }
  });

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
