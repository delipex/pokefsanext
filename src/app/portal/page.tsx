import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jogadores, rankingConsolidado, etapaResultados, jogadorDecklists } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAllDecks, getNextEvent } from "@/lib/queries";
import { PlayerPortalDashboard } from "@/components/portal/PlayerPortalDashboard";

export const dynamic = "force-dynamic";

export default async function PlayerPortalPage() {
  const cookieStore = await cookies();
  const popId = cookieStore.get("player_session")?.value;

  if (!popId) {
    redirect("/portal/login");
  }

  // Fetch player data
  const playerRows = await db.select().from(jogadores).where(eq(jogadores.id, popId)).limit(1);

  if (playerRows.length === 0) {
    redirect("/portal/login");
  }

  const player = playerRows[0];

  // Fetch performance in ranking
  const rankingRows = await db
    .select()
    .from(rankingConsolidado)
    .where(eq(rankingConsolidado.jogadorId, popId))
    .limit(1);

  const rankingItem = rankingRows[0] || null;

  // Fetch stage match history
  const stageResults = await db
    .select()
    .from(etapaResultados)
    .where(eq(etapaResultados.jogadorId, popId))
    .orderBy(desc(etapaResultados.etapaData));

  // Fetch decks and next event
  const [allDecks, nextEvent, submittedDecklistRows] = await Promise.all([
    getAllDecks(),
    getNextEvent(),
    db
      .select()
      .from(jogadorDecklists)
      .where(eq(jogadorDecklists.jogadorId, popId))
      .orderBy(desc(jogadorDecklists.createdAt))
      .limit(1),
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
