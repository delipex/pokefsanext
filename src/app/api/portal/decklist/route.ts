import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores, jogadorDecklists, decks, calendario } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { parseAndValidateDecklist, sanitizeText } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("player_session");

    if (!session || !session.value) {
      return NextResponse.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
    }

    const playerId = session.value;
    const body = await req.json();
    const { deckNome, decklistRaw, tipoEnergia } = body;

    if (!deckNome || !decklistRaw) {
      return NextResponse.json({ error: "Nome do Deck e a lista de 60 cartas são obrigatórios." }, { status: 400 });
    }

    // 1. Validação Sintática Rigorosa da Decklist
    const parsed = parseAndValidateDecklist(decklistRaw);
    if (!parsed.isValid && parsed.error) {
      return NextResponse.json({ error: parsed.error, warnings: parsed.warnings }, { status: 400 });
    }

    // 2. Busca dados do jogador
    const player = await db.select().from(jogadores).where(eq(jogadores.id, playerId)).limit(1);
    if (player.length === 0) {
      return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    }

    // 3. Busca próximo evento do calendário
    const nextEvents = await db.select().from(calendario).orderBy(calendario.data).limit(1);
    const eventName = nextEvents[0]?.evento || "Próxima Etapa Oficial";
    const eventDate = nextEvents[0]?.data || new Date().toISOString().split("T")[0];

    // 4. Salva no histórico de decklists
    await db.insert(jogadorDecklists).values({
      jogadorId: playerId,
      jogadorNome: player[0].nome,
      eventoNome: eventName,
      etapaData: eventDate,
      deckNome: sanitizeText(deckNome),
      tipoEnergia: tipoEnergia || "colorless",
      decklistRaw: decklistRaw.trim(),
      totalCartas: parsed.totalCards,
      validada: parsed.totalCards === 60,
    });

    // 5. Atualiza o perfil ativo do jogador
    await db
      .update(jogadores)
      .set({
        deckAtivoNome: sanitizeText(deckNome),
        decklistTexto: decklistRaw.trim(),
      })
      .where(eq(jogadores.id, playerId));

    return NextResponse.json({
      success: true,
      message: "Decklist de 60 cartas validada e enviada com sucesso!",
      totalCards: parsed.totalCards,
      pokemonCount: parsed.pokemonCount,
      trainerCount: parsed.trainerCount,
      energyCount: parsed.energyCount,
      warnings: parsed.warnings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
