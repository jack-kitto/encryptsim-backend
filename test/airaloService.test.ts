import { EsimService } from "../src/services/airaloService";
import { AiraloPackage } from "@montarist/airalo-api";

describe("AiraloService", () => {
  let esimService: EsimService;

  beforeEach(() => {
    esimService = new EsimService();
  });

  // This test now acts as an integration test, calling the actual service
  it("should call getPackagePlans successfully", async () => {
    // Note: This test requires a network connection and potentially valid API keys
    // to successfully fetch real data from the Airalo API.
    // The assertion checks if the result is an array of packages.
    const packages = await esimService.getPackagePlans("local", "US");

    expect(Array.isArray(packages)).toBe(true);
    // Further assertions could be added here to check the structure of the packages
    // if the API response structure is known and consistent.
    // const firstPackage = packages[0] as AiraloPackage;
    const firstPackage = packages[0]
    console.log(firstPackage)
  });
});
