import { Request, Response } from 'express';
import admin from "firebase-admin";
import { v4 as uuidv4 } from 'uuid';
import { SolanaService } from './services/solanaService';
import { AiraloWrapper, AiraloTopupOrder } from './services/airaloService';
import { DBHandler } from './helper';

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

    public queryOrder = async (req: Request, res: Response) => {
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

    public async processPayment(order: TopupsOrder): Promise<TopupsOrder> {
        const { enoughReceived, solBalance } = await this.solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
        order.paymentInSol = solBalance;
        console.log(`processing order ${order.orderId}`, enoughReceived, solBalance);
        if (enoughReceived) {
            console.log(`Payment received for order ${order.orderId}.`);
            order = await this.updateOrderStatus(order, 'paid');
        }

        return order;
    }

    public async updateOrderStatus(order: TopupsOrder, status: 'pending' | 'paid' | 'esim_provisioned' | 'paid_to_master' | 'failed'): Promise<TopupsOrder> {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        await this.db.ref(`/orders/${order.orderId}`).set(order);

        return order
    }

    private async getTopupOrder(order_id: string): Promise<TopupsOrder> {
        const orderSnapshot = await this.db.ref(`/topup_orders/${order_id}`).once('value');

        if (!orderSnapshot.exists()) {
            return null
        }

        return orderSnapshot.val() as TopupsOrder;
    }


}