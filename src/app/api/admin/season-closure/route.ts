import { NextResponse } from "next/server";
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

    // 2. Transpor ranking final para a tabela `scores_antigos`
    const scoresToInsert = rankingFinal.map((r, idx) => ({
      temporada: String(currentSeason),
      dataFechamento,
      pos: idx + 1,
      jogador: r.jogadorNome,
      categoria: r.categoria || "Master",
      pontos: String(Math.round(r.pontos)),
      deck: r.ultimoDeck || "",
    }));

    await db.insert(scoresAntigos).values(scoresToInsert);

    // 3. Coroar campeão no Hall da Fama (`campeoes`)
    await db.insert(campeoes).values({
      temporada: String(currentSeason),
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
