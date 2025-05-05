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
exports.updatePaymentProfileWithOrder = updatePaymentProfileWithOrder;
const express_1 = __importDefault(require("express"));
const dotenv_1 = require("dotenv");
const airaloService_1 = require("./services/airaloService");
const solanaService_1 = require("./services/solanaService");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize Firebase Admin SDK
const firebaseDatabaseUrl = process.env.FIREBASE_DB_URL || "";
if (firebase_admin_1.default.apps.length === 0) {
    const serviceAccount = require("../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json");
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        databaseURL: firebaseDatabaseUrl,
    });
}
const db = firebase_admin_1.default.database();
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dotenv_1.config)();
const solanaService = new solanaService_1.SolanaService();
const esimService = new airaloService_1.EsimService();
try {
    esimService.connectToFirebase();
}
catch (error) {
    console.log('Error connecting to firebase:', error);
}
// User must have payment profile as unique identifier to manage payment and esim subcription
app.post('/create-payment-profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
function updatePaymentProfileWithOrder(ppPublicKey, orderId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const paymentProfileRef = db.ref(`/payment_profiles/${ppPublicKey}`);
            const paymentProfileSnapshot = yield paymentProfileRef.once('value');
            const currentPaymentProfileData = paymentProfileSnapshot.val() || {};
            let orderIds = currentPaymentProfileData.orderIds || [];
            orderIds.push(orderId);
            yield paymentProfileRef.update({ orderIds });
        }
        catch (error) {
            console.error('Error updating payment profile with order:', error);
            throw error;
        }
    });
}
app.post('/order', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = Math.random().toString(36).substring(7); // Generate a unique order ID
    const { ppPublicKey, quantity, package_id, package_price } = req.body;
    // Check if the payment profile exists
    const paymentProfileSnapshot = yield db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
    if (!paymentProfileSnapshot.exists()) {
        return res.status(400).json({ error: 'payment profile not found' });
    }
    const order = {
        orderId,
        ppPublicKey,
        quantity,
        package_id,
        package_price,
    };
    yield db.ref(`/orders/${orderId}`).set(order);
    // Simulate querying address for payment (in a real app, use a listener)
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if payment was received
            const { enoughReceived, solBalance } = yield solanaService.checkSolanaPayment(order.ppPublicKey, order.package_price);
            if (enoughReceived) {
                order.paymentReceived = true;
                const { qrcode, iccid } = yield esimService.placeOrder({ quantity, package_id });
                order.qrCode = qrcode;
                order.iccid = iccid;
                yield db.ref(`/orders/${orderId}`).set(order);
                yield updatePaymentProfileWithOrder(ppPublicKey, orderId);
                // aggregate payment to master wallet
                const privateKey = paymentProfileSnapshot.val().privateKey;
                yield solanaService.aggregatePaymentToMasterWallet(privateKey, solBalance);
            }
        }
        catch (error) {
            console.error("Error processing order payment", error);
        }
    }), 10000);
    res.json({ orderId });
}));
// to be routinely called by front-end to check if order has been fulfilled
app.get('/order/:orderId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const orderSnapshot = yield db.ref(`/orders/${orderId}`).once('value');
    const order = orderSnapshot.val();
    if (!orderSnapshot.exists()) {
        res.status(404).json({ message: 'Order not found' });
    }
    if (order.paymentReceived && order.iccid) {
        res.json(order);
    }
    else {
        res.json({
            orderId: order.orderId,
            paymentReceived: order.paymentReceived,
        });
    }
}));
// GET handler to get packages from getPackagePlans()
app.get('/packages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, country } = req.query;
        if (!type) {
            return res.status(400).json({ error: 'Missing required parameters: type' });
        }
        // Cast type to the expected union type, assuming valid input based on validation above
        const packageType = type;
        const packages = yield esimService.getPackagePlans(packageType, country);
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
//# sourceMappingURL=index.js.map