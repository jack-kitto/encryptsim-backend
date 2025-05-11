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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const airaloService_1 = require("./services/airaloService");
const solanaService_1 = require("./services/solanaService");
const helper_1 = require("./helper");
const order_handler_1 = require("./order-handler"); // Import the new handler
// Declare db outside the async function so it's accessible later
let db;
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dotenv_1.config)();
let solanaService;
let airaloWrapper;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        db = yield (0, helper_1.initializeFirebase)(); // Wait for Firebase to be initialized
        solanaService = new solanaService_1.SolanaService();
        // Now that Firebase is initialized, initialize services that depend on it.
        airaloWrapper = new airaloService_1.AiraloWrapper(db); // Initialize AiraloWrapper with the db instance
        yield airaloWrapper.initialize();
        const orderHandler = new order_handler_1.OrderHandler(db, solanaService, airaloWrapper);
        // User must have payment profile as unique identifier to manage payment and esim subcription
        app.post('/create-payment-profile', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { publicKey, privateKey } = yield solanaService.createNewSolanaWallet();
                const paymentProfile = { publicKey, privateKey };
                yield db.ref(`/payment_profiles/${publicKey}`).set(paymentProfile);
                res.status(201).json({ publicKey });
            }
            catch (error) {
                console.error("Error creating payment profile:", error);
                res.status(500).json({ error: "Failed to create payment profile" });
            }
        }));
        // === ORDER HANDLER ===
        app.post('/order', orderHandler.createOrder);
        // to be routinely called by front-end to check if order has been fulfilled
        app.get('/order/:orderId', orderHandler.queryOrder);
        // Endpoint to create a new top-up order
        app.post('/topup', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = Math.random().toString(36).substring(21);
                const { ppPublicKey, package_id, iccid, package_price } = req.body;
                const paymentProfileSnapshot = yield db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
                if (!paymentProfileSnapshot.exists()) {
                    return res.status(400).json({ error: 'payment profile not found' });
                }
                if (!package_id || iccid == undefined) {
                    return res.status(400).json({ error: 'Missing required parameters: package_id, quantity, iccid' });
                }
                const order = {
                    orderId,
                    ppPublicKey,
                    iccid,
                    quantity: 1,
                    package_id,
                    package_price,
                    paymentReceived: false,
                    paidToMaster: false,
                };
                yield db.ref(`/topup_orders/${orderId}`).set(order);
                const paymentCheckDuration = 600000; // 10 minutes
                const pollingInterval = 30000; // Poll every 10 seconds
                const startTime = Date.now();
                const paymentCheckInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    // Check if the total duration has passed
                    if (Date.now() - startTime > paymentCheckDuration) {
                        console.log(`Payment check duration exceeded for order ${orderId}. Stopping polling.`);
                        clearInterval(paymentCheckInterval);
                        return;
                    }
                    try {
                        // Check if payment was received
                        const { enoughReceived, solBalance } = yield solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
                        order.paymentInSol = solBalance;
                        console.log(`processing order ${order.orderId}`, enoughReceived, solBalance);
                        if (enoughReceived) {
                            console.log(`Payment received for order ${orderId}.`);
                            clearInterval(paymentCheckInterval);
                            // Retrieve the latest order data before updating
                            const latestOrderSnapshot = yield db.ref(`/topup_orders/${orderId}`).once('value');
                            const latestOrder = latestOrderSnapshot.val();
                            // Only proceed if payment hasn't been processed by another check instance (unlikely but good practice)
                            if (!latestOrder.paymentReceived) {
                                latestOrder.paymentReceived = true;
                                // const topup = await airaloWrapper.createTopupOrder({ iccid, package_id, description: "" });
                                // latestOrder.topup = topup;
                                yield db.ref(`/topup_orders/${orderId}`).set(latestOrder);
                                // await updatePaymentProfileWithOrder(ppPublicKey, orderId);
                            }
                            if (latestOrder.paymentReceived) {
                                const privateKey = paymentProfileSnapshot.val().privateKey;
                                const sig = yield solanaService.aggregatePaymentToMasterWallet(privateKey, parseFloat(order.package_price));
                                if (sig) {
                                    latestOrder.paidToMaster = true;
                                    yield db.ref(`/orders/${orderId}`).set(latestOrder);
                                }
                                else {
                                    console.error(`Failed to aggregate payment to master wallet for order ${orderId}.`);
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error processing order payment for order ${orderId}:`, error);
                        // Depending on error handling requirements, you might want to stop the interval here
                        clearInterval(paymentCheckInterval);
                    }
                }), pollingInterval);
                // const topupOrderParams: AiraloTopupOrderParams = {
                //   package_id,
                //   iccid,
                //   description
                // };
                // const orderResult: AiraloOrder = await airaloWrapper.createTopupOrder(topupOrderParams);
                // res.status(201).json(orderResult);
            }
            catch (error) {
                console.error("Error creating top-up order:", error);
                // Check if the error has a message property for a more informative response
                const errorMessage = error.message || "Failed to create top-up order";
                res.status(500).json({ error: errorMessage });
            }
        }));
        // Endpoint to get available top-up packages for a SIM
        app.get('/sim/:iccid/topups', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { iccid } = req.params;
                if (!iccid) {
                    return res.status(400).json({ error: 'Missing required parameter: iccid' });
                }
                const topups = yield airaloWrapper.getSIMTopups(iccid);
                if (!topups) {
                    // This typically means the service encountered an error it couldn't recover from,
                    // or the method in the service is designed to return undefined in some error cases.
                    return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
                }
                res.json(topups);
            }
            catch (error) {
                console.error(`Error getting top-ups for ICCID ${req.params.iccid}:`, error);
                const errorMessage = error.message || "Failed to retrieve SIM top-ups";
                res.status(500).json({ error: errorMessage });
            }
        }));
        // GET handler to get packages from getPackagePlans()
        app.get('/packages', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, country } = req.query;
                if (!type) {
                    return res.status(400).json({ error: 'Missing required parameters: type' });
                }
                // Cast type to the expected union type, assuming valid input based on validation above
                const packageType = type;
                const packages = yield airaloWrapper.getPackagePlans(packageType, country);
                if (packages === undefined) {
                    // This case is handled in the service by returning undefined on error
                    return res.status(500).json({ error: 'Failed to retrieve package plans' });
                }
                res.json(packages);
            }
            catch (error) {
                console.error("Error in /packages endpoint:", error);
                res.status(500).json({ error: "Failed to retrieve package plans" });
            }
        }));
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.send("OK");
        });
        const port = parseInt(process.env.PORT || '3000');
        app.listen(port, () => {
            console.log(`listening on port ${port}`);
        });
    });
}
// Call the main async function to start the application
main().catch(console.error);
//# sourceMappingURL=index.js.map