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
exports.MockAiraloWrapper = void 0;
const fs = __importStar(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const airaloService_1 = require("../../src/services/airaloService");
class MockAiraloWrapper {
    constructor() {
        this.mockDataPath = path_1.default.join(__dirname, '..', 'mock-data', 'asialink-3days-500mb.json');
        this.mockPackagesPath = path_1.default.join(__dirname, '..', 'mock-data', 'packages-global.json');
        console.log("MockAiraloService initialized. Using mock data from:", this.mockDataPath);
    }
    // Mock implementation of the placeOrder method
    placeOrder(orderDetails // Keep the expected signature
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("MockAiraloService.placeOrder called with:", orderDetails);
            try {
                // Read the content of the mock JSON file
                const response = yield fs.readFile(this.mockDataPath, 'utf-8');
                // Parse the JSON content
                const data_json = JSON.stringify(response);
                const parsed_sim = JSON.parse(data_json);
                const sims = parsed_sim.data.sims;
                const sim = sims[0];
                console.log('received sims: ', sims);
                return {
                    iccid: sim.iccid,
                    qrcode: sim.qrcode,
                    qrcode_url: sim.qrcode_url,
                    created_at: sim.created_at,
                    direct_apple_installation_url: sim.direct_apple_installation_url
                };
            }
            catch (error) {
                console.error("Error reading or parsing mock data file:", this.mockDataPath, error);
                // Depending on your testing needs, you might want to throw the error
                // or return a specific error structure.
                throw new Error(`Failed to load mock data from ${this.mockDataPath}: ${error}`);
            }
        });
    }
    // Mock implementation of getPackagePlans
    getPackagePlans(type, country) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fs.readFile(this.mockPackagesPath, 'utf-8');
                const packages = JSON.parse(response);
                return (0, airaloService_1.parsePackageResponse)(packages.data);
            }
            catch (error) {
                console.error("Error reading or parsing mock packages file:", this.mockPackagesPath, error);
                throw new Error(`Failed to load mock packages data from ${this.mockPackagesPath}: ${error}`);
            }
        });
    }
}
exports.MockAiraloWrapper = MockAiraloWrapper;
//# sourceMappingURL=mockAiraloWrapper.js.map