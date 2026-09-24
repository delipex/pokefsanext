import { db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado, configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function recalculateRankingConsolidado(targetSeason?: number) {
  // 0. Obter a temporada ativa
  let activeSeason = targetSeason;
  if (!activeSeason) {
    const configRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
    activeSeason = Number(configRows[0]?.valor) || 5;
  }

  // 1. Buscar todas as etapas da temporada ativa ordenadas cronologicamente
  const allEtapas = await db.select().from(etapas).where(eq(etapas.temporada, activeSeason));
  allEtapas.sort((a, b) => a.data.localeCompare(b.data));

  const etapaMap = new Map(allEtapas.map((e) => [e.data, e]));
  const allResults = await db.select().from(etapaResultados);

  // 2. Mapear resultados por jogador (chave: jogadorId ou jogadorNome)
  const playerStatsMap: Record<string, any> = {};

  for (const r of allResults) {
    const etapaInfo = etapaMap.get(r.etapaData);
    if (!etapaInfo) continue; // Pula resultados que não pertencem a etapas da temporada ativa

    const key = r.jogadorId ? String(r.jogadorId).trim() : String(r.jogadorNome).trim();
    if (!playerStatsMap[key]) {
      playerStatsMap[key] = {
        jogadorId: r.jogadorId ? String(r.jogadorId).trim() : "",
        jogadorNome: r.jogadorNome.trim(),
        categoria: r.categoria || "Master",
        pontos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        podios: 0,
        ultimoDeck: null as string | null,
        etapaColocacoes: new Map<string, number>(),
      };
    }

    const mult = etapaInfo.multiplicador ? Number(etapaInfo.multiplicador) : 1.0;
    const pontosPonderados = Number((r.pontos * mult).toFixed(1));

    playerStatsMap[key].pontos += pontosPonderados;
    playerStatsMap[key].vitorias += r.vitorias;
    playerStatsMap[key].empates += r.empates;
    playerStatsMap[key].derrotas += r.derrotas;
    if (r.colocacao <= 4) playerStatsMap[key].podios += 1;
    if (r.deckNome && r.deckNome !== "Não registrado" && r.deckNome !== "Sem deck registrado") {
      playerStatsMap[key].ultimoDeck = r.deckNome;
    }
    playerStatsMap[key].etapaColocacoes.set(r.etapaData, r.colocacao);
  }

  // 3. Criar array de jogadores consolidados
  const consolidatedList = Object.values(playerStatsMap).map((p) => {
    const colocacoesList: (number | string)[] = [];
    const colocacoesNumericas: number[] = [];

    allEtapas.forEach((e) => {
      if (p.etapaColocacoes.has(e.data)) {
        const col = p.etapaColocacoes.get(e.data)!;
        colocacoesList.push(col);
        colocacoesNumericas.push(col);
      } else {
        colocacoesList.push("-");
      }
    });

    const participacoes = colocacoesNumericas.length;
    const somaColocacoes = colocacoesNumericas.reduce((a: number, b: number) => a + b, 0);
    const mediaColocacao = participacoes > 0 ? Number((somaColocacoes / participacoes).toFixed(2)) : 0;
    const historicoColocacoes = colocacoesList.join(";");

    return {
      temporada: activeSeason!,
      jogadorId: p.jogadorId,
      jogadorNome: p.jogadorNome,
      categoria: p.categoria,
      pontos: p.pontos,
      vitorias: p.vitorias,
      empates: p.empates,
      derrotas: p.derrotas,
      podios: p.podios,
      mediaColocacao,
      participacoes,
      historicoColocacoes,
      ultimoDeck: p.ultimoDeck,
    };
  });

  // 4. Ordenação Estrita Oficial do Ranking:
  // 1. Pontos DESC
  // 2. Pódios DESC
  // 3. Vitórias DESC
  // 4. Média de Colocação ASC (menor é melhor)
  // 5. Nome ASC
  consolidatedList.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.podios !== a.podios) return b.podios - a.podios;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (a.mediaColocacao !== b.mediaColocacao) return a.mediaColocacao - b.mediaColocacao;
    return a.jogadorNome.localeCompare(b.jogadorNome, "pt-BR");
  });

  // 5. Atualizar tabela de rankingConsolidado
  await db.delete(rankingConsolidado);

  for (const p of consolidatedList) {
    await db.insert(rankingConsolidado).values(p);
  }

  return {
    totalEtapas: allEtapas.length,
    totalJogadores: consolidatedList.length,
    consolidatedList,
  };
}
