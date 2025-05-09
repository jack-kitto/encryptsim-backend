import express, { Request, Response } from 'express';
import { config } from "dotenv";
import { SimOrder, EsimService, AiraloTopupOrderParams, AiraloTopupOrder, AiraloSIMTopup } from './services/airaloService'; // Added AiraloTopupOrderParams, AiraloOrder, AiraloSIMTopup
import { SolanaService } from './services/solanaService';
import admin from "firebase-admin";
import { AiraloError } from '@montarist/airalo-api';
import { initializeFirebase } from './helper';

// Declare db outside the async function so it's accessible later
let db: admin.database.Database;

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
  paymentReceived: boolean;
  paidToMaster: boolean;
  paymentInSol?: number;
  sim?: SimOrder
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

const solanaService = new SolanaService();
let esimService: EsimService; // Declare esimService here

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

async function main() {
  db = await initializeFirebase(); // Wait for Firebase to be initialized

  // Now that Firebase is initialized, initialize services that depend on it.
  esimService = new EsimService(db); // Initialize EsimService with the db instance
  await esimService.initialize();

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

  app.post('/order', async (req: Request, res: Response) => {
    const orderId = Math.random().toString(36).substring(21); // Generate a unique order ID containing 20 characters
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
      paymentReceived: false,
      paidToMaster: false,
    };
    await db.ref(`/orders/${orderId}`).set(order);

    const paymentCheckDuration = 600000; // 10 minutes
    const pollingInterval = 10000; // Poll every 10 seconds
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
        const { enoughReceived, solBalance } = await solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
        order.paymentInSol = solBalance;
        console.log(`processing order ${order.orderId}`, enoughReceived, solBalance)
        if (enoughReceived) {
          console.log(`Payment received for order ${orderId}.`);
          clearInterval(paymentCheckInterval);

          // Retrieve the latest order data before updating
          const latestOrderSnapshot = await db.ref(`/orders/${orderId}`).once('value');
          const latestOrder = latestOrderSnapshot.val() as Order;

          // Only proceed if payment hasn't been processed by another check instance (unlikely but good practice)
          if (!latestOrder.paymentReceived) {
            latestOrder.paymentReceived = true;
            const sim = await esimService.placeOrder({ quantity, package_id });
            latestOrder.sim = sim

            await db.ref(`/orders/${orderId}`).set(latestOrder);
            await updatePaymentProfileWithOrder(ppPublicKey, orderId);
          }

          // handle aggregation of payment to master wallet
          // should handle failed case
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

    res.json({ orderId });
  });

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
          const { enoughReceived, solBalance } = await solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
          order.paymentInSol = solBalance;
          console.log(`processing order ${order.orderId}`, enoughReceived, solBalance)
          if (enoughReceived) {
            console.log(`Payment received for order ${orderId}.`);
            clearInterval(paymentCheckInterval);
    
            // Retrieve the latest order data before updating
            const latestOrderSnapshot = await db.ref(`/topup_orders/${orderId}`).once('value');
            const latestOrder = latestOrderSnapshot.val() as TopupsOrder;
    
            // Only proceed if payment hasn't been processed by another check instance (unlikely but good practice)
            if (!latestOrder.paymentReceived) {
              latestOrder.paymentReceived = true;
              // const topup = await esimService.createTopupOrder({ iccid, package_id, description: "" });
              
              // latestOrder.topup = topup;
              await db.ref(`/topup_orders/${orderId}`).set(latestOrder);
              await updatePaymentProfileWithOrder(ppPublicKey, orderId);
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

      // const orderResult: AiraloOrder = await esimService.createTopupOrder(topupOrderParams);

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

      const topups: AiraloSIMTopup[] = await esimService.getSIMTopups(iccid);

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

  // to be routinely called by front-end to check if order has been fulfilled
  app.get('/order/:orderId', async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const orderSnapshot = await db.ref(`/orders/${orderId}`).once('value');
    const order = orderSnapshot.val() as Order;

    if (!orderSnapshot.exists()) {
      res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentReceived && order.sim.iccid) {
      res.json({
        orderId: order.orderId,
        paymentReceived: order.paymentReceived,
        sim: order.sim
      });
    }
    else {
      res.status(204).send(); // Send a 204 status with no body
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

      const packages = await esimService.getPackagePlans(packageType, country as string);

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
