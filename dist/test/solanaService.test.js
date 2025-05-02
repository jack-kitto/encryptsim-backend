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
dotenv_1.default.config();
const testPublicKey = 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76';
(0, globals_1.describe)('SolanaService.checkSolanaPayment', () => {
    let solanaService;
    solanaService = new solanaService_1.SolanaService();
    (0, globals_1.it)('should return true if the account has more than 10$ worth of SOL', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield solanaService.checkSolanaPayment(testPublicKey, '10');
        (0, globals_1.expect)(result.enoughReceived).toBe(true);
    }));
    (0, globals_1.it)('should return false if there is not enough balance', () => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield solanaService.checkSolanaPayment(testPublicKey, '1000000');
        (0, globals_1.expect)(result.enoughReceived).toBe(false);
    }));
    (0, globals_1.it)('should handle errors during API call and throw the error', () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidAddress = 'AbcdEFgHiJkLmNoPqrStUvWxYz1234567890';
        try {
            yield solanaService.checkSolanaPayment(invalidAddress, '0.005');
        }
        catch (error) {
            (0, globals_1.expect)(error.message).toContain("Non-base58 character");
        }
    }));
});
//# sourceMappingURL=solanaService.test.js.map