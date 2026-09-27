import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  rankingConsolidado,
  scoresAntigos,
  campeoes,
  configuracoes,
  etapas,
  etapaResultados,
  metagame,
} from "@/db/schema";
import { desc, asc, eq } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { clearFileCache } from "@/lib/queries";

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const {
      currentSeason = 5,
      nextSeason = 6,
      campeaoNome,
      viceNome,
      deckCampeao,
      dataFechamento = new Date().toISOString().split("T")[0],
      resetCurrentRankings = true,
    } = body;

    // 1. Obter o ranking consolidado ordenado
    const rankingFinal = await db
      .select()
      .from(rankingConsolidado)
      .orderBy(
        desc(rankingConsolidado.pontos),
        desc(rankingConsolidado.podios),
        asc(rankingConsolidado.mediaColocacao),
        asc(rankingConsolidado.jogadorNome)
      );

    if (rankingFinal.length === 0) {
      return NextResponse.json(
        { error: "Nenhum jogador encontrado no ranking consolidado para fechar a temporada." },
        { status: 400 }
      );
    }

    const detectedCampeao = campeaoNome || rankingFinal[0]?.jogadorNome || "A Definir";
    const detectedVice = viceNome || rankingFinal[1]?.jogadorNome || "A Definir";
    const detectedDeckCampeao = deckCampeao || rankingFinal[0]?.ultimoDeck || "Desconhecido";
    const seasonLabel = String(currentSeason).startsWith("Temporada #")
      ? String(currentSeason)
      : `Temporada #${currentSeason}`;

    const scoresToInsert = rankingFinal.map((r, idx) => ({
      temporada: seasonLabel,
      pos: idx + 1,
      jogador: r.jogadorNome,
      categoria: r.categoria || "ME",
      pontos: String(r.pontos || 0),
      deck: r.ultimoDeck || "",
      dataFechamento,
    }));

    // 2. Transpor ranking final para a tabela `scores_antigos` (limpa anterior para garantir idempotência)
    await db.delete(scoresAntigos).where(eq(scoresAntigos.temporada, seasonLabel));
    if (scoresToInsert.length > 0) {
      await db.insert(scoresAntigos).values(scoresToInsert);
    }

    // 3. Coroar campeão no Hall da Fama (`campeoes`) (limpa anterior para não duplicar)
    await db.delete(campeoes).where(eq(campeoes.temporada, seasonLabel));
    await db.insert(campeoes).values({
      temporada: seasonLabel,
      campeao: detectedCampeao,
      vice: detectedVice,
      deckCampeao: detectedDeckCampeao,
      data: dataFechamento,
    });

    // 4. Atualizar configuração para a nova temporada
    await db
      .insert(configuracoes)
      .values({
        chave: "temporadaAtual",
        valor: String(nextSeason),
      })
      .onConflictDoUpdate({
        target: configuracoes.chave,
        set: { valor: String(nextSeason) },
      });

    // 5. Resetar ranking consolidado da temporada atual (se solicitado)
    if (resetCurrentRankings) {
      await db.delete(rankingConsolidado);
      // Opcional: resetar metagame da temporada anterior
      await db.delete(metagame);
    }

    try {
      clearFileCache();
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/etapas");
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {
      // Ignora erro em build ou ambiente isolado
    }

    return NextResponse.json({
      success: true,
      message: `Temporada ${currentSeason} encerrada com sucesso! Campeão ${detectedCampeao} coroado no Hall da Fama e Temporada ${nextSeason} iniciada.`,
      campeao: detectedCampeao,
      vice: detectedVice,
      totalTranspostos: scoresToInsert.length,
      novaTemporada: nextSeason,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
