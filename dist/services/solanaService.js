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
exports.SolanaService = void 0;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
class SolanaService {
    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL;
        if (!rpcUrl) {
            throw new Error('SOLANA_RPC_URL environment variable is not set.');
        }
        this.connection = new web3_js_1.Connection(rpcUrl);
    }
    createNewSolanaWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const newWallet = web3_js_1.Keypair.generate();
            const publicKey = newWallet.publicKey.toBase58();
            const privateKey = JSON.stringify(Array.from(newWallet.secretKey));
            return { publicKey, privateKey };
        });
    }
    checkSolanaPayment(address, expectedAmountUSD) {
        return __awaiter(this, void 0, void 0, function* () {
            // Convert expected amount from string to number
            const expectedAmountUSDNumber = parseFloat(expectedAmountUSD);
            const publicKey = new web3_js_1.PublicKey(address);
            const balance = yield this.connection.getBalance(publicKey);
            const solBalance = balance / web3_js_1.LAMPORTS_PER_SOL;
            // Fetch SOL price from Coingecko
            const solPrice = yield this.fetchSolPrice();
            if (!solPrice) {
                throw new Error("Could not fetch SOL price");
            }
            // Convert expected amount in USD to SOL
            const expectedAmountSOL = expectedAmountUSDNumber / solPrice;
            const enoughReceived = solBalance >= expectedAmountSOL;
            return { enoughReceived, solBalance };
        });
    }
    fetchSolPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                return response.data.solana.usd;
            }
            catch (error) {
                console.error('Error fetching SOL price from Coingecko:', error);
                return null;
            }
        });
    }
    aggregatePaymentToMasterWallet(sourcePrivateKey, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const sourceWallet = web3_js_1.Keypair.fromSecretKey(new Uint8Array(JSON.parse(sourcePrivateKey)));
            const lamports = amount * web3_js_1.LAMPORTS_PER_SOL;
            const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey: sourceWallet.publicKey,
                toPubkey: this.masterWallet.publicKey,
                lamports: lamports,
            }));
            const signature = yield this.connection.sendTransaction(transaction, [sourceWallet]);
            yield this.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        });
    }
}
exports.SolanaService = SolanaService;
//# sourceMappingURL=solanaService.js.map