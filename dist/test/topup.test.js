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
const globals_1 = require("@jest/globals");
const solanaService_1 = require("../src/services/solanaService");
const dotenv_1 = __importDefault(require("dotenv"));
const helper_1 = require("../src/helper");
const topup_handler_1 = require("../src/topup-handler");
const uuid_1 = require("uuid");
dotenv_1.default.config();
const testPublicKey = 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76'; // ppPublicKey from your sample
(0, globals_1.describe)('TopupHandler Tests', () => {
    //npm test -- -t create-topup-order
    (0, globals_1.it)('create-topup-order', () => __awaiter(void 0, void 0, void 0, function* () {
        const orderId = (0, uuid_1.v4)();
        const db = yield (0, helper_1.initializeFirebase)();
        console.log("OrderId: ", orderId);
        const solanaService = new solanaService_1.SolanaService();
        const sol = yield solanaService.convertUSDToSOL(5);
        console.log("Sol: ", sol);
        const order = {
            orderId: orderId,
            ppPublicKey: "Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76",
            iccid: "89852351124640198082",
            quantity: 1,
            package_id: "asialink-7days-1gb-topup",
            paymentInSol: sol,
            package_price: "5",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending'
        };
        yield db.ref(`/topup_orders/${orderId}`).set(order);
    }), 5 * 60 * 1000);
    //npm test -- -t topup-handler
    (0, globals_1.it)('topup-handler', () => __awaiter(void 0, void 0, void 0, function* () {
        const db = yield (0, helper_1.initializeFirebase)();
        const solanaService = new solanaService_1.SolanaService();
        const order_id = "b7338341-e3e1-4bd2-9006-61ab015e1031";
        const topup = new topup_handler_1.TopupHandler(db, solanaService, null);
        let order = yield topup.getTopupOrder(order_id);
        order = yield topup.processPayment(order);
        (0, globals_1.expect)(order.status).toBe('paid');
    }), 5 * 60 * 1000);
});
//# sourceMappingURL=topup.test.js.map