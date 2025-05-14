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
const order_handler_1 = require("./order-handler");
const topup_handler_1 = require("./topup-handler");
// Declare db outside the async function so it's accessible later
let db;
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dotenv_1.config)();
let solanaService;
let airaloWrapper;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        db = yield (0, helper_1.initializeFirebase)();
        solanaService = new solanaService_1.SolanaService();
        airaloWrapper = new airaloService_1.AiraloWrapper(db);
        yield airaloWrapper.initialize();
        const orderHandler = new order_handler_1.OrderHandler(db, solanaService, airaloWrapper);
        const topupHandler = new topup_handler_1.TopupHandler(db, solanaService, airaloWrapper);
        // === PAYMENT PROFILE HANDLER ===
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
        app.post('/topup', topupHandler.createTopupOrder);
        app.get('/topup/:orderId', topupHandler.queryTopUpOrder);
        app.get('/payment-profile/topup/:ppPublicKey', topupHandler.queryPPTopupOrder);
        app.get('/payment-profile/sim/:ppPublicKey', orderHandler.queryPPOrder);
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
        app.get('/sim/:iccid/usage', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { iccid } = req.params;
                if (!iccid) {
                    return res.status(400).json({ error: 'Missing required parameter: iccid' });
                }
                const topups = yield airaloWrapper.getDataUsage(iccid);
                // if (!topups) {
                //   // This typically means the service encountered an error it couldn't recover from,
                //   // or the method in the service is designed to return undefined in some error cases.
                //   return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
                // }
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