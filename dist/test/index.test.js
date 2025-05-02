"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = require("../src/index"); // Assuming you are testing updatePaymentProfileWithOrder
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const firebaseDatabaseUrl = process.env.FIREBASE_DB_URL || "";
if (firebase_admin_1.default.apps.length === 0) {
    const serviceAccount = require("../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json");
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
        databaseURL: firebaseDatabaseUrl,
    });
}
const db = firebase_admin_1.default.database();
const paymentProfilesRef = db.ref('payment_profiles');
describe('updatePaymentProfileWithOrder', () => {
    const ppPublicKey = 'testPublicKeyMultiOrders';
    const testRef = paymentProfilesRef.child(ppPublicKey); // Reference to the test location
    // Helper function to get the orderIds array from the database
    function getOrderIds() {
        return __awaiter(this, void 0, void 0, function* () {
            const snapshot = yield testRef.once('value');
            if (snapshot.exists() && snapshot.hasChild('orderIds')) {
                return snapshot.val().orderIds;
            }
            else {
                return [];
            }
        });
    }
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clear any existing data in the test location before each test
        yield testRef.remove().catch(error => {
            console.error("Error during cleanup:", error);
        });
    }));
    it('should correctly add multiple orderIds to orderIds array', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderIdsToAdd = ['orderId1', 'orderId2', 'orderId3'];
        const initialOrderIds = ['existingOrderId1', 'existingOrderId2'];
        // Set initial data
        yield testRef.set({ orderIds: initialOrderIds });
        // Add each orderId sequentially
        for (const orderId of orderIdsToAdd) {
            yield (0, index_1.updatePaymentProfileWithOrder)(ppPublicKey, orderId);
        }
        const snapshot = yield testRef.once('value');
        const data = snapshot.val();
        expect(snapshot.exists()).toBe(true);
        expect(data.orderIds.length).toBe(initialOrderIds.length + orderIdsToAdd.length);
        expect(data.orderIds).toEqual([...initialOrderIds, ...orderIdsToAdd]);
    }));
    it('should create orderIds array and add orderId if it does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = 'testOrderId';
        yield (0, index_1.updatePaymentProfileWithOrder)(ppPublicKey, orderId);
        const orderIds = yield getOrderIds();
        expect(orderIds).toEqual([orderId]);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up any data left in the test location after each test
        yield testRef.remove().catch(error => {
            console.error("Error during cleanup:", error);
        });
    }));
});
//# sourceMappingURL=index.test.js.map