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
const airaloService = new airaloService_1.AiraloService();
const solanaService = new solanaService_1.SolanaService();
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dotenv_1.config)();
// Placeholder for Solana Master Wallet Keypair (replace with your actual keypair)
const solanaMasterPK = process.env.SOLANA_MASTER_PK;
const orders = {};
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
// 1. Receive Order (POST)
app.post('/order', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = Math.random().toString(36).substring(7); // Generate a unique order ID
    const { publicKey, quantity, package_id, package_price } = req.body;
    const order = {
        orderId,
        publicKey,
        quantity,
        package_id,
        package_price
    };
    orders[orderId] = order;
    // Simulate querying address for payment (in a real app, use a listener)
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        // Check if payment was received (this is just a simulation)
        const paymentReceived = yield solanaService.checkSolanaPayment(order.publicKey, order.package_price);
        if (paymentReceived) {
            order.paymentReceived = true;
            const { qrcode, iccid } = yield airaloService.placeOrder({ quantity, package_id });
            order.qrCode = qrcode;
            order.iccid = iccid;
            // aggregate payment to master wallet
            const paymentProfile = yield db.ref(`/payment_profiles/${order.publicKey}`).once("value");
            const privateKey = paymentProfile.val().privateKey;
            yield solanaService.aggregatePaymentToMasterWallet(privateKey, paymentReceived);
        }
    }), 10000); // Check after 10 seconds (in real app, listen for changes)
    res.json({ orderId, publicKey });
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