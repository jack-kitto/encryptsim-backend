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
const airaloService_1 = require("../src/services/airaloService");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const secrets_1 = require("../src/secrets");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function initializeFirebase() {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize Firebase Admin SDK
        const firebaseDatabaseUrl = process.env.FIREBASE_DB_URL;
        console.log(firebaseDatabaseUrl);
        if (firebase_admin_1.default.apps.length === 0) {
            // Fetch the service account using the async function
            const serviceAccount = yield (0, secrets_1.accessSecretJSON)('firebase-admin'); // Use the correct secret name
            console.log(serviceAccount);
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount), // Use the fetched service account
                databaseURL: firebaseDatabaseUrl,
            });
        }
        return firebase_admin_1.default.database(); // Assign the initialized database to the global variable
    });
}
describe("AiraloService", () => {
    let esimService;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const db = yield initializeFirebase();
        esimService = new airaloService_1.EsimService(db);
        yield esimService.initialize();
    }), 10000); // Increased timeout to 10 seconds for beforeEach
    // This test now acts as an integration test, calling the actual service
    it("should call getPackagePlans successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        // Note: This test requires a network connection and potentially valid API keys
        // to successfully fetch real data from the Airalo API.
        // The assertion checks if the result is an array of packages.
        const packages = yield esimService.getPackagePlans("local", "US");
        expect(Array.isArray(packages)).toBe(true);
        // Further assertions could be added here to check the structure of the packages
        // if the API response structure is known and consistent.
        // const firstPackage = packages[0] as AiraloPackage;
        const firstPackage = packages[0];
        console.log(firstPackage);
    }));
    // it("should call getSIMTopups successfully", async () => {
    //   const iccid = "89852351124620400870";
    //   const packages = await esimService.getSIMTopups(iccid);
    // });
    it("should call createTopupOrder successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        const iccid = "89852351124620400870";
        const package_id = "asialink-7days-1gb-topup";
        const packages = yield esimService.createTopupOrder({
            package_id: package_id,
            iccid: iccid,
            description: "Test",
        });
        expect(Array.isArray(packages)).toBe(true);
        // Further assertions could be added here to check the structure of the packages
        // if the API response structure is known and consistent.
        // const firstPackage = packages[0] as AiraloPackage;
        const firstPackage = packages[0];
        console.log(firstPackage);
    }), 10000); // Increased timeout to 10 seconds for the test as well
});
//# sourceMappingURL=airaloService.test.js.map