import axios from 'axios';

const DVPN_BASE_URL = 'https://api.dvpnsdk.com';

export class DVPNService {
  private dvpnApiKey: string;

  constructor() {
    const dvpnApiKey = process.env.DVPN_API_KEY;

    if (!dvpnApiKey) {
      throw new Error('DVPN_API_KEY environment variable is not set.');
    }

    this.dvpnApiKey = dvpnApiKey;
  }

  public async getHealth() {
    return axios.get(`${DVPN_BASE_URL}/health`);
  }

  async getConfig() {
    return axios.get(`${DVPN_BASE_URL}/config`, {
      params: { app_token: this.dvpnApiKey },
    });
  }

  async createDevice(platform?: string) {
    const body: Record<string, any> = {
      app_token: this.dvpnApiKey,
    };

    if (platform) {
      body.platform = platform;
    }

    const res = await axios.post(`${DVPN_BASE_URL}/device`, body);
    return res.data.device_token;
  }

  async getCountries(deviceToken: string) {
    const res = await axios.get(`${DVPN_BASE_URL}/country?filter=WIREGUARD`, {
      headers: { 'x-device-token': deviceToken },
    });
    return res.data;
  }

  async getCities(countryId: string, deviceToken: string) {
    const res = await axios.get(`${DVPN_BASE_URL}/country/${countryId}/city`, {
      headers: {
        'x-device-token': deviceToken,
      },
      params: {
        filter: 'WIREGUARD',
      },
    });

    return res.data;
  }

  async getServers(deviceToken: string, cityId: string) {
    const res = await axios.get(`${DVPN_BASE_URL}/city/${cityId}/server?filter=WIREGUARD`, {
      headers: { 'x-device-token': deviceToken },
    });
    return res.data;
  }

  async createServerCredentials(deviceToken: string, serverId: string) {
    const res = await axios.post(`${DVPN_BASE_URL}/server/${serverId}/credentials`, {}, {
      headers: { 'x-device-token': deviceToken },
    });
    return res.data;
  }

  buildWireGuardConf(data: any) {
    return `[Interface]
      PrivateKey = ${data.private_key}
      Address = ${data.address}
      DNS = ${data.dns}
      
      [Peer]
      PublicKey = ${data.server_public_key}
      Endpoint = ${data.endpoint}
      AllowedIPs = 0.0.0.0/0
      `;
  }
}