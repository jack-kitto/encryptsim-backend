import { EsimService } from "../src/services/airaloService";
import admin from "firebase-admin";
import { accessSecretJSON } from '../src/helper';
import { config } from "dotenv";

config()

async function initializeFirebase(): Promise<admin.database.Database> {
  // Initialize Firebase Admin SDK
  const firebaseDatabaseUrl: string = process.env.FIREBASE_DB_URL
  console.log(firebaseDatabaseUrl)
  if (admin.apps.length === 0){
    // Fetch the service account using the async function
    const serviceAccount = await accessSecretJSON('firebase-admin'); // Use the correct secret name

    console.log(serviceAccount)

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any), // Use the fetched service account
      databaseURL: firebaseDatabaseUrl,
    });
  }
  return admin.database(); // Assign the initialized database to the global variable
}

describe("AiraloService", () => {
  let esimService: EsimService;

  beforeEach(async () => {
    const db = await initializeFirebase();
    esimService = new EsimService(db);
    await esimService.initialize();
  }, 10000); // Increased timeout to 10 seconds for beforeEach

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

  // it("should call getSIMTopups successfully", async () => {
  //   const iccid = "89852351124620400870";
  //   const packages = await esimService.getSIMTopups(iccid);

  // });

  it("should call createTopupOrder successfully", async () => {
    const iccid = "89852351124620400870";
    const package_id = "asialink-7days-1gb-topup";
    const packages = await esimService.createTopupOrder({
      package_id: package_id,
      iccid: iccid,
      description: "Test",
    });

    expect(Array.isArray(packages)).toBe(true);
    // Further assertions could be added here to check the structure of the packages
    // if the API response structure is known and consistent.
    // const firstPackage = packages[0] as AiraloPackage;
    const firstPackage = packages[0]
    console.log(firstPackage)
  }, 10000); // Increased timeout to 10 seconds for the test as well
});
