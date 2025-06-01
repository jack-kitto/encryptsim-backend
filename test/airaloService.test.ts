import { AiraloWrapper } from "../src/services/airaloService";
import { MockAiraloWrapper } from "./mock/mockAiraloWrapper";
import { config } from "dotenv";

config()

describe("AiraloService", () => {
  let airaloWrapper: AiraloWrapper;

  beforeEach(async () => {
    airaloWrapper = new AiraloWrapper(null, null);
    await airaloWrapper.initialize()
  }, 10000); // Increased timeout to 10 seconds for beforeEach

  // This test now acts as an integration test, calling the actual service
  it("should call getPackagePlans successfully", async () => {
    // Note: This test requires a network connection and potentially valid API keys
    // to successfully fetch real data from the Airalo API.
    // The assertion checks if the result is an array of packages.
    const packages = await airaloWrapper.getPackagePlans("local", "US");

    expect(Array.isArray(packages)).toBe(true);
    // Further assertions could be added here to check the structure of the packages
    // if the API response structure is known and consistent.
    // const firstPackage = packages[0] as AiraloPackage;
    const firstPackage = packages[0]
    console.log(firstPackage)
  });

  

  it("should call getSIMTopups successfully", async () => {
    const iccid = "89852351124620400870";
    const packages = await airaloWrapper.getSIMTopups(iccid);

  });

  // 
  it("sim-details", async() => {
    const iccid = "89852351124730070654";
    const details = await airaloWrapper.getSIMDetails(iccid);
    console.log(details)
  })

  // it("should call createTopupOrder successfully", async () => {
  //   const iccid = "89852351124620400870";
  //   const package_id = "asialink-7days-1gb-topup";
  //   const packages = await airaloWrapper.createTopupOrder({
  //     package_id: package_id,
  //     iccid: iccid,
  //     description: "Test",
  //   });

  //   expect(Array.isArray(packages)).toBe(true);
  //   // Further assertions could be added here to check the structure of the packages
  //   // if the API response structure is known and consistent.
  //   // const firstPackage = packages[0] as AiraloPackage;
  //   const firstPackage = packages[0]
  //   console.log(firstPackage)
  // }, 10000); // Increased timeout to 10 seconds for the test as well
});
