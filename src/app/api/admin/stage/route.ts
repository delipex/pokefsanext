import { NextResponse } from "next/server";
import { db } from "@/db";
import { etapas, etapaResultados, rankingConsolidado, jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, tipo, multiplicador, resultados } = body;

    if (!data || !resultados || !Array.isArray(resultados)) {
      return NextResponse.json({ error: "Dados da etapa inválidos" }, { status: 400 });
    }

    // 1. Inserir ou atualizar a etapa
    const [insertedEtapa] = await db
      .insert(etapas)
      .values({
        data,
        tipo: tipo || "Liga",
        multiplicador: Number(multiplicador) || 1.0,
        temporada: 5,
        status: "concluida",
      })
      .onConflictDoUpdate({
        target: etapas.data,
        set: {
          tipo: tipo || "Liga",
          multiplicador: Number(multiplicador) || 1.0,
        },
      })
      .returning();

    const etapaId = insertedEtapa?.id;

    // 2. Limpar resultados anteriores da mesma data
    await db.delete(etapaResultados).where(eq(etapaResultados.etapaData, data));

    // 3. Inserir os resultados da etapa
    for (const res of resultados) {
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
      });
    }

    // 4. Recalcular o ranking consolidado da temporada a partir de todas as etapas
    const allEtapas = await db.select().from(etapas);
    const allResults = await db.select().from(etapaResultados);

    // Mapear por jogadorId ou jogadorNome
    const playerStatsMap: Record<string, any> = {};

    for (const r of allResults) {
      const key = r.jogadorId || r.jogadorNome;
      if (!playerStatsMap[key]) {
        playerStatsMap[key] = {
          jogadorId: r.jogadorId || "",
          jogadorNome: r.jogadorNome,
          categoria: r.categoria || "Master",
          pontos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          podios: 0,
          colocacoes: [] as number[],
        };
      }

      playerStatsMap[key].pontos += r.pontos;
      playerStatsMap[key].vitorias += r.vitorias;
      playerStatsMap[key].empates += r.empates;
      playerStatsMap[key].derrotas += r.derrotas;
      if (r.colocacao <= 4) playerStatsMap[key].podios += 1;
      playerStatsMap[key].colocacoes.push(r.colocacao);
    }

    // Atualizar tabela de rankingConsolidado
    await db.delete(rankingConsolidado);

    for (const p of Object.values(playerStatsMap)) {
      const participacoes = p.colocacoes.length;
      const somaColocacoes = p.colocacoes.reduce((a: number, b: number) => a + b, 0);
      const mediaColocacao = participacoes > 0 ? Number((somaColocacoes / participacoes).toFixed(2)) : 0;
      const historicoColocacoes = p.colocacoes.join(";");

      await db.insert(rankingConsolidado).values({
        temporada: 5,
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
      });
    }

    return NextResponse.json({ success: true, message: "Etapa publicada e ranking consolidado recalculado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao publicar etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
