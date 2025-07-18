import { z } from "zod";
import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  server: {
    // Airalo
    AIRALO_CLIENT_ID: z.string(),
    AIRALO_CLIENT_URL: z.string().url(),
    AIRALO_CLIENT_SECRET: z.string(),
    USE_MOCK_AIRALO: z.enum(["true", "false"]),

    // GCP/Firebase
    FIREBASE_DB_URL: z.string().url(),
    GCLOUD_PROJ_ID: z.string(),

    // Quiknode
    SOLANA_RPC_URL: z.string().url(),

    // Solana public key
    SOLANA_MASTER_PK: z.string(),

    // DVPN
    DVPN_API_KEY: z.string(),
    DVPN_BASE_URL: z.string().url(),

    // Server Config
    // PORT: z.string().regex(/^\d+$/, "PORT must be a number"),
  },
  runtimeEnv: process.env,
});
