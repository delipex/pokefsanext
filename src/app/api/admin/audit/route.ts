import { NextResponse } from "next/server";
import { db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado, jogadores, decks, configuracoes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export async function GET() {
  try {
    await ensureDatabaseSchema();

    let activeSeason = 5;
    try {
      const configRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      activeSeason = Number(configRows[0]?.valor) || 5;
    } catch {
      activeSeason = 5;
    }

    // 1. Carregar dados essenciais
    const [allEtapas, allResults, allRanking, allPlayers, allDecks] = await Promise.all([
      db.select().from(etapas).where(eq(etapas.temporada, activeSeason)).orderBy(asc(etapas.data)),
      db.select().from(etapaResultados),
      db.select().from(rankingConsolidado),
      db.select().from(jogadores),
      db.select().from(decks),
    ]);

    const registeredPlayerIds = new Set(allPlayers.map((p) => String(p.id).trim().toLowerCase()));
    const registeredPlayerNames = new Set(allPlayers.map((p) => p.nome.trim().toLowerCase()));
    const registeredDeckNames = new Set(allDecks.map((d) => d.nome.trim().toLowerCase()));

    let totalParticipations = 0;
    let totalFormulaMismatches = 0;
    let totalMissingIds = 0;
    let totalUnregisteredDecks = 0;

    // Mapear resultados por etapa
    const resultsByStage: Record<string, typeof allResults> = {};
    for (const r of allResults) {
      if (!resultsByStage[r.etapaData]) {
        resultsByStage[r.etapaData] = [];
      }
      resultsByStage[r.etapaData].push(r);
    }

    const auditedStages = [];

    for (const stage of allEtapas) {
      const stageRows = resultsByStage[stage.data] || [];
      const mult = Number(stage.multiplicador) || 1.0;
      totalParticipations += stageRows.length;

      let stageErrorsCount = 0;
      let stageWarningsCount = 0;
      const issues: string[] = [];
      const playersAudit: any[] = [];

      let stageDecksFilled = 0;
      let stageValidIds = 0;

      for (const row of stageRows) {
        const pIssues: string[] = [];
        const expectedStagePoints = row.vitorias * 3 + row.empates * 1;
        const actualPoints = row.pontos;
        const seasonImpact = Number((actualPoints * mult).toFixed(1));

        // V/E/D check no padrão oficial TOM
        const pointsDiff = Math.abs(actualPoints - expectedStagePoints);
        if (pointsDiff > 0 && !row.dropou) {
          pIssues.push(`Divergência de Pontos TOM: Registrado ${actualPoints} vs Fórmula Esperada ${expectedStagePoints} (${row.vitorias}V-${row.empates}E-${row.derrotas}D)`);
          stageWarningsCount++;
          totalFormulaMismatches++;
        }

        // ID check
        const hasId = row.jogadorId && row.jogadorId.trim().length > 0;
        const idKnown = hasId && (registeredPlayerIds.has(row.jogadorId!.toLowerCase()) || registeredPlayerNames.has(row.jogadorNome.toLowerCase()));
        if (hasId && idKnown) {
          stageValidIds++;
        } else {
          totalMissingIds++;
          pIssues.push(`Jogador sem POP ID registrado ou não cadastrado no banco`);
        }

        // Deck check
        const hasDeck = row.deckNome && row.deckNome !== "Não registrado" && row.deckNome !== "Sem deck registrado";
        if (hasDeck) {
          stageDecksFilled++;
          if (!registeredDeckNames.has(row.deckNome!.toLowerCase())) {
            pIssues.push(`Deck "${row.deckNome}" não encontrado no catálogo global de decks`);
            totalUnregisteredDecks++;
          }
        } else {
          pIssues.push(`Sem deck registrado nesta etapa`);
        }

        if (pIssues.length > 0) {
          stageErrorsCount++;
        }

        playersAudit.push({
          colocacao: row.colocacao,
          jogadorNome: row.jogadorNome,
          jogadorId: row.jogadorId,
          categoria: row.categoria,
          pontos: actualPoints,
          pontosLiga: seasonImpact,
          esperado: expectedStagePoints,
          record: `${row.vitorias}-${row.empates}-${row.derrotas}`,
          deckNome: row.deckNome || "Sem deck",
          issues: pIssues,
          hasIssues: pIssues.length > 0,
        });
      }

      auditedStages.push({
        data: stage.data,
        tipo: stage.tipo,
        multiplicador: mult,
        totalJogadores: stageRows.length,
        decksPreenchidos: stageDecksFilled,
        idsValidos: stageValidIds,
        hasIssues: stageWarningsCount > 0 || stageErrorsCount > 0,
        errorsCount: stageErrorsCount,
        warningsCount: stageWarningsCount,
        issues,
        players: playersAudit,
      });
    }

    // Checagem de Ranking Geral (duplicidades)
    const rankingPlayerMap = new Map<string, number>();
    const duplicatePlayers: string[] = [];
    for (const r of allRanking) {
      const key = r.jogadorId ? r.jogadorId.toLowerCase() : r.jogadorNome.toLowerCase();
      rankingPlayerMap.set(key, (rankingPlayerMap.get(key) || 0) + 1);
      if (rankingPlayerMap.get(key)! > 1 && !duplicatePlayers.includes(r.jogadorNome)) {
        duplicatePlayers.push(r.jogadorNome);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        totalStages: allEtapas.length,
        totalParticipations,
        totalRankingPlayers: allRanking.length,
        totalFormulaMismatches,
        totalMissingIds,
        totalUnregisteredDecks,
        duplicateRankingEntries: duplicatePlayers.length,
      },
      duplicatePlayers,
      stages: auditedStages,
    });
  } catch (error: any) {
    console.error("Erro na auditoria:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
