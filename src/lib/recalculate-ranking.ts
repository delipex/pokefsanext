import { db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado, configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { getCanonicalPlayersMap, resolveCanonicalPlayer } from "./player-canonical";

export async function recalculateRankingConsolidado(targetSeason?: number) {
  await ensureDatabaseSchema();
  // 0. Obter a temporada ativa
  let activeSeason = targetSeason;
  if (!activeSeason) {
    try {
      const configRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      activeSeason = Number(configRows[0]?.valor) || 5;
    } catch {
      activeSeason = 5;
    }
  }

  // Mapa canônico universal para resolver POP IDs e nomes
  const canonicalMaps = await getCanonicalPlayersMap();

  // 1. Buscar todas as etapas da temporada ativa ordenadas cronologicamente
  let allEtapas = await db.select().from(etapas).where(eq(etapas.temporada, activeSeason));
  if (allEtapas.length === 0) {
    allEtapas = await db.select().from(etapas);
  }
  allEtapas.sort((a, b) => String(a.data).localeCompare(String(b.data)));

  const etapaMap = new Map(allEtapas.map((e) => [String(e.data).trim(), e]));
  const allResults = await db.select().from(etapaResultados);
  allResults.sort((a, b) => String(a.etapaData).localeCompare(String(b.etapaData)));

  // 2. Mapear resultados por jogador canônico
  const playerStatsMap: Record<string, any> = {};

  for (const r of allResults) {
    const cleanEtapaData = String(r.etapaData).trim();
    const etapaInfo = etapaMap.get(cleanEtapaData) || { multiplicador: 1.0, data: cleanEtapaData };

    const canonical = resolveCanonicalPlayer(
      { id: r.jogadorId, nome: r.jogadorNome, categoria: (r.categoria as any) || "Master" },
      canonicalMaps
    );

    const key = canonical.id ? canonical.id : canonical.nome.toLowerCase().trim();

    if (!playerStatsMap[key]) {
      playerStatsMap[key] = {
        jogadorId: canonical.id || "",
        jogadorNome: canonical.nome,
        categoria: canonical.categoria || "Master",
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

  if (consolidatedList.length > 0) {
    // Inserção em lote para performance ultra-rápida (1 round-trip HTTP)
    await db.insert(rankingConsolidado).values(consolidatedList);
  }

  return {
    totalEtapas: allEtapas.length,
    totalJogadores: consolidatedList.length,
    totalPlayers: consolidatedList.length,
    consolidatedList,
  };
}
