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
exports.DBHandler = void 0;
exports.accessSecretJSON = accessSecretJSON;
exports.accessSecretValue = accessSecretValue;
exports.initializeFirebase = initializeFirebase;
const secret_manager_1 = require("@google-cloud/secret-manager");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const client = new secret_manager_1.SecretManagerServiceClient();
function accessSecretJSON(secretName_1) {
    return __awaiter(this, arguments, void 0, function* (secretName, versionId = 'latest') {
        var _a, _b;
        const [version] = yield client.accessSecretVersion({
            name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
        });
        const payload = (_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
        if (!payload) {
            throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
        }
        return JSON.parse(payload);
    });
}
function accessSecretValue(secretName_1) {
    return __awaiter(this, arguments, void 0, function* (secretName, versionId = 'latest') {
        var _a, _b;
        const [version] = yield client.accessSecretVersion({
            name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
        });
        const payload = (_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
        if (!payload) {
            throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
        }
        return payload;
    });
}
function initializeFirebase() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize Firebase Admin SDK
        const firebaseDatabaseUrl = process.env.FIREBASE_DB_URL;
        if (firebase_admin_1.default.apps.length === 0) {
            // Fetch the service account using the async function
            const serviceAccount = yield accessSecretJSON('firebase-admin'); // Use the correct secret name
            if (serviceAccount) {
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount), // Use the fetched service account
                    databaseURL: firebaseDatabaseUrl,
                });
            }
            else {
                throw new Error('Failed to authenticate Firebase');
            }
        }
        return firebase_admin_1.default.database(); // Assign the initialized database to the global variable
    });
}
class DBHandler {
    constructor(db) {
        this.db = db;
    }
    getPaymentProfile(ppPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const ppSnapshot = yield this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
            const pp = ppSnapshot.val();
            return pp;
        });
    }
    updatePPOrder(ppPublicKey, order_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const ppRef = this.db.ref(`/payment_profiles/${ppPublicKey}`);
            const ppSnapshot = yield ppRef.once('value');
            const pp = ppSnapshot.val();
            let orderIds = [];
            if (pp && pp.orderIds) {
                orderIds = pp.orderIds;
            }
            orderIds.push(order_id);
            yield ppRef.update({ orderIds });
        });
    }
}
exports.DBHandler = DBHandler;
//# sourceMappingURL=helper.js.map