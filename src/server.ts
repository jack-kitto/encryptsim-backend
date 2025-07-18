import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import { onRequest } from "firebase-functions/https";
import noCache from "nocache";
import { getEnv } from "./env";
import { database } from "./firebase";
import { GCloudLogger } from './helper';
import { OrderHandler } from './order-handler';
import { AiraloSIMTopup, AiraloWrapper } from './services/airaloService';
import { DVPNService } from "./services/dVPNService";
import { SolanaService } from './services/solanaService';
import { TopupHandler } from './topup-handler';

config();

const app = express();

app.use(cors());
app.use(noCache());
app.use(compression());
app.use(bodyParser.json());


interface PaymentProfile {
  publicKey: string;
  privateKey: string;
}

let solanaService: SolanaService;
let airaloWrapper: AiraloWrapper;
let dVPNService: DVPNService;
let logger: GCloudLogger;
let orderHandler: OrderHandler;
let topupHandler: TopupHandler;

async function initializeServices() {
  logger = new GCloudLogger();
  solanaService = new SolanaService(logger);

  const useMockAiralo = getEnv().USE_MOCK_AIRALO === 'true'
  // const useMockAiralo = true
  airaloWrapper = new AiraloWrapper(database, logger, useMockAiralo);
  await airaloWrapper.initialize();

  dVPNService = new DVPNService();
  orderHandler = new OrderHandler(database, solanaService, airaloWrapper, logger);
  topupHandler = new TopupHandler(database, solanaService, airaloWrapper, logger);
}

app.get("/", (_, res) => {
  res.send(
    `API is up and running.`
  );
});

// === DVPN HANDLER ===

