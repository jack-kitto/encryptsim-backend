import axios from "axios";
import { config } from "dotenv";
config();
import admin from "firebase-admin";


interface PlaceOrderResponse {  
    qrcode: string;
    iccid: string;
}

interface Sim {
  iccid: string;
  qrcode: string;
}

export interface OrderDetails {
  quantity: number;
  package_id: string;
}

export class AiraloService {
  private apiUrl: string; // Base URL for Airalo API
  private accessToken: string; // Store the token here
  private clientId: string;
  private clientSecret: string;
  private tokenUrl: string;
  private db: admin.database.Database;
  private firebaseDatabaseUrl: string;

  constructor() {
    this.apiUrl =
      process.env.AIRALO_API_URL || "https://sandbox-partners-api.airalo.com/v2";
    this.tokenUrl = `${this.apiUrl}/token`;
    this.accessToken = "";
    this.clientId = process.env.AIRALO_CLIENT_ID || "";
    this.clientSecret = process.env.AIRALO_CLIENT_SECRET || "";
    this.firebaseDatabaseUrl = process.env.FIREBASE_DB_URL || "";
    this.connectToFirebase();
  }

  private connectToFirebase(): void {
    if (admin.apps.length === 0){
      const serviceAccount = require("../../esim-a3042-firebase-adminsdk-fbsvc-09dcd371d1.json"); 
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: this.firebaseDatabaseUrl,
      });
    }
    this.db = admin.database();
  }

  private async saveAccessToken(token: string): Promise<void> {
    try {
      await this.db.ref("/airalo/access_token").set(token);
    } catch (error: any) {
      console.error("Error saving access token to Firebase:", error);
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      const formData = new URLSearchParams();
      formData.append("client_id", this.clientId);
      formData.append("client_secret", this.clientSecret);
      formData.append("grant_type", "client_credentials");

      const snapshot = await this.db.ref("/airalo/access_token").once("value");
      const storedToken = snapshot.val();

      if (storedToken) {
        return storedToken;
      }

      const response = await axios.post(this.tokenUrl, formData, {
        headers: {
          Accept: "application/json",
        },
      });

      this.accessToken = response.data.data.access_token;
      await this.saveAccessToken(this.accessToken);
      return this.accessToken;
    } catch (error: any) {
      console.error("Error getting access token:", error);
      throw new Error(
        error.response ? JSON.stringify(error.response.data) : error.message
      );
    }
  }

  async placeOrder(
    orderDetails: OrderDetails
  ): Promise<PlaceOrderResponse> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${this.apiUrl}/orders`,
        orderDetails, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }); 
      const sim: Sim = response.data.data.sims[0]
      return {
        qrcode: sim.qrcode,
        iccid: sim.iccid
      };
    } catch (error: any) {
      console.error('Error placing Airalo async order:', error);
      throw new Error(error.response ? JSON.stringify(error.response.data) : error.message);
    }
  }
}
