import { NextResponse } from "next/server";
import { db } from "@/db";
import { etapaResultados, metagame, rankingConsolidado, etapas } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { etapaData, decksMap } = body;

    if (!etapaData || !decksMap || typeof decksMap !== "object") {
      return NextResponse.json({ error: "Dados inválidos para atualização do metagame" }, { status: 400 });
    }

    // 1. Atualizar etapa_resultados para cada jogador dessa etapa
    for (const [jogadorNome, deckNome] of Object.entries<any>(decksMap)) {
      const cleanDeck = deckNome && deckNome !== "Não registrado" && deckNome !== "Sem deck registrado" ? String(deckNome).trim() : null;

      await db
        .update(etapaResultados)
        .set({ deckNome: cleanDeck })
        .where(
          and(
            eq(etapaResultados.etapaData, etapaData),
            eq(etapaResultados.jogadorNome, jogadorNome)
          )
        );

      // 2. Atualizar ou inserir na tabela de metagame
      if (cleanDeck) {
        // Remover registro anterior do jogador nesta etapa
        await db
          .delete(metagame)
          .where(
            and(
              eq(metagame.etapaData, etapaData),
              eq(metagame.jogadorNome, jogadorNome)
            )
          );

        // Inserir registro atualizado
        await db.insert(metagame).values({
          etapaData,
          sessionCode: `${etapaData}-Liga`,
          jogadorNome,
          deckNome: cleanDeck,
        });

        // 3. Se for a etapa mais recente, atualizar rankingConsolidado.ultimoDeck
        await db
          .update(rankingConsolidado)
          .set({ ultimoDeck: cleanDeck })
          .where(eq(rankingConsolidado.jogadorNome, jogadorNome));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Metagame e decks da etapa atualizados com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar metagame da etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
