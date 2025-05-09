import * as fs from 'fs/promises';
import { AiraloService } from "@montarist/airalo-api";
import { accessSecretValue } from '../src/helper'
import { config } from "dotenv";

config();

async function callAiraloGetPackagesAndSaveMock() {
  // --- Start: Configuration ---
  const outputFilePath = 'test/mock/packagesResponse.json';
  // Configure the type and country for the packages request
  const type = 'global'; // e.g., 'local', 'regional', 'global'
  const country = ''; // e.g., 'US', 'FR', 'DE'
  // --- End: Configuration ---

  try {
    // Instantiate the AiraloService
    const clientId = process.env.AIRALO_CLIENT_ID;
    const clientSecret = await accessSecretValue("AIRALO_CLIENT_SECRET");
    const clientUrl = process.env.AIRALO_CLIENT_URL;

    const airaloService = new AiraloService({
      baseUrl: clientUrl,
      clientId,
      clientSecret
    });

    // Call the getPackages method
    const packages = await airaloService.getPackages({ type, country });

    // Write the response to the JSON file
    const jsonContent = JSON.stringify(packages, null, 2); // Use 2 for pretty printing
    await fs.writeFile(outputFilePath, jsonContent, 'utf-8');
    console.log(`Successfully wrote packages response from API call to ${outputFilePath}`);

  } catch (error) {
    console.error("Error during script execution:", error);
    // Optionally write error details to a file
    // await fs.writeFile('test/airaloApiError.json', JSON.stringify(error, null, 2), 'utf-8');
    // console.log('Wrote error details to test/airaloApiError.json');
  }
}

// Execute the function when the script is run
callAiraloGetPackagesAndSaveMock();