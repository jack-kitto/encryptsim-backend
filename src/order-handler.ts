import { Request, Response } from 'express';
import admin from "firebase-admin";
import { v4 as uuidv4 } from 'uuid';
import { SolanaService } from './services/solanaService';
import { AiraloWrapper, SimOrder } from './services/airaloService';
import { DBHandler } from './helper';

interface Order {
  orderId: string;
  ppPublicKey: string;
  quantity: number;
  package_id: string;
  package_price: string;
  paymentInSol?: number;
  sim?: SimOrder;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'paid' | 'esim_provisioned' | 'paid_to_master' | 'failed';
  errorLog?: string
}

export class OrderHandler {
  private db: admin.database.Database;
  private dbHandler: DBHandler;
  private solanaService: SolanaService;
  private airaloWrapper: AiraloWrapper;
  private paymentCheckDuration = 600000; // 10 minutes
  private pollingInterval = 10000; // Poll every 10 seconds

  constructor(db : admin.database.Database, solanaService: SolanaService, airaloWrapper: AiraloWrapper) {
    this.db = db;
    this.solanaService = solanaService;
    this.airaloWrapper = airaloWrapper;
    this.dbHandler = new DBHandler(this.db);
  }

  public queryOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = await this.getOrder(orderId)

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'esim_provisioned') {
      res.status(200).json({
        orderId: order.orderId,
        status: order.status,
        sim: order.sim
      });
    }

    res.status(204).json({
      orderId: order.orderId,
      status: order.status
    })
  }
 
  public createOrder = async (req: Request, res: Response) => {
    const orderId = uuidv4();
    const { ppPublicKey, quantity, package_id, package_price } = req.body;

    // Check if the payment profile exists
    const paymentProfileSnapshot = await this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
    if (!paymentProfileSnapshot.exists()) {
      return res.status(400).json({ error: 'payment profile not found' });
    }

    const order: Order = {
      orderId,
      ppPublicKey,
      quantity,
      package_id,
      package_price,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
    };
    await this.db.ref(`/orders/${orderId}`).set(order);

    const startTime = Date.now();
    const paymentCheckInterval = setInterval(async() => {
      // Check if the total duration has passed
      if (Date.now() - startTime > this.paymentCheckDuration) {
        console.log(`Payment check duration exceeded for order ${orderId}. Stopping polling.`);        
        clearInterval(paymentCheckInterval);
        return;
      }

      try {
        // re-fetch order and pp for this cycle
        let order = await this.getOrder(orderId)
        const pp = await this.dbHandler.getPaymentProfile(order.ppPublicKey)

        // check payment has been received
        if (order.status === 'pending') {
          order = await this.processPayment(order)
        }
        
        // if payment has been received, pay to master
        if (order.status === 'paid') {
          order = await this.payToMaster(order, pp);
        }

        // if paid_to_master, provision esim
        if (order.status === 'paid_to_master') {
          order = await this.provisionEsim(order);
        }

        // if esim provisioned, end this cycle
        if (order.status === 'esim_provisioned') {
          clearInterval(paymentCheckInterval);
        }
      }
      catch (error) {
        console.error(`Error processing order payment for order ${orderId}:`, error);
        // Depending on error handling requirements, you might want to stop the interval here
        await this.setOrderError(orderId, error);
        clearInterval(paymentCheckInterval);
      }
    }, this.pollingInterval)

    res.json({ orderId });
  }

// === HELPER FUNCTION ===
  public async payToMaster(order: Order, pp: any): Promise<Order> {
    const sig = await this.solanaService.aggregatePaymentToMasterWallet(pp.privateKey, order.paymentInSol);
    if (sig) {
      await this.updateOrderStatus(order, 'paid_to_master')
    }

    return order
  }

  public async provisionEsim(order: Order): Promise<Order> {
    // get order
    const sim = await this.airaloWrapper.placeOrder({ 
      quantity: order.quantity, 
      package_id: order.package_id
    });
    order.sim = sim;
    order = await this.updateOrderStatus(order, "esim_provisioned")
    await this.dbHandler.updatePPOrder(order.ppPublicKey, order.orderId)
    
    return order
  }

  public async processPayment(order: Order): Promise<Order> {    
    const { enoughReceived, expectedAmountSOL } = await this.solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
    order.paymentInSol = expectedAmountSOL;
    console.log(`processing order ${order.orderId}`, enoughReceived, expectedAmountSOL);
    if (enoughReceived) {
      console.log(`Payment received for order ${order.orderId}.`);
      order = await this.updateOrderStatus(order, 'paid');
    }

    return order;
  }

  public async updateOrderStatus(order: Order, status: 'pending' | 'paid' | 'esim_provisioned' | 'paid_to_master' | 'failed'): Promise<Order> {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await this.db.ref(`/orders/${order.orderId}`).set(order);

    return order
  }

  public async getOrder(order_id: string): Promise<Order> {
    const orderSnapshot = await this.db.ref(`/orders/${order_id}`).once('value');
    
    if (!orderSnapshot.exists()) {
      return null
    }
    
    return orderSnapshot.val() as Order;
  }

  private async setOrderError(order_id: string, errorLog: string): Promise<void> {
    const order = await this.getOrder(order_id)
    order.errorLog = errorLog
    order.updatedAt = new Date().toISOString();
    await this.db.ref(`/orders/${order.orderId}`).set(order);
  }
}