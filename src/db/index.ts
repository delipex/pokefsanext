import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const rawUrl =
  process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_URL ||
  process.env.STORAGE_URL ||
  process.env.TURSO_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.LIBSQL_URL ||
  process.env.TURSO_DATABASE_URL_UNPOOLED ||
  process.env.TURSO_CONNECTION_URL;

const rawToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.TURSO_TOKEN ||
  process.env.STORAGE_AUTH_TOKEN ||
  process.env.TURSO_DB_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN ||
  process.env.LIBSQL_AUTH_TOKEN;

function normalizeTursoUrl(raw?: string): string {
  if (!raw) return isProduction ? ":memory:" : "file:local.db";
  let u = raw.trim().replace(/^["']|["']$/g, "");
  if (u.startsWith("libsql://")) {
    u = u.replace(/^libsql:\/\//, "https://");
  }
  return u;
}

function normalizeAuthToken(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, "");
}

const url = normalizeTursoUrl(rawUrl);
const authToken = normalizeAuthToken(rawToken);

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
export * from "./schema";
