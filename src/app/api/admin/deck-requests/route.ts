import { NextResponse } from "next/server";
import { db } from "@/db";
import { solicitacoesDecks, etapaResultados, metagame } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const list = await db.select().from(solicitacoesDecks).orderBy(desc(solicitacoesDecks.createdAt));
    return NextResponse.json({ success: true, requests: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const rows = await db.select().from(solicitacoesDecks).where(eq(solicitacoesDecks.id, Number(id))).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    const request = rows[0];

    if (action === "reject") {
      await db
        .update(solicitacoesDecks)
        .set({ status: "rejeitada" })
        .where(eq(solicitacoesDecks.id, Number(id)));

      return NextResponse.json({ success: true, message: "Solicitação rejeitada com sucesso." });
    }

    // Ação: Aprovar
    const cleanId = String(request.jogadorId).trim();
    const cleanName = String(request.jogadorNome).trim();
    const cleanDate = String(request.etapaData).trim();
    const cleanDeck = String(request.deckNome).trim();

    // 1. Atualizar resultado da partida em etapa_resultados
    await db
      .update(etapaResultados)
      .set({ deckNome: cleanDeck })
      .where(
        and(
          eq(etapaResultados.etapaData, cleanDate),
          or(eq(etapaResultados.jogadorId, cleanId), eq(etapaResultados.jogadorNome, cleanName))
        )
      );

    // 2. Inserir ou atualizar no metagame da etapa
    await db.insert(metagame).values({
      etapaData: cleanDate,
      sessionCode: `${cleanDate}-Liga`,
      jogadorNome: cleanName,
      deckNome: cleanDeck,
    });

    // 3. Atualizar metagame.json se gravável
    try {
      const metaFilePath = path.join(process.cwd(), "src", "data", "metagame.json");
      if (fs.existsSync(metaFilePath)) {
        const rawMeta = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
        if (!rawMeta[cleanDate]) {
          rawMeta[cleanDate] = { decks: {} };
        }
        if (!rawMeta[cleanDate].decks) {
          rawMeta[cleanDate].decks = {};
        }
        rawMeta[cleanDate].decks[cleanName] = cleanDeck;
        fs.writeFileSync(metaFilePath, JSON.stringify(rawMeta, null, 4), "utf-8");
      }
    } catch {}

    // 4. Marcar solicitação como aprovada
    await db
      .update(solicitacoesDecks)
      .set({ status: "aprovada" })
      .where(eq(solicitacoesDecks.id, Number(id)));

    // 5. Recalcular o ranking consolidado
    await recalculateRankingConsolidado();

    return NextResponse.json({
      success: true,
      message: `Deck "${cleanDeck}" aprovado e vinculado a ${cleanName} na etapa de ${cleanDate} com sucesso!`,
    });
  } catch (error: any) {
    console.error("Erro ao processar solicitação de deck:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
