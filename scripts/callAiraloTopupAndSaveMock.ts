import * as fs from 'fs/promises';
import { AiraloService } from "@montarist/airalo-api";
import { accessSecretValue } from '../src/helper'
import { config } from "dotenv";

config();

async function callAiraloServiceAndSaveMock() {
  // --- Start: Configuration ---
  const outputFilePath = 'test/mockTopupResponse.json';
  // --- End: Configuration ---

  try {
    // --- Start: Your Actual Service Call Implementation ---
    // TODO: Replace this section with the code to get your airaloService instance
    // and call the createOrder method.
    // Example (replace with your actual import and instantiation logic):
    ; // Adjust the import path
    const clientId = process.env.AIRALO_CLIENT_ID;
    const clientSecret = await accessSecretValue("AIRALO_CLIENT_SECRET");
    const clientUrl = process.env.AIRALO_CLIENT_URL;

    const airaloService = new AiraloService({ 
      baseUrl: clientUrl,
      clientId, 
      clientSecret
    }); // Adjust instantiation with dependencies

    // TODO: Replace the line below with your actual API call:
    const params: any = {
      package_id: "",
      iccid: "89852351124630223866",
      description: ""
    }
    const response = await airaloService.createTopupOrder(params);

    // Write the response to the JSON file
    const jsonContent = JSON.stringify(response, null, 2); // Use 2 for pretty printing
    await fs.writeFile(outputFilePath, jsonContent, 'utf-8');
    console.log(`Successfully wrote response from API call to ${outputFilePath}`);

  } catch (error) {
    console.error("Error during script execution:", error);
    // Optionally write error details to a file
    // await fs.writeFile('test/airaloApiError.json', JSON.stringify(error, null, 2), 'utf-8');
    // console.log('Wrote error details to test/airaloApiError.json');
  }
}

// Execute the function when the script is run
callAiraloServiceAndSaveMock();

// To run this script:
// 1. Make sure you have Node.js and TypeScript installed.
// 2. You might need to install ts-node: npm install -g ts-node
// 3. You might need to install @types/node: npm install @types/node --save-dev
// 4. Implement the actual API call logic in the script.
// 5. Run using: ts-node scripts/callAiraloTopupAndSaveMock.ts
