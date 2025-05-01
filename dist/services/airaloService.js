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
exports.AiraloService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const firebase_admin_1 = __importDefault(require("firebase-admin"));
class AiraloService {
    constructor() {
        this.apiUrl =
            process.env.AIRALO_API_URL || "https://sandbox-partners-api.airalo.com/v2";
        this.tokenUrl = `${this.apiUrl}/token`;
        this.accessToken = "";
        this.clientId = process.env.AIRALO_CLIENT_ID || "";
        this.clientSecret = process.env.AIRALO_CLIENT_SECRET || "";
        this.firebaseDatabaseUrl = process.env.FIREBASE_DB_URL || "";
        this.connectToFirebase();
    }
    connectToFirebase() {
        if (firebase_admin_1.default.apps.length === 0) {
            const serviceAccount = require("../../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json");
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
                databaseURL: this.firebaseDatabaseUrl,
            });
        }
        this.db = firebase_admin_1.default.database();
    }
    saveAccessToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.ref("/airalo/access_token").set(token);
            }
            catch (error) {
                console.error("Error saving access token to Firebase:", error);
            }
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formData = new URLSearchParams();
                formData.append("client_id", this.clientId);
                formData.append("client_secret", this.clientSecret);
                formData.append("grant_type", "client_credentials");
                const snapshot = yield this.db.ref("/airalo/access_token").once("value");
                const storedToken = snapshot.val();
                if (storedToken) {
                    return storedToken;
                }
                const response = yield axios_1.default.post(this.tokenUrl, formData, {
                    headers: {
                        Accept: "application/json",
                    },
                });
                this.accessToken = response.data.data.access_token;
                yield this.saveAccessToken(this.accessToken);
                return this.accessToken;
            }
            catch (error) {
                console.error("Error getting access token:", error);
                throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
            }
        });
    }
    placeOrder(orderDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = yield this.getAccessToken();
                const response = yield axios_1.default.post(`${this.apiUrl}/orders`, orderDetails, {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const sim = response.data.data.sims[0];
                return {
                    qrcode: sim.qrcode,
                    iccid: sim.iccid
                };
            }
            catch (error) {
                console.error('Error placing Airalo async order:', error);
                throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
            }
        });
    }
}
exports.AiraloService = AiraloService;
//# sourceMappingURL=airaloService.js.map