import * as fs from 'fs/promises';
import path from 'path';
import { parsePackageResponse } from '../../src/services/airaloService'

// Define the expected structure for order details, if needed by the mock
interface OrderDetails {
  package_id: string;
  quantity: number;
  // Add other properties if placeOrder expects them
}

interface TopupOrderDetails {
  iccid: string;
  package_id: string;
}

export class MockAiraloWrapper {

  private mockDataPath = path.join(__dirname,'..', 'mock-data', 'asialink-3days-500mb.json');
  private mockPackagesPath = path.join(__dirname,'..', 'mock-data', 'packages-global.json');

  constructor() {
    console.log("MockAiraloService initialized. Using mock data from:", this.mockDataPath);
  }

  // Mock implementation of the placeOrder method
  public async placeOrder(
    orderDetails: OrderDetails // Keep the expected signature
  ): Promise<any> {
    console.log("MockAiraloService.placeOrder called with:", orderDetails);

    try {
      // Read the content of the mock JSON file
      const response = await fs.readFile(this.mockDataPath, 'utf-8');
      
      // Parse the JSON content
      const data_json = JSON.stringify(response);
      const parsed_sim = JSON.parse(data_json);
      const sims = parsed_sim.data.sims
      const sim = sims[0]
      console.log('received sims: ', sims)

      return {
        iccid: sim.iccid,
        qrcode: sim.qrcode,
        qrcode_url: sim.qrcode_url,
        created_at: sim.created_at,
        direct_apple_installation_url: sim.direct_apple_installation_url
      };
    } catch (error) {
      console.error("Error reading or parsing mock data file:", this.mockDataPath, error);
      // Depending on your testing needs, you might want to throw the error
      // or return a specific error structure.
      throw new Error(`Failed to load mock data from ${this.mockDataPath}: ${error}`);
    }
  }

  // Mock implementation of getPackagePlans
  public async getPackagePlans(type: string, country?: string): Promise<any[]> {
    try {
      const response = await fs.readFile(this.mockPackagesPath, 'utf-8');
      const packages = JSON.parse(response);
      
      return parsePackageResponse(packages.data)
    } catch (error) {
      console.error("Error reading or parsing mock packages file:", this.mockPackagesPath, error);
      throw new Error(`Failed to load mock packages data from ${this.mockPackagesPath}: ${error}`);
    }
  }

  // Mock implementation of the createTopupOrder method
  public async createTopupOrder(
    orderDetails: TopupOrderDetails // Keep the expected signature
  ): Promise<any> {
    console.log("MockAiraloService.placeOrder called with:", orderDetails);

    try {
      // Read the content of the mock JSON file
      const response = await fs.readFile(this.mockDataPath, 'utf-8');
      
      // Parse the JSON content
      const data_json = JSON.stringify(response);
      const parsed_sim = JSON.parse(data_json);
      const topups = parsed_sim.data.topups;
      const topup = topups[0]
      console.log('received sims: ', topups)

      return {
        id: topup.id,
        qrcode_installation: topup.qrcode_installation,
        package_id: topup.package_id,
        data: topup.data
      };
    } catch (error) {
      console.error("Error reading or parsing mock data file:", this.mockDataPath, error);
      // Depending on your testing needs, you might want to throw the error
      // or return a specific error structure.
      throw new Error(`Failed to load mock data from ${this.mockDataPath}: ${error}`);
    }
  }

}
