import { NextResponse } from "next/server";
import { client, db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado } from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSchema();

    const rawUrl =
      process.env.TURSO_DATABASE_URL ||
      process.env.TURSO_URL ||
      process.env.STORAGE_URL ||
      process.env.TURSO_DB_URL ||
      process.env.DATABASE_URL ||
      process.env.LIBSQL_URL ||
      "https://database-coquelicot-park-vercel-icfg-cilooyqjvaf4pz6q3zrdmlve.aws-us-east-1.turso.io";

    const isCloud = rawUrl.startsWith("libsql://") || rawUrl.startsWith("https://");
    const isMemory = !rawUrl || rawUrl === ":memory:";
    const isLocalFile = rawUrl.startsWith("file:");

    const [etapasCount, resultadosCount, rankingCount] = await Promise.all([
      db.select().from(etapas),
      db.select().from(etapaResultados),
      db.select().from(rankingConsolidado),
    ]);

    // Mascarar URL do banco para segurança
    let maskedUrl = "Nenhum (Memória Temporária)";
    if (isCloud) {
      const parts = rawUrl.split("@");
      maskedUrl = parts.length > 1 ? parts[1] : rawUrl.replace(/^libsql:\/\//, "");
    } else if (isLocalFile) {
      maskedUrl = rawUrl;
    }

    return NextResponse.json({
      success: true,
      status: isCloud ? "cloud_connected" : isLocalFile ? "local_file" : "memory_fallback",
      dbType: isCloud ? "Turso Cloud (Persistente)" : isLocalFile ? "Arquivo Local (local.db)" : "Memória RAM (Volátil)",
      databaseHost: maskedUrl,
      isPersistent: isCloud || isLocalFile,
      metrics: {
        totalEtapas: etapasCount.length,
        totalResultados: resultadosCount.length,
        totalRanking: rankingCount.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
