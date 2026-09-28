import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado, jogadores, decks, configuracoes, metagame } from "@/db/schema";
import { eq, asc, and, or, sql } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { findMatchingCatalogDeck, DECK_ALIASES } from "@/lib/deck-normalizer";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

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

        // Deck check com detecção inteligente
        let suggestedDeck: string | null = null;
        let isUnregisteredDeck = false;

        const hasDeck = row.deckNome && row.deckNome !== "Não registrado" && row.deckNome !== "Sem deck registrado";
        if (hasDeck) {
          stageDecksFilled++;
          if (!registeredDeckNames.has(row.deckNome!.toLowerCase())) {
            isUnregisteredDeck = true;
            // Procura correspondência inteligente sugerida
            const matchRes = findMatchingCatalogDeck(row.deckNome!, allDecks);
            if (matchRes.matchedDeck) {
              suggestedDeck = matchRes.matchedDeck;
            }
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
          isUnregisteredDeck,
          suggestedDeck,
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
      catalogDecks: allDecks.map((d) => ({ id: d.id, nome: d.nome, tipoEnergia: d.tipoEnergia })),
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

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { action, etapaData, jogadorNome, novoDeckNome } = body;

    if (action === "fix_deck") {
      if (!etapaData || !jogadorNome || !novoDeckNome) {
        return NextResponse.json({ error: "Parâmetros incompletos para correção de deck." }, { status: 400 });
      }

      const cleanDeck = String(novoDeckNome).trim();
      const cleanDate = String(etapaData).trim();
      const cleanPlayer = String(jogadorNome).trim();
      const normPlayer = cleanPlayer.toLowerCase();

      // 1. Atualizar etapa_resultados
      await db
        .update(etapaResultados)
        .set({ deckNome: cleanDeck })
        .where(
          and(
            eq(etapaResultados.etapaData, cleanDate),
            or(
              eq(etapaResultados.jogadorNome, cleanPlayer),
              eq(sql`lower(trim(${etapaResultados.jogadorNome}))`, normPlayer)
            )
          )
        );

      // 2. Atualizar tabela metagame
      await db
        .delete(metagame)
        .where(
          and(
            eq(metagame.etapaData, cleanDate),
            or(
              eq(metagame.jogadorNome, cleanPlayer),
              eq(sql`lower(trim(${metagame.jogadorNome}))`, normPlayer)
            )
          )
        );

      await db.insert(metagame).values({
        etapaData: cleanDate,
        sessionCode: `${cleanDate}-Liga`,
        jogadorNome: cleanPlayer,
        deckNome: cleanDeck,
      });

      // 3. Atualizar metagame.json físico
      try {
        const metaPath = path.join(process.cwd(), "src", "data", "metagame.json");
        if (fs.existsSync(metaPath)) {
          const raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          if (!raw[cleanDate]) raw[cleanDate] = { sessionCode: `${cleanDate}-Liga`, decks: {} };
          if (!raw[cleanDate].decks) raw[cleanDate].decks = {};
          raw[cleanDate].decks[cleanPlayer] = cleanDeck;
          fs.writeFileSync(metaPath, JSON.stringify(raw, null, 4), "utf-8");

          const legacyMetaPath = path.resolve(process.cwd(), "..", "LigaAtlântica", "metagame.json");
          if (fs.existsSync(legacyMetaPath)) {
            try {
              fs.writeFileSync(legacyMetaPath, JSON.stringify(raw, null, 4), "utf-8");
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Aviso ao sincronizar metagame.json:", err);
      }

      clearFileCache();
      await recalculateRankingConsolidado();

      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/admin");

      return NextResponse.json({
        success: true,
        message: `Deck de ${cleanPlayer} na etapa de ${cleanDate} corrigido para "${cleanDeck}" com sucesso!`,
      });
    }

    if (action === "auto_fix_synonyms") {
      const allDecksList = await db.select().from(decks);
      const allRes = await db.select().from(etapaResultados);
      let fixedCount = 0;

      for (const row of allRes) {
        if (!row.deckNome) continue;
        const match = findMatchingCatalogDeck(row.deckNome, allDecksList);
        if (match.matchedDeck && match.matchedDeck !== row.deckNome) {
          // Atualiza banco
          await db
            .update(etapaResultados)
            .set({ deckNome: match.matchedDeck })
            .where(eq(etapaResultados.id, row.id));

          // Atualiza metagame
          await db
            .delete(metagame)
            .where(
              and(
                eq(metagame.etapaData, row.etapaData),
                eq(metagame.jogadorNome, row.jogadorNome)
              )
            );
          await db.insert(metagame).values({
            etapaData: row.etapaData,
            sessionCode: `${row.etapaData}-Liga`,
            jogadorNome: row.jogadorNome,
            deckNome: match.matchedDeck,
          });

          fixedCount++;
        }
      }

      if (fixedCount > 0) {
        clearFileCache();
        await recalculateRankingConsolidado();
        revalidatePath("/");
        revalidatePath("/ranking");
        revalidatePath("/metagame");
        revalidatePath("/admin");
      }

      return NextResponse.json({
        success: true,
        fixedCount,
        message: `Auto-correção concluída! ${fixedCount} divergências de nomes de decks foram normalizadas.`,
      });
    }

    return NextResponse.json({ error: "Ação não suportada." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na ação de auditoria:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