// Create device
app.post('/vpn/create-device', async (req, res) => {
  try {
    await initializeServices();
    const deviceInfo = await dVPNService.createDevice();
    logger.logINFO(`deviceInfo: ${JSON.stringify(deviceInfo)}`);

    return res.json({
      data: deviceInfo.data,
    });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Get countries
app.get('/vpn/countries/:deviceToken', async (req, res) => {
  try {
    await initializeServices();
    const { deviceToken } = req.params;

    const countries = await dVPNService.getCountries(deviceToken);
    logger.logINFO(`countries: ${JSON.stringify(countries)}`);
    if (countries.data.length === 0)
      return res.status(404).json({ error: 'No countries found' });

    return res.json({
      data: countries.data,
    });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to get countries' });
  }
});

// Get cities
app.get('/vpn/cities/:countryId', async (req, res) => {
  try {
    await initializeServices();
    const { countryId } = req.params;
    const { deviceToken } = req.query;

    if (!deviceToken)
      return res.status(400).json({ error: 'Missing deviceToken' });

    const cities = await dVPNService.getCities(deviceToken as string, countryId);
    logger.logINFO(`cities: ${JSON.stringify(cities)}`);

    if (cities.data.length === 0)
      return res.status(404).json({ error: 'No cities found' });

    return res.json({ data: cities.data });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to get cities' });
  }
});

// Get servers
app.get('/vpn/servers/:cityId', async (req, res) => {
  try {
    await initializeServices();
    const { cityId } = req.params;
    const { deviceToken } = req.query;

    if (!deviceToken)
      return res.status(400).json({ error: 'Missing deviceToken' });

    const servers = await dVPNService.getServers(deviceToken as string, cityId);
    logger.logINFO(`servers: ${JSON.stringify(servers)}`);
    if (servers.data.length === 0)
      return res.status(404).json({ error: 'No servers found' });

    return res.json({ data: servers.data });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to get servers' });
  }
});

// Create server credentials
app.post('/vpn/create-credentials/:serverId', async (req, res) => {
  try {
    await initializeServices();
    const { serverId } = req.params;
    const { deviceToken } = req.query;

    if (!deviceToken)
      return res.status(400).json({ error: 'Missing deviceToken' });

    const credentials = await dVPNService.createServerCredentials(
      deviceToken as string,
      serverId
    );
    logger.logINFO(`credentials: ${JSON.stringify(credentials)}`);

    const configText = dVPNService.buildWireGuardConf(credentials.data);
    logger.logINFO(`configText: ${JSON.stringify(configText)}`);

    return res.json({
      credentials: credentials,
      config: configText,
    });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to create credentials' });
  }
});

// Get all config to active VPN
app.post('/vpn/active', async (req, res) => {
  try {
    await initializeServices();
    const deviceInfo = await dVPNService.createDevice();

    const deviceToken = deviceInfo.data.token;
    const countries = await dVPNService.getCountries(deviceToken);
    if (countries.data.length === 0)
      return res.status(404).json({ error: 'No countries found' });

    const randomCountry = countries.data[Math.floor(Math.random() * countries.data.length)];
    const cities = await dVPNService.getCities(deviceToken, randomCountry.id);
    if (cities.data.length === 0)
      return res.status(404).json({ error: 'No cities found' });

    const randomCity = cities.data[Math.floor(Math.random() * cities.data.length)];
    const servers = await dVPNService.getServers(deviceToken, randomCity.id);
    if (servers.data.length === 0)
      return res.status(404).json({ error: 'No servers found' });

    const randomServer = servers.data[Math.floor(Math.random() * servers.data.length)];
    const credentials = await dVPNService.createServerCredentials(deviceToken, randomServer.id);

    const configWireGuard = dVPNService.buildWireGuardConf(credentials.data);
    logger.logINFO(`configWireGuard: ${JSON.stringify(configWireGuard)}`);

    return res.json({
      deviceToken: deviceToken,
      raw: credentials,
      configWireGuard: configWireGuard,
    });
  } catch (err: any) {
    logger?.logERROR(err?.response?.data || err);
    res.status(500).json({ error: 'Failed to get VPN configuration' });
  }
});

// === PAYMENT PROFILE HANDLER ===

app.post('/create-payment-profile', async (req: Request, res: Response) => {
  try {
    await initializeServices();
    const { publicKey, privateKey } = await solanaService.createNewSolanaWallet();
    const paymentProfile: PaymentProfile = { publicKey, privateKey };

    await database.ref(`/payment_profiles/${publicKey}`).set(paymentProfile);

    return res.status(200).json({ publicKey });
  } catch (error: any) {
    logger?.logERROR(`Error creating payment profile: ${error}`);
    return res.status(500).json({ error: "Failed to create payment profile" });
  }
});

// === ORDER HANDLER ===
app.post('/order', async (req, res) => {
  await initializeServices();
  return orderHandler.createOrder(req, res);
});

app.post('/add-order', async (req, res) => {
  await initializeServices();
  return orderHandler.addOrder(req, res);
});

app.get('/order/:orderId', async (req, res) => {
  await initializeServices();
  return orderHandler.queryOrder(req, res);
});

// === TOPUP HANDLER ===
app.post('/topup', async (req, res) => {
  await initializeServices();
  return topupHandler.createTopupOrder(req, res);
});

app.get('/topup/:orderId', async (req, res) => {
  await initializeServices();
  return topupHandler.queryTopUpOrder(req, res);
});

app.get('/payment-profile/topup/:ppPublicKey', async (req, res) => {
  await initializeServices();
  return topupHandler.queryPPTopupOrder(req, res);
});

app.get('/payment-profile/sim/:ppPublicKey', async (req, res) => {
  await initializeServices();
  return orderHandler.queryPPOrder(req, res);
});

// === SIM ENDPOINTS ===
app.get('/sim/:iccid/topups', async (req: Request, res: Response) => {
  try {
    await initializeServices();
    const { iccid } = req.params;

    if (!iccid) {
      return res.status(400).json({ error: 'Missing required parameter: iccid' });
    }

    const topups: AiraloSIMTopup[] = await airaloWrapper.getSIMTopups(iccid);

    if (!topups) {
      return res.status(500).json({ error: 'Failed to retrieve SIM top-ups' });
    }

    return res.json(topups);
  } catch (error: any) {
    logger?.logERROR(`Error getting top-ups for ICCID ${req.params.iccid}: ${error}`);
    const errorMessage = error.message || "Failed to retrieve SIM top-ups";
    return res.status(500).json({ error: errorMessage });
  }
});

app.get('/sim/:iccid/usage', async (req: Request, res: Response) => {
  try {
    await initializeServices();
    const { iccid } = req.params;

    if (!iccid) {
      return res.status(400).json({ error: 'Missing required parameter: iccid' });
    }

    const usage: any = await airaloWrapper.getDataUsage(iccid);
    return res.json(usage);
  } catch (error: any) {
    logger?.logERROR(`Error getting usage for ICCID ${req.params.iccid}: ${error}`);
    const errorMessage = error.message || "Failed to retrieve SIM usage";
    return res.status(500).json({ error: errorMessage });
  }
});

// === PACKAGES ENDPOINT ===
app.get('/packages', async (req: Request, res: Response) => {
  try {
    await initializeServices();
    const { type, country } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Missing required parameters: type' });
    }

    const packageType = type as 'global' | 'local' | 'regional';
    const packages = await airaloWrapper.getPackagePlans(packageType, country as string);

    if (packages === undefined) {
      return res.status(500).json({ error: 'Failed to retrieve package plans' });
    }

    return res.json(packages);
  } catch (error: any) {
    logger?.logERROR(`Error in /packages endpoint: ${error}`);
    return res.status(500).json({ error: "Failed to retrieve package plans" });
  }
});

// === ERROR LOGGING ===
app.post('/error', async (req: Request, res: Response) => {
  try {
    await initializeServices();
    const { message } = req.body;
    const errorLog = { message: message };

    const timestamp = new Date().toISOString();
    const timestampKey = timestamp.replace(/[^a-zA-Z0-9]/g, '_');
    await database.ref(`/error_logs/${timestampKey}`).set(errorLog);

    logger.logINFO(`error logged: ${message}`);
    return res.status(200).send("OK");
  } catch (error: any) {
    logger?.logERROR(`Error processing error log request: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Failed to process log request"
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  return res.send("OK");
});

/**
 * Exposed endpoints
 *
 * Emulator: http://localhost:5001/your-project-name/asia-east1/api/v1 
 * Live: https://asia-east1-your-project-name.cloudfunctions.net/api/v1
 */
export const api = onRequest(
  {
    region: 'asia-east1',
  },
  app
);
