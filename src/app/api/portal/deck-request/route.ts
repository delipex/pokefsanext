import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { solicitacoesDecks, jogadores } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const cookieStore = await cookies();
    const popId = cookieStore.get("player_session")?.value;

    if (!popId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cleanId = String(popId).trim();
    const list = await db
      .select()
      .from(solicitacoesDecks)
      .where(eq(solicitacoesDecks.jogadorId, cleanId))
      .orderBy(desc(solicitacoesDecks.createdAt));

    return NextResponse.json({ success: true, requests: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const cookieStore = await cookies();
    const popId = cookieStore.get("player_session")?.value;

    if (!popId) {
      return NextResponse.json({ error: "Faça login para informar seu deck." }, { status: 401 });
    }

    const cleanId = String(popId).trim();
    const body = await req.json();
    const { etapaData, deckNome } = body;

    if (!etapaData || !deckNome) {
      return NextResponse.json({ error: "Etapa e Nome do Deck são obrigatórios." }, { status: 400 });
    }

    // Busca nome do atleta
    let playerName = cleanId;
    const pRows = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
    if (pRows && pRows.length > 0) {
      playerName = pRows[0].nome;
    }

    // Verifica se já tem uma solicitação pendente para a mesma etapa
    const existing = await db
      .select()
      .from(solicitacoesDecks)
      .where(
        and(
          eq(solicitacoesDecks.jogadorId, cleanId),
          eq(solicitacoesDecks.etapaData, String(etapaData).trim()),
          eq(solicitacoesDecks.status, "pendente")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualiza o deck da solicitação existente
      await db
        .update(solicitacoesDecks)
        .set({
          deckNome: String(deckNome).trim(),
        })
        .where(eq(solicitacoesDecks.id, existing[0].id));

      return NextResponse.json({
        success: true,
        message: "Sua solicitação de deck foi atualizada e está aguardando validação do organizador!",
      });
    }

    // Cria nova solicitação
    await db.insert(solicitacoesDecks).values({
      jogadorId: cleanId,
      jogadorNome: playerName,
      etapaData: String(etapaData).trim(),
      deckNome: String(deckNome).trim(),
      status: "pendente",
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso! O organizador validará o deck informado.",
    });
  } catch (error: any) {
    console.error("Erro ao solicitar deck:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
