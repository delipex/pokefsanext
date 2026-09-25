import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jogadores, rankingConsolidado, etapas, etapaResultados, jogadorDecklists, solicitacoesDecks } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { getAllDecks, getNextEvent, getRanking, getEtapasWithSummary, getConfigMap, getScoresAntigos, getCampeoes } from "@/lib/queries";
import { PlayerPortalDashboard } from "@/components/portal/PlayerPortalDashboard";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function PlayerPortalPage() {
  const cookieStore = await cookies();
  const popId = cookieStore.get("player_session")?.value;

  if (!popId) {
    redirect("/portal/login");
  }

  await ensureDatabaseSchema();

  // Fetch player data
  let playerRows = await db.select().from(jogadores).where(eq(jogadores.id, popId)).limit(1);

  // Fallback se o banco ainda não tiver o registro
  if (playerRows.length === 0) {
    try {
      const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === popId);
        if (found) {
          const newPlayer = {
            id: popId,
            nome: found.jogador || found.Jogador || found.nome || "Treinador Pokémon",
            categoria: found.categoria || found.Categoria || "Master",
            status: "ativo",
            ativo: true,
          };
          await db.insert(jogadores).values(newPlayer).onConflictDoNothing();
          playerRows = [newPlayer as any];
        }
      }
    } catch {}
  }

  if (playerRows.length === 0) {
    redirect("/portal/login");
  }

  const player = playerRows[0];
  const cleanPopId = popId.trim();
  const cleanPlayerName = (player.nome || "").toLowerCase().trim();

  // Carregamento paralelo resiliente de todas as fontes de dados
  const [
    allDecks,
    nextEvent,
    submittedDecklistRows,
    configMap,
    userDeckRequests,
    allRanking,
    allScoresAntigos,
    allChampions,
    officialEtapas,
    rawDbResults,
    dbRankingRows,
  ] = await Promise.all([
    getAllDecks(),
    getNextEvent(),
    db
      .select()
      .from(jogadorDecklists)
      .where(eq(jogadorDecklists.jogadorId, cleanPopId))
      .orderBy(desc(jogadorDecklists.createdAt))
      .limit(1)
      .catch(() => []),
    getConfigMap(),
    db
      .select()
      .from(solicitacoesDecks)
      .where(eq(solicitacoesDecks.jogadorId, cleanPopId))
      .orderBy(desc(solicitacoesDecks.createdAt))
      .catch(() => []),
    getRanking().catch(() => []),
    getScoresAntigos().catch(() => []),
    getCampeoes().catch(() => []),
    getEtapasWithSummary().catch(() => []),
    db
      .select()
      .from(etapaResultados)
      .where(or(eq(etapaResultados.jogadorId, cleanPopId), eq(etapaResultados.jogadorNome, player.nome)))
      .catch(() => []),
    db
      .select()
      .from(rankingConsolidado)
      .where(or(eq(rankingConsolidado.jogadorId, cleanPopId), eq(rankingConsolidado.jogadorNome, player.nome)))
      .limit(1)
      .catch(() => []),
  ]);

  // Histórico de partidas oficiais da Temporada 5 (lê de todas as 21 etapas oficiais)
  const officialMatchesMap = new Map<string, any>();

  for (const etapa of officialEtapas) {
    const mult = etapa.multiplicador ? Number(etapa.multiplicador) : 1.0;
    const found = (etapa.resultados || []).find(
      (r: any) =>
        (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
        (r.jogadorNome && String(r.jogadorNome).toLowerCase().trim() === cleanPlayerName)
    );
    if (found) {
      officialMatchesMap.set(etapa.data, {
        ...found,
        tipo: etapa.tipo || "Liga",
        multiplicador: mult,
        pontosFinal: Number((Number(found.pontos) * mult).toFixed(1)),
      });
    }
  }

  // Mesclar com atualizações do banco de dados (decks moderados/aprovados)
  for (const r of rawDbResults) {
    const existing = officialMatchesMap.get(r.etapaData);
    const mult = existing?.multiplicador ? Number(existing.multiplicador) : 1.0;
    if (existing) {
      if (r.deckNome && r.deckNome.trim() && r.deckNome !== "Sem deck registrado" && r.deckNome !== "Sem deck" && r.deckNome !== "Não registrado") {
        existing.deckNome = r.deckNome.trim();
      }
    } else {
      officialMatchesMap.set(r.etapaData, {
        ...r,
        tipo: "Liga",
        multiplicador: mult,
        pontosFinal: Number((Number(r.pontos) * mult).toFixed(1)),
      });
    }
  }

  const stageResults = Array.from(officialMatchesMap.values()).sort((a, b) =>
    b.etapaData.localeCompare(a.etapaData)
  );

  // Resolução do Ranking Oficial da Temporada Atual
  let rankingItem = dbRankingRows[0] || null;

  if (!rankingItem) {
    rankingItem = allRanking.find(
      (r) =>
        (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
        (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
    ) || null;
  }

  // Fallback computado caso o ranking remoto esteja desatualizado mas o atleta tenha partidas
  if ((!rankingItem || Number(rankingItem.pontos) === 0) && stageResults.length > 0) {
    const pts = stageResults.reduce((acc, cur) => acc + (cur.pontosFinal ?? (Number(cur.pontos) || 0)), 0);
    const v = stageResults.reduce((acc, cur) => acc + (Number(cur.vitorias) || 0), 0);
    const d = stageResults.reduce((acc, cur) => acc + (Number(cur.derrotas) || 0), 0);
    const e = stageResults.reduce((acc, cur) => acc + (Number(cur.empates) || 0), 0);
    const pod = stageResults.filter((cur) => Number(cur.colocacao) <= 4).length;
    const avg = stageResults.reduce((acc, cur) => acc + (Number(cur.colocacao) || 0), 0) / stageResults.length;
    rankingItem = {
      id: 0,
      temporada: 5,
      jogadorId: cleanPopId,
      jogadorNome: player.nome,
      categoria: player.categoria || "Master",
      pontos: pts,
      vitorias: v,
      empates: e,
      derrotas: d,
      podios: pod,
      mediaColocacao: Number(avg.toFixed(2)),
      participacoes: stageResults.length,
      historicoColocacoes: stageResults.map((s) => s.colocacao).join(";"),
      ultimoDeck: stageResults[0]?.deckNome || null,
    };
  }

  const submittedDecklist = submittedDecklistRows[0] || null;
  const exigirDecklist =
    configMap.exigirDecklist === "true" ||
    configMap.premierExigirDecklist === "true" ||
    configMap.inscricoesAtivas === "true";

  // Classificação Geral e por Categoria
  const totalAtletas = allRanking.length;
  let pGeralIdx = allRanking.findIndex(
    (r: any) =>
      (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
      (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
  );

  if (pGeralIdx < 0 && rankingItem && Number(rankingItem.pontos) > 0) {
    const simulated = [...allRanking, rankingItem].sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.podios !== a.podios) return b.podios - a.podios;
      return a.mediaColocacao - b.mediaColocacao;
    });
    pGeralIdx = simulated.findIndex(
      (r: any) =>
        (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
        (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
    );
  }
  const posicaoGeral = pGeralIdx >= 0 ? pGeralIdx + 1 : null;

  const catClean = (player.categoria || "Master").toLowerCase().trim();
  const rankingCat = allRanking.filter(
    (r: any) => (r.categoria || "Master").toLowerCase().trim() === catClean
  );
  let pCatIdx = rankingCat.findIndex(
    (r: any) =>
      (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
      (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
  );
  if (pCatIdx < 0 && rankingItem && Number(rankingItem.pontos) > 0) {
    const simulatedCat = [...rankingCat, rankingItem].sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.podios !== a.podios) return b.podios - a.podios;
      return a.mediaColocacao - b.mediaColocacao;
    });
    pCatIdx = simulatedCat.findIndex(
      (r: any) =>
        (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
        (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
    );
  }
  const posicaoCategoria = pCatIdx >= 0 ? pCatIdx + 1 : null;

  // Trajetória Histórica (Multi-Temporadas): deduplicação rigorosa por temporada
  // Apenas temporadas nas quais o atleta efetivamente participou e pontuou
  const seasonMap = new Map<string, any>();
  for (const s of allScoresAntigos) {
    if (!s.jogador || s.jogador.toLowerCase().trim() !== cleanPlayerName) continue;
    const seasonKey = (s.temporada || "").trim();
    if (!seasonKey) continue;
    const pts = Number(s.pontos) || 0;
    if (pts <= 0) continue; // Não exibe temporadas que o atleta não jogou

    if (!seasonMap.has(seasonKey) || (Number(seasonMap.get(seasonKey).pontos) || 0) < pts) {
      seasonMap.set(seasonKey, s);
    }
  }

  const historicoTemporadas = Array.from(seasonMap.values()).sort((a, b) => {
    return b.temporada.localeCompare(a.temporada, undefined, { numeric: true });
  });

  // Títulos e Reconhecimentos
  const titulos = allChampions.filter(
    (c: any) =>
      (c.Campeao && c.Campeao.toLowerCase().trim() === cleanPlayerName) ||
      (c.campeao && c.campeao.toLowerCase().trim() === cleanPlayerName) ||
      (c.Vice && c.Vice.toLowerCase().trim() === cleanPlayerName) ||
      (c.vice && c.vice.toLowerCase().trim() === cleanPlayerName)
  );

  return (
    <PlayerPortalDashboard
      player={player}
      rankingItem={rankingItem}
      stageResults={stageResults}
      allDecks={allDecks}
      nextEvent={nextEvent}
      submittedDecklist={submittedDecklist}
      exigirDecklist={exigirDecklist}
      deckRequests={userDeckRequests || []}
      posicaoGeral={posicaoGeral}
      posicaoCategoria={posicaoCategoria}
      totalAtletas={totalAtletas}
      historicoTemporadas={historicoTemporadas}
      titulos={titulos}
    />
  );
}
