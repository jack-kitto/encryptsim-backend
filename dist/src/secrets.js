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
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessSecretJSON = accessSecretJSON;
exports.accessSecretValue = accessSecretValue;
const secret_manager_1 = require("@google-cloud/secret-manager");
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
//# sourceMappingURL=secrets.js.map