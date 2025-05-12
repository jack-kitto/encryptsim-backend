"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopupHandler = void 0;
const uuid_1 = require("uuid");
const helper_1 = require("./helper");
class TopupHandler {
    constructor(db, solanaService, airaloWrapper) {
        this.paymentCheckDuration = 600000;
        this.pollingInterval = 30000;
        this.queryOrder = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { orderId } = req.params;
            const order = yield this.getTopupOrder(orderId);
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
            });
        });
        this.createTopupOrder = (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log("Start1");
            const orderId = (0, uuid_1.v4)();
            const { ppPublicKey, package_id, iccid, package_price } = req.body;
            // Check if the payment profile exists
            const paymentProfileSnapshot = yield this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
            if (!paymentProfileSnapshot.exists()) {
                return res.status(400).json({ error: 'payment profile not found' });
            }
            console.log("Start2");
            const order = {
                orderId,
                ppPublicKey,
                iccid,
                quantity: 1,
                package_id,
                package_price,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'pending'
            };
            yield this.db.ref(`/topup_orders/${orderId}`).set(order);
            console.log("Start3");
            const startTime = Date.now();
            console.log("Start3.5");
            const paymentCheckInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
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
                    let order = yield this.getTopupOrder(orderId);
                    const pp = yield this.dbHandler.getPaymentProfile(order.ppPublicKey);
                    // check payment has been received
                    if (order.status === 'pending') {
                        console.log("Pending");
                        order = yield this.processPayment(order);
                    }
                    // if payment has been received, provisioning esims
                    if (order.status === 'paid') {
                        //order = await this.provisionEsim(order);
                        console.log("Paid");
                        yield this.updateOrderStatus(order, 'esim_provisioned');
                    }
                    // if esim provisioned, pay to master
                    if (order.status === 'esim_provisioned') {
                        //order = await this.payToMaster(order, pp);
                        console.log("esim_provisioned");
                        yield this.updateOrderStatus(order, 'paid_to_master');
                    }
                    // if paid to master, end this cycle
                    if (order.status === 'paid_to_master') {
                        console.log("paid_to_master");
                        clearInterval(paymentCheckInterval);
                    }
                }
                catch (error) {
                    console.error(`Error processing order payment for order ${orderId}:`, error);
                    // Depending on error handling requirements, you might want to stop the interval here
                    yield this.setOrderError(orderId, error);
                    clearInterval(paymentCheckInterval);
                }
            }), this.pollingInterval);
            res.json({ orderId });
        });
        this.db = db;
        this.solanaService = solanaService;
        this.airaloWrapper = airaloWrapper;
        this.dbHandler = new helper_1.DBHandler(this.db);
    }
    // === HELPER FUNCTION ===
    payToMaster(order, pp) {
        return __awaiter(this, void 0, void 0, function* () {
            const sig = yield this.solanaService.aggregatePaymentToMasterWallet(pp.privateKey, parseFloat(order.package_price));
            if (sig) {
                yield this.updateOrderStatus(order, 'paid_to_master');
            }
            return order;
        });
    }
    provisionEsim(order) {
        return __awaiter(this, void 0, void 0, function* () {
            // get order
            const topup = yield this.airaloWrapper.createTopupOrder({
                iccid: order.iccid,
                package_id: order.package_id
            });
            order.topup = topup;
            order = yield this.updateOrderStatus(order, "esim_provisioned");
            yield this.dbHandler.updatePPOrder(order.ppPublicKey, order.orderId);
            return order;
        });
    }
    processPayment(order) {
        return __awaiter(this, void 0, void 0, function* () {
            const { enoughReceived, expectedAmountSOL } = yield this.solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
            order.paymentInSol = expectedAmountSOL;
            console.log(`processing order ${order.orderId}`, enoughReceived, expectedAmountSOL);
            if (enoughReceived) {
                console.log(`Payment received for order ${order.orderId}.`);
                order = yield this.updateOrderStatus(order, 'paid');
                console.log("order: ", order.status);
            }
            return order;
        });
    }
    updateOrderStatus(order, status) {
        return __awaiter(this, void 0, void 0, function* () {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            yield this.db.ref(`/topup_orders/${order.iccid}`).set(order);
            return order;
        });
    }
    getTopupOrder(order_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderSnapshot = yield this.db.ref(`/topup_orders/${order_id}`).once('value');
            if (!orderSnapshot.exists()) {
                return null;
            }
            return orderSnapshot.val();
        });
    }
    setOrderError(order_id, errorLog) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getTopupOrder(order_id);
            order.errorLog = errorLog;
            order.updatedAt = new Date().toISOString();
            yield this.db.ref(`/orders/${order.orderId}`).set(order);
        });
    }
}
exports.TopupHandler = TopupHandler;
//# sourceMappingURL=topup-handler.js.map