import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const rawUrl =
  process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_URL ||
  process.env.STORAGE_URL ||
  process.env.TURSO_DB_URL;

const url = rawUrl || (isProduction ? ":memory:" : "file:local.db");

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.TURSO_TOKEN ||
  process.env.STORAGE_AUTH_TOKEN ||
  undefined;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
export * from "./schema";
