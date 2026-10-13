import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { configuracoes, rankingConsolidado, decks } from "@/db/schema";
import { eq, desc, asc, inArray } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import {
  SeasonFinalBrackets,
  BracketPlayer,
  generateEmptyMasterTop16,
  generateEmptySeniorJuniorTop8,
  updateBracketMatchWinner,
} from "@/lib/bracket-types";

const CONFIG_KEY = "season_final_brackets";

function getDefaultBrackets(temporada: number = 5): SeasonFinalBrackets {
  return {
    temporada,
    tituloEvento: `Torneio dos Campeões • Finais da Temporada ${temporada}`,
    dataEvento: "A definir",
    localEvento: "Livraria Atlântica +",
    statusGeral: "aguardando",
    master: generateEmptyMasterTop16([]),
    seniorJunior: generateEmptySeniorJuniorTop8([]),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    await ensureDatabaseSchema();

    // 1. Obter temporada atual
    let temporada = 5;
    try {
      const cfgRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      temporada = Number(cfgRows[0]?.valor) || 5;
    } catch {}

    // 2. Buscar chaveamento salvo
    const rows = await db.select().from(configuracoes).where(eq(configuracoes.chave, CONFIG_KEY));
    if (rows && rows.length > 0 && rows[0]?.valor) {
      try {
        const parsed: SeasonFinalBrackets = JSON.parse(rows[0].valor);
        return NextResponse.json({ success: true, brackets: parsed });
      } catch (e) {
        console.error("Erro ao fazer parse dos brackets salvos:", e);
      }
    }

    // 3. Fallback: estrutura vazia padrão
    const defaultData = getDefaultBrackets(temporada);
    return NextResponse.json({ success: true, brackets: defaultData });
  } catch (error: any) {
    console.error("Erro no GET /api/bracket:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { action } = body;

    let temporada = 5;
    try {
      const cfgRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      temporada = Number(cfgRows[0]?.valor) || 5;
    } catch {}

    // AÇÃO 1: Puxar Finalistas Diretamente do Ranking Oficial da Temporada
    if (action === "generate_from_ranking") {
      // Buscar decks cadastrados para mapear energias
      const allDecks = await db.select().from(decks);
      const deckEnergyMap = new Map<string, string>();
      allDecks.forEach((d) => {
        if (d.nome) deckEnergyMap.set(d.nome.toLowerCase().trim(), d.tipoEnergia || "colorless");
      });

      // 1. Top 16 Master
      const masterRanking = await db
        .select()
        .from(rankingConsolidado)
        .where(eq(rankingConsolidado.categoria, "Master"))
        .orderBy(
          desc(rankingConsolidado.pontos),
          desc(rankingConsolidado.podios),
          desc(rankingConsolidado.vitorias),
          asc(rankingConsolidado.mediaColocacao),
          asc(rankingConsolidado.jogadorNome)
        )
        .limit(16);

      const masterPlayers: BracketPlayer[] = masterRanking.map((p, idx) => {
        const dName = p.ultimoDeck || null;
        const dEnergy = dName ? deckEnergyMap.get(dName.toLowerCase().trim()) || "colorless" : null;
        return {
          id: p.jogadorId,
          nome: p.jogadorNome,
          categoria: "Master",
          seed: idx + 1,
          deckNome: dName,
          deckEnergia: dEnergy,
        };
      });

      // 2. Top 8 Senior + Junior (unificado)
      const sjRanking = await db
        .select()
        .from(rankingConsolidado)
        .where(inArray(rankingConsolidado.categoria, ["Senior", "Junior", "SENIOR", "JUNIOR"]))
        .orderBy(
          desc(rankingConsolidado.pontos),
          desc(rankingConsolidado.podios),
          desc(rankingConsolidado.vitorias),
          asc(rankingConsolidado.mediaColocacao),
          asc(rankingConsolidado.jogadorNome)
        )
        .limit(8);

      const sjPlayers: BracketPlayer[] = sjRanking.map((p, idx) => {
        const dName = p.ultimoDeck || null;
        const dEnergy = dName ? deckEnergyMap.get(dName.toLowerCase().trim()) || "colorless" : null;
        return {
          id: p.jogadorId,
          nome: p.jogadorNome,
          categoria: p.categoria,
          seed: idx + 1,
          deckNome: dName,
          deckEnergia: dEnergy,
        };
      });

      const newBrackets: SeasonFinalBrackets = {
        temporada,
        tituloEvento: body.tituloEvento || `Torneio dos Campeões • Finais da Temporada ${temporada}`,
        dataEvento: body.dataEvento || new Date().toISOString().split("T")[0],
        localEvento: body.localEvento || "Livraria Atlântica +",
        statusGeral: "em_andamento",
        master: generateEmptyMasterTop16(masterPlayers),
        seniorJunior: generateEmptySeniorJuniorTop8(sjPlayers),
        updatedAt: new Date().toISOString(),
      };

      // Salva no banco de dados
      await db
        .insert(configuracoes)
        .values({
          chave: CONFIG_KEY,
          valor: JSON.stringify(newBrackets),
          descricao: "Chaveamento das Finais da Temporada",
        })
        .onConflictDoUpdate({
          target: configuracoes.chave,
          set: {
            valor: JSON.stringify(newBrackets),
            descricao: "Chaveamento das Finais da Temporada",
          },
        });

      revalidatePath("/final");
      revalidatePath("/admin");

      return NextResponse.json({
        success: true,
        message: `Chaveamento gerado com sucesso! ${masterPlayers.length} atletas Master e ${sjPlayers.length} atletas Senior/Junior inseridos.`,
        brackets: newBrackets,
      });
    }

    // AÇÃO 2: Atualizar Resultado de Partida Específica
    if (action === "update_match") {
      const { categoryKey, matchId, winnerId, score1, score2 } = body;
      const rows = await db.select().from(configuracoes).where(eq(configuracoes.chave, CONFIG_KEY));
      let current: SeasonFinalBrackets =
        rows.length > 0 && rows[0]?.valor ? JSON.parse(rows[0].valor) : getDefaultBrackets(temporada);

      if (categoryKey === "master") {
        current.master = updateBracketMatchWinner(current.master, matchId, winnerId, Number(score1) || 0, Number(score2) || 0);
      } else if (categoryKey === "seniorJunior") {
        current.seniorJunior = updateBracketMatchWinner(current.seniorJunior, matchId, winnerId, Number(score1) || 0, Number(score2) || 0);
      }

      current.updatedAt = new Date().toISOString();

      await db
        .insert(configuracoes)
        .values({
          chave: CONFIG_KEY,
          valor: JSON.stringify(current),
          descricao: "Chaveamento das Finais da Temporada",
        })
        .onConflictDoUpdate({
          target: configuracoes.chave,
          set: { valor: JSON.stringify(current) },
        });

      revalidatePath("/final");
      revalidatePath("/admin");

      return NextResponse.json({ success: true, brackets: current });
    }

    // AÇÃO 3: Salvar Brackets Completos
    if (action === "save_brackets" && body.brackets) {
      const payload: SeasonFinalBrackets = {
        ...body.brackets,
        updatedAt: new Date().toISOString(),
      };

      await db
        .insert(configuracoes)
        .values({
          chave: CONFIG_KEY,
          valor: JSON.stringify(payload),
          descricao: "Chaveamento das Finais da Temporada",
        })
        .onConflictDoUpdate({
          target: configuracoes.chave,
          set: { valor: JSON.stringify(payload) },
        });

      revalidatePath("/final");
      revalidatePath("/admin");

      return NextResponse.json({ success: true, message: "Chaveamento salvo com sucesso!", brackets: payload });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no POST /api/bracket:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
