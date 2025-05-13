import { Request, Response } from 'express';
import admin from "firebase-admin";
import { v4 as uuidv4 } from 'uuid';
import { SolanaService } from './services/solanaService';
import { AiraloWrapper, AiraloTopupOrder } from './services/airaloService';
import { DBHandler } from './helper';
import { stringify } from 'querystring';

interface TopupsOrder {
    orderId: string;
    ppPublicKey: string;
    iccid: string;
    quantity: number;
    package_id: string;
    package_price: string;
    paymentInSol?: number;
    type: string;
    topup?: AiraloTopupOrder;
    createdAt: string;
    updatedAt: string;
    status: 'pending' | 'paid' | 'esim_provisioned' | 'paid_to_master' | 'failed';
    errorLog?: string
}

export class TopupHandler {
    private db: admin.database.Database;
    private dbHandler: DBHandler;
    private solanaService: SolanaService;
    private airaloWrapper: AiraloWrapper;
    private paymentCheckDuration = 600000;
    private pollingInterval = 30000;

    constructor(db: admin.database.Database, solanaService: SolanaService, airaloWrapper: AiraloWrapper) {
        this.db = db;
        this.solanaService = solanaService;
        this.airaloWrapper = airaloWrapper;
        this.dbHandler = new DBHandler(this.db);
    }

    public queryPPTopupOrder = async (req: Request, res: Response) => {
        const { ppPublicKey } = req.params;
        console.log("ppp: ", ppPublicKey);
        const paymentProfileSnapshot = await this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
        if (!paymentProfileSnapshot.exists()) {
            return res.status(400).json({ error: 'payment profile not found' });
        }
        const paymentProfileData = paymentProfileSnapshot.val();
        console.log("Payment Profile Data:", paymentProfileData);

        const orderIdsObject = paymentProfileData.orderIds;

        const orderIds = Object.values(orderIdsObject);
        console.log(`Found order keys (IDs): ${orderIds.join(', ')}`);

        if (!orderIdsObject || Object.keys(orderIdsObject).length === 0) {
            console.log(`No orders found associated with payment profile: ${ppPublicKey}`);
            return res.status(200).json([]);
        }


        const orderDetailsPromises = orderIds.map((orderId: string) =>
            this.getTopupOrder(orderId).catch(err => {
                console.error(`Error fetching order ${orderId}:`, err);
                return null;
            })
        );

        const orders = (await Promise.all(orderDetailsPromises))
            .filter(order => order !== null);

        console.log("TopupsOrder: ", orders);

        const simplifiedOrders = orders.map(order => {
            if (order && typeof order === 'object' && 'orderId' in order && 'package_id' in order && 'iccid' in order) {
                return {
                    orderId: order.orderId,
                    package_id: order.package_id,
                    iccid: order.iccid
                };
            }
            console.warn('Skipping malformed order object:', order);
            return null; 
        }).filter(order => order !== null);

        console.log("Simplified Topup Orders: ", simplifiedOrders);

        res.status(200).json("");

    }

    public queryTopOrder = async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const order = await this.getTopupOrder(orderId)

        if (!order) {
            res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'esim_provisioned') {
            res.status(200).json({
                orderId: order.orderId,
                status: order.status,
                topup: order.topup
            });
        }

        res.status(204).json({
            orderId: order.orderId,
            status: order.status
        })
    }


    public createTopupOrder = async (req: Request, res: Response) => {
        console.log("Start1");
        const orderId = uuidv4();
        const { ppPublicKey, package_id, iccid, package_price } = req.body;

        // Check if the payment profile exists
        const paymentProfileSnapshot = await this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
        if (!paymentProfileSnapshot.exists()) {
            return res.status(400).json({ error: 'payment profile not found' });
        }
        console.log("Start2");

        const order: TopupsOrder = {
            orderId,
            ppPublicKey,
            iccid,
            quantity: 1,
            package_id,
            package_price,
            type: "topup",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending'
        };

        await this.db.ref(`/topup_orders/${orderId}`).set(order);
        console.log("Start3");

        const startTime = Date.now();
        console.log("Start3.5");
        const paymentCheckInterval = setInterval(async () => {
            console.log("Start3.75");
            // Check if the total duration has passed
            if (Date.now() - startTime > this.paymentCheckDuration) {
                console.log("Start4");
                console.log(`Payment check duration exceeded for order ${orderId}. Stopping polling.`);
                clearInterval(paymentCheckInterval);
                return;
            }
            console.log("Start5");

            try {
                // re-fetch order and pp for this cycle
                console.log("Start6");
                let order = await this.getTopupOrder(orderId)
                const pp = await this.dbHandler.getPaymentProfile(order.ppPublicKey)

                // check payment has been received
                if (order.status === 'pending') {
                    console.log("Pending");
                    order = await this.processPayment(order)
                }

                // if payment has been received, provisioning esims
                if (order.status === 'paid') {
                    order = await this.payToMaster(order, pp);
                    console.log("Paid");
                    //await this.updateOrderStatus(order, 'esim_provisioned');
                }

                // if esim provisioned, pay to master
                if (order.status === 'paid_to_master') {
                    order = await this.provisionEsim(order);
                    console.log("paid_to_master");
                    //await this.updateOrderStatus(order, 'paid_to_master');
                }

                // if paid to master, end this cycle
                if (order.status === 'esim_provisioned') {
                    console.log("esim_provisioned");
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
    public async payToMaster(order: TopupsOrder, pp: any): Promise<TopupsOrder> {
        const sig = await this.solanaService.aggregatePaymentToMasterWallet(pp.privateKey, parseFloat(order.package_price));
        if (sig) {
            await this.updateOrderStatus(order, 'paid_to_master')
        }

        return order
    }

    public async provisionEsim(order: TopupsOrder): Promise<TopupsOrder> {
        // get order
        const topup = await this.airaloWrapper.createTopupOrder({
            iccid: order.iccid,
            package_id: order.package_id
        });
        order.topup = topup;
        order = await this.updateOrderStatus(order, "esim_provisioned")
        await this.dbHandler.updatePPOrder(order.ppPublicKey, order.orderId)

        return order
    }

    public async processPayment(order: TopupsOrder): Promise<TopupsOrder> {
        const { enoughReceived, expectedAmountSOL } = await this.solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
        order.paymentInSol = expectedAmountSOL;
        console.log(`processing order ${order.orderId}`, enoughReceived, expectedAmountSOL);
        if (enoughReceived) {
            console.log(`Payment received for order ${order.orderId}.`);
            order = await this.updateOrderStatus(order, 'paid');
            console.log("order: ", order.status);
        }

        return order;
    }

    public async updateOrderStatus(order: TopupsOrder, status: 'pending' | 'paid' | 'esim_provisioned' | 'paid_to_master' | 'failed'): Promise<TopupsOrder> {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        await this.db.ref(`/topup_orders/${order.orderId}`).set(order);

        return order
    }

    private async getTopupOrder(order_id: string): Promise<TopupsOrder> {
        const orderSnapshot = await this.db.ref(`/topup_orders/${order_id}`).once('value');

        if (!orderSnapshot.exists()) {
            return null
        }
        return orderSnapshot.val() as TopupsOrder;
    }

    private async setOrderError(order_id: string, errorLog: string): Promise<void> {
        const order = await this.getTopupOrder(order_id)
        order.errorLog = errorLog
        order.updatedAt = new Date().toISOString();
        await this.db.ref(`/topup_orders/${order.orderId}`).set(order);
    }
}