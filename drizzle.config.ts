import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_URL ||
  process.env.STORAGE_URL ||
  process.env.TURSO_DB_URL ||
  "file:local.db";

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.TURSO_TOKEN ||
  process.env.STORAGE_AUTH_TOKEN ||
  undefined;

const isRemote = url.startsWith("libsql:") || Boolean(authToken);

export default defineConfig(
  isRemote
    ? {
        schema: "./src/db/schema.ts",
        out: "./src/db/migrations",
        dialect: "turso",
        dbCredentials: {
          url,
          authToken: authToken!,
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
