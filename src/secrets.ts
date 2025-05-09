import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function accessSecretJSON(secretName: string, versionId = 'latest'): Promise<any> {
  const [version] = await client.accessSecretVersion({
    name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
  }
  return JSON.parse(payload)
}

export async function accessSecretValue(secretName: string, versionId = 'latest'): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/esim-a3042/secrets/${secretName}/versions/${versionId}`,
  });

  const payload = version.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Secret ${secretName} version ${versionId} has no data.`);
  }
  return payload
}