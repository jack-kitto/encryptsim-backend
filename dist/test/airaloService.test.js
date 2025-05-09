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
const airaloService_1 = require("../src/services/airaloService");
describe("AiraloService", () => {
    let esimService;
    beforeEach(() => {
        esimService = new airaloService_1.EsimService();
    });
    // This test now acts as an integration test, calling the actual service
    // it("should call getPackagePlans successfully", async () => {
    //   // Note: This test requires a network connection and potentially valid API keys
    //   // to successfully fetch real data from the Airalo API.
    //   // The assertion checks if the result is an array of packages.
    //   const packages = await esimService.getPackagePlans("local", "US");
    //   expect(Array.isArray(packages)).toBe(true);
    //   // Further assertions could be added here to check the structure of the packages
    //   // if the API response structure is known and consistent.
    //   // const firstPackage = packages[0] as AiraloPackage;
    //   const firstPackage = packages[0]
    //   console.log(firstPackage)
    // });
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
    }));
});
//# sourceMappingURL=airaloService.test.js.map