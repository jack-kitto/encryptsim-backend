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
const node_fetch_1 = __importDefault(require("node-fetch"));
const API_URL = 'http://localhost:3000'; // Assuming your app runs on this port
describe('/order integration test', () => {
    it('should process an order and receive payment eventually', () => __awaiter(void 0, void 0, void 0, function* () {
        // --- START CUSTOM REQUEST BODY ---
        // Replace with your actual test data for the /order POST request
        const customOrderRequestBody = {
            ppPublicKey: 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76', // Replace with a valid test public key
            quantity: 1,
            package_id: 'asialink-3days-500mb', // Replace with a valid test package ID
            package_price: '1.53', // Replace with a valid test package price (as a string)
        };
        // --- END CUSTOM REQUEST BODY ---
        // 1. Post the order
        const postOrderResponse = yield (0, node_fetch_1.default)(`${API_URL}/order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customOrderRequestBody),
        });
        expect(postOrderResponse.ok).toBe(true);
        const orderResponseData = yield postOrderResponse.json();
        const orderId = orderResponseData.orderId;
        expect(orderId).toBeDefined();
        console.log(`Order placed with ID: ${orderId}`);
        console.log('Polling for payment status...');
        // 2. Poll for order status until payment is received
        const pollingInterval = 5000; // Poll every 5 seconds
        const pollingTimeout = 10 * 60 * 1000; // 10 minutes timeout
        const startTime = Date.now();
        let orderStatus = null;
        while (Date.now() - startTime < pollingTimeout) {
            const getOrderResponse = yield (0, node_fetch_1.default)(`${API_URL}/order/${orderId}`);
            if (getOrderResponse.status === 204) {
                console.log('Order information not yet available (204), waiting...');
                yield new Promise(resolve => setTimeout(resolve, pollingInterval));
                continue;
            }
            else if (getOrderResponse.status === 200) {
                orderStatus = yield getOrderResponse.json();
                console.log('Order status received (200):', orderStatus);
                if (orderStatus.paymentReceived && orderStatus.sim) {
                    console.log('Payment received and sim available!');
                    break; // Exit loop if payment is received
                }
            }
            else {
                // Handle unexpected status codes
                console.error(`Unexpected status code: ${getOrderResponse.status}`);
                // Depending on requirements, you might want to fail the test here
                // throw new Error(`Unexpected status code: ${getOrderResponse.status}`);
                break; // Exit loop on unexpected status
            }
            console.log('Payment not yet received, waiting...');
            yield new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
        // 3. Assert the final status
        expect(orderStatus).toBeDefined();
        expect(orderStatus === null || orderStatus === void 0 ? void 0 : orderStatus.orderId).toBe(orderId);
        expect(orderStatus === null || orderStatus === void 0 ? void 0 : orderStatus.paymentReceived).toBe(true);
        expect(orderStatus === null || orderStatus === void 0 ? void 0 : orderStatus.sim).toBeDefined();
        // You might want to add more assertions based on your expected order status
        // e.g., expect(orderStatus?.qrCode).toBeDefined();
        console.log('Integration test for /order completed successfully.');
        console.log('Final Order Sim:', orderStatus.sim);
    }), 11 * 60 * 1000); // Set Jest timeout for the test case to be longer than the polling timeout
});
//# sourceMappingURL=order.test.js.map