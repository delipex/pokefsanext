import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

const DEFAULT_TURSO_URL =
  "https://database-coquelicot-park-vercel-icfg-cilooyqjvaf4pz6q3zrdmlve.aws-us-east-1.turso.io";
const DEFAULT_TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA1NjM4ODksImlkIjoiMDFhMGNlZGEtYTYwMS03ODhmLWI4MjktOGU0NTIzMTFkZmZhIiwia2lkIjoiWGRyQWhjZGt6UnJiREg2R0VUQXB3OUpCODFESEZBYmdtUU9RbXd0bHMxRSIsInJpZCI6IjFkODU4NjM0LWE4ZTEtNDRkNC1iZWM2LWM4MjljOWFhZDE1YSJ9.VetHTw5vzeZtJpzJ0sUy7h1LReaH189yMpiFk6uTUuzelplvWS1RRfI3sHB_71xFEZTX0itPu3pOD8zTDTDuAA";

const rawUrl =
  process.env.TURSO_DATABASE_URL ||
  process.env.TURSO_URL ||
  process.env.STORAGE_URL ||
  process.env.TURSO_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.LIBSQL_URL ||
  process.env.TURSO_DATABASE_URL_UNPOOLED ||
  process.env.TURSO_CONNECTION_URL ||
  DEFAULT_TURSO_URL;

const rawToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.TURSO_TOKEN ||
  process.env.STORAGE_AUTH_TOKEN ||
  process.env.TURSO_DB_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN ||
  process.env.LIBSQL_AUTH_TOKEN ||
  DEFAULT_TURSO_AUTH_TOKEN;

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
