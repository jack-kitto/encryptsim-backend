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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsimService = void 0;
const dotenv_1 = require("dotenv");
const airalo_api_1 = require("@montarist/airalo-api");
const admin = __importStar(require("firebase-admin"));
(0, dotenv_1.config)();
class EsimService {
    constructor() {
        this.firebaseDatabaseUrl = process.env.FIREBASE_DB_URL || "";
        this.connectToFirebase();
        const clientId = process.env.AIRALO_CLIENT_ID;
        const clientSecret = process.env.AIRALO_CLIENT_SECRET;
        const clientUrl = process.env.AIRALO_CLIENT_URL;
        if (!clientId) {
            throw new Error("AIRALO_CLIENT_ID environment variable is not set.");
        }
        if (!clientSecret) {
            throw new Error("AIRALO_CLIENT_SECRET environment variable is not set.");
        }
        this.airaloService = new airalo_api_1.AiraloService({
            baseUrl: clientUrl,
            clientId,
            clientSecret
        });
    }
    connectToFirebase() {
        if (admin.apps.length === 0) {
            const serviceAccount = require("../../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: this.firebaseDatabaseUrl,
            });
        }
        this.db = admin.database();
    }
    placeOrder(orderDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.airaloService.createOrder({
                    package_id: orderDetails.package_id,
                    quantity: orderDetails.quantity,
                    type: "sim",
                });
                const sim = response.sims[0];
                return {
                    qrcode: sim.qr_code,
                    iccid: sim.iccid,
                    activationCode: sim.activation_code,
                };
            }
            catch (error) {
                console.error("Error placing Airalo order:", error);
                throw new Error(error.message);
            }
        });
    }
    getPackagePlans(type, country) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const packages = yield this.airaloService.getPackages({
                    type,
                    country
                });
                const exportedPackages = packages.data.map((pkg) => ({
                    id: pkg.id,
                    region: pkg.region,
                    country: pkg.country,
                    price: pkg.price,
                    data: pkg.data_amount,
                    days: pkg.validity_period,
                }));
                return exportedPackages;
            }
            catch (error) {
                console.error("Error syncing package plans:", error);
                return undefined; // Explicitly return undefined on error
            }
        });
    }
}
exports.EsimService = EsimService;
//# sourceMappingURL=airaloService.js.map