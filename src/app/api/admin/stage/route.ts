import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { etapas, etapaResultados, metagame, configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

// POST: Publicar nova etapa (ou atualizar existente)
export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { data, tipo, multiplicador, resultados, action } = body;

    // Se for apenas uma ação de recalcular o ranking geral:
    if (action === "recalculate") {
      const result = await recalculateRankingConsolidado();
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/campeoes");
      return NextResponse.json({
        success: true,
        message: `Ranking geral recalculado com sucesso! (${result.totalEtapas} etapas processadas, ${result.totalJogadores} jogadores consolidados).`,
        ...result,
      });
    }

    if (!data || !resultados || !Array.isArray(resultados)) {
      return NextResponse.json({ error: "Dados da etapa inválidos" }, { status: 400 });
    }

    // 0. Obter a temporada ativa das configurações
    let activeSeason = 5;
    try {
      const configRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      activeSeason = Number(configRows[0]?.valor) || 5;
    } catch {
      activeSeason = 5;
    }

    // 1. Inserir ou atualizar a etapa
    const [insertedEtapa] = await db
      .insert(etapas)
      .values({
        data,
        tipo: tipo || "Liga",
        multiplicador: Number(multiplicador) || 1.0,
        temporada: activeSeason,
        status: "concluida",
      })
      .onConflictDoUpdate({
        target: etapas.data,
        set: {
          tipo: tipo || "Liga",
          multiplicador: Number(multiplicador) || 1.0,
          temporada: activeSeason,
        },
      })
      .returning();

    const etapaId = insertedEtapa?.id;

    // 2. Limpar resultados anteriores da mesma data
    await db.delete(etapaResultados).where(eq(etapaResultados.etapaData, data));
    await db.delete(metagame).where(eq(metagame.etapaData, data));

    // 3. Inserir os resultados da etapa
    for (const res of resultados) {
      const deckName = res.deckNome && res.deckNome !== "Não registrado" && res.deckNome !== "Sem deck registrado" ? res.deckNome.trim() : null;

      await db.insert(etapaResultados).values({
        etapaId,
        etapaData: data,
        jogadorId: res.id ? String(res.id).trim() : null,
        jogadorNome: String(res.jogador).trim(),
        categoria: res.categoria || "Master",
        colocacao: Number(res.colocacao) || 99,
        pontos: Number(res.pontos) || 0,
        vitorias: Number(res.vitorias) || 0,
        empates: Number(res.empates) || 0,
        derrotas: Number(res.derrotas) || 0,
        deckNome: deckName,
        dropou: res.isDnf || false,
      });

      if (deckName) {
        await db.insert(metagame).values({
          etapaData: data,
          sessionCode: `${data}-${tipo || "Liga"}`,
          jogadorNome: String(res.jogador).trim(),
          deckNome: deckName,
        });
      }
    }

    // 4. Recalcular o ranking consolidado da temporada
    await recalculateRankingConsolidado(activeSeason);

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/campeoes");

    return NextResponse.json({
      success: true,
      message: "Etapa publicada, metagame atualizado e ranking consolidado recalculado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao publicar etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir uma etapa e recalcular o ranking automaticamente
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data");

    if (!data) {
      return NextResponse.json({ error: "Data da etapa não fornecida" }, { status: 400 });
    }

    // 1. Remover resultados, metagame e etapa do banco
    await db.delete(etapaResultados).where(eq(etapaResultados.etapaData, data));
    await db.delete(metagame).where(eq(metagame.etapaData, data));
    await db.delete(etapas).where(eq(etapas.data, data));

    // 2. Recalcular ranking geral consolidado
    const result = await recalculateRankingConsolidado();

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/campeoes");

    return NextResponse.json({
      success: true,
      message: `Etapa ${data} excluída e ranking recalculado com sucesso (${result.totalEtapas} etapas restantes).`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
