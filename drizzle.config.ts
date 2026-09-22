import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const isRemote = url.startsWith("libsql:") || Boolean(process.env.TURSO_AUTH_TOKEN);

export default defineConfig(
  isRemote
    ? {
        schema: "./src/db/schema.ts",
        out: "./src/db/migrations",
        dialect: "turso",
        dbCredentials: {
          url,
          authToken: process.env.TURSO_AUTH_TOKEN!,
        },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./src/db/migrations",
        dialect: "sqlite",
        dbCredentials: {
          url: "local.db",
        },
      }
);
