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

  // Fetch performance in ranking (por ID ou por Nome)
  let rankingItem = null;
  try {
    const rankingRows = await db
      .select()
      .from(rankingConsolidado)
      .where(or(eq(rankingConsolidado.jogadorId, cleanPopId), eq(rankingConsolidado.jogadorNome, player.nome)))
      .limit(1);
    rankingItem = rankingRows[0] || null;
  } catch {}

  // Fallback resiliente para getRanking() se não encontrou no banco
  if (!rankingItem) {
    try {
      const allRanking = await getRanking();
      rankingItem = allRanking.find(
        (r) =>
          (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
          (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
      ) || null;
    } catch {}
  }

  // Fetch stage match history (lendo sempre os dados oficiais do TDF + metagame.json e mesclando com banco)
  const officialEtapas = await getEtapasWithSummary().catch(() => []);
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

  // Mesclar com atualizações do banco de dados (se houver decks moderados/aprovados no banco)
  try {
    const rawResults = await db
      .select()
      .from(etapaResultados)
      .where(or(eq(etapaResultados.jogadorId, cleanPopId), eq(etapaResultados.jogadorNome, player.nome)));

    for (const r of rawResults) {
      const existing = officialMatchesMap.get(r.etapaData);
      const mult = existing?.multiplicador ? Number(existing.multiplicador) : 1.0;
      if (existing) {
        if (r.deckNome && r.deckNome.trim() && r.deckNome !== "Sem deck registrado" && r.deckNome !== "Sem deck") {
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
  } catch {}

  const stageResults = Array.from(officialMatchesMap.values()).sort((a, b) =>
    b.etapaData.localeCompare(a.etapaData)
  );

  // Fetch decks, next event, deck requests, submitted decklist, ranking geral e scores antigos
  const [
    allDecks,
    nextEvent,
    submittedDecklistRows,
    configMap,
    userDeckRequests,
    allRanking,
    allScoresAntigos,
    allChampions,
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
  ]);

  const submittedDecklist = submittedDecklistRows[0] || null;
  const exigirDecklist =
    configMap.exigirDecklist === "true" ||
    configMap.premierExigirDecklist === "true" ||
    configMap.inscricoesAtivas === "true";

  // Classificação Geral e por Categoria
  const totalAtletas = allRanking.length;
  const pGeralIdx = allRanking.findIndex(
    (r: any) =>
      (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
      (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
  );
  const posicaoGeral = pGeralIdx >= 0 ? pGeralIdx + 1 : null;

  const catClean = (player.categoria || "Master").toLowerCase().trim();
  const rankingCat = allRanking.filter(
    (r: any) => (r.categoria || "Master").toLowerCase().trim() === catClean
  );
  const pCatIdx = rankingCat.findIndex(
    (r: any) =>
      (r.jogadorId && String(r.jogadorId).trim() === cleanPopId) ||
      (r.jogadorNome && r.jogadorNome.toLowerCase().trim() === cleanPlayerName)
  );
  const posicaoCategoria = pCatIdx >= 0 ? pCatIdx + 1 : null;

  // Trajetória Histórica (Multi-Temporadas)
  const historicoTemporadas = allScoresAntigos.filter(
    (s: any) =>
      s.jogador &&
      (s.jogador.toLowerCase().trim() === cleanPlayerName ||
        (cleanPopId && String(s.id) === cleanPopId))
  );

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
