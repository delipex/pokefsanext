import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jogadores, rankingConsolidado, etapas, etapaResultados, jogadorDecklists } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { getAllDecks, getNextEvent } from "@/lib/queries";
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

  // Fetch performance in ranking (por ID ou por Nome)
  let rankingItem = null;
  try {
    const rankingRows = await db
      .select()
      .from(rankingConsolidado)
      .where(or(eq(rankingConsolidado.jogadorId, popId), eq(rankingConsolidado.jogadorNome, player.nome)))
      .limit(1);
    rankingItem = rankingRows[0] || null;
  } catch {}

  // Fetch stage match history (por ID ou por Nome) com multiplicador oficial
  let stageResults: any[] = [];
  try {
    const [allEtapasRows, rawResults] = await Promise.all([
      db.select().from(etapas),
      db
        .select()
        .from(etapaResultados)
        .where(or(eq(etapaResultados.jogadorId, popId), eq(etapaResultados.jogadorNome, player.nome)))
        .orderBy(desc(etapaResultados.etapaData)),
    ]);
    const etapaMap = new Map(allEtapasRows.map((e) => [e.data, e]));
    stageResults = rawResults.map((r) => {
      const eInfo = etapaMap.get(r.etapaData);
      const mult = eInfo?.multiplicador ? Number(eInfo.multiplicador) : 1.0;
      return {
        ...r,
        tipo: eInfo?.tipo || "Liga",
        multiplicador: mult,
        pontosFinal: Number((r.pontos * mult).toFixed(1)),
      };
    });
  } catch {}

  // Fetch decks, next event and submitted decklist
  const [allDecks, nextEvent, submittedDecklistRows] = await Promise.all([
    getAllDecks(),
    getNextEvent(),
    db
      .select()
      .from(jogadorDecklists)
      .where(eq(jogadorDecklists.jogadorId, popId))
      .orderBy(desc(jogadorDecklists.createdAt))
      .limit(1)
      .catch(() => []),
  ]);

  const submittedDecklist = submittedDecklistRows[0] || null;

  return (
    <PlayerPortalDashboard
      player={player}
      rankingItem={rankingItem}
      stageResults={stageResults}
      allDecks={allDecks}
      nextEvent={nextEvent}
      submittedDecklist={submittedDecklist}
    />
  );
}
