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
const fs = __importStar(require("fs/promises"));
const airalo_api_1 = require("@montarist/airalo-api");
const helper_1 = require("../src/helper");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function callAiraloGetPackagesAndSaveMock() {
    return __awaiter(this, void 0, void 0, function* () {
        // --- Start: Configuration ---
        const outputFilePath = 'test/mock/packagesResponse.json';
        // Configure the type and country for the packages request
        const type = 'global'; // e.g., 'local', 'regional', 'global'
        const country = ''; // e.g., 'US', 'FR', 'DE'
        // --- End: Configuration ---
        try {
            // Instantiate the AiraloService
            const clientId = process.env.AIRALO_CLIENT_ID;
            const clientSecret = yield (0, helper_1.accessSecretValue)("AIRALO_CLIENT_SECRET");
            const clientUrl = process.env.AIRALO_CLIENT_URL;
            const airaloService = new airalo_api_1.AiraloService({
                baseUrl: clientUrl,
                clientId,
                clientSecret
            });
            // Call the getPackages method
            const packages = yield airaloService.getPackages({ type, country });
            // Write the response to the JSON file
            const jsonContent = JSON.stringify(packages, null, 2); // Use 2 for pretty printing
            yield fs.writeFile(outputFilePath, jsonContent, 'utf-8');
            console.log(`Successfully wrote packages response from API call to ${outputFilePath}`);
        }
        catch (error) {
            console.error("Error during script execution:", error);
            // Optionally write error details to a file
            // await fs.writeFile('test/airaloApiError.json', JSON.stringify(error, null, 2), 'utf-8');
            // console.log('Wrote error details to test/airaloApiError.json');
        }
    });
}
// Execute the function when the script is run
callAiraloGetPackagesAndSaveMock();
//# sourceMappingURL=callAiraloGetPackagesAndSaveMock.js.map