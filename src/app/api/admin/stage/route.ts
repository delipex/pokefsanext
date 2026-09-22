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

    // 4. Recalcular o ranking consolidado da temporada a partir de todas as etapas em ordem cronológica
    const allEtapas = await db.select().from(etapas);
    allEtapas.sort((a, b) => a.data.localeCompare(b.data));

    const etapaMap = new Map(allEtapas.map((e) => [e.data, e]));
    const allResults = await db.select().from(etapaResultados);

    // Mapear resultados por jogador (chave: jogadorId ou jogadorNome)
    const playerStatsMap: Record<string, any> = {};

    // Coletar todos os jogadores distintos
    for (const r of allResults) {
      const key = r.jogadorId ? String(r.jogadorId).trim() : String(r.jogadorNome).trim();
      if (!playerStatsMap[key]) {
        playerStatsMap[key] = {
          jogadorId: r.jogadorId ? String(r.jogadorId).trim() : "",
          jogadorNome: r.jogadorNome.trim(),
          categoria: r.categoria || "Master",
          pontos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          podios: 0,
          etapaColocacoes: new Map<string, number>(),
        };
      }

      const etapaInfo = etapaMap.get(r.etapaData);
      const mult = etapaInfo?.multiplicador ? Number(etapaInfo.multiplicador) : 1.0;
      const pontosPonderados = Math.round(r.pontos * mult);

      playerStatsMap[key].pontos += pontosPonderados;
      playerStatsMap[key].vitorias += r.vitorias;
      playerStatsMap[key].empates += r.empates;
      playerStatsMap[key].derrotas += r.derrotas;
      if (r.colocacao <= 4) playerStatsMap[key].podios += 1;
      playerStatsMap[key].etapaColocacoes.set(r.etapaData, r.colocacao);
    }

    // Criar array de jogadores consolidados
    const consolidatedList = Object.values(playerStatsMap).map((p) => {
      // Montar string cronológica: ex "1;5;-;3"
      const colocacoesList: (number | string)[] = [];
      const colocacoesNumericas: number[] = [];

      allEtapas.forEach((e) => {
        if (p.etapaColocacoes.has(e.data)) {
          const col = p.etapaColocacoes.get(e.data)!;
          colocacoesList.push(col);
          colocacoesNumericas.push(col);
        } else {
          colocacoesList.push("-");
        }
      });

      const participacoes = colocacoesNumericas.length;
      const somaColocacoes = colocacoesNumericas.reduce((a: number, b: number) => a + b, 0);
      const mediaColocacao = participacoes > 0 ? Number((somaColocacoes / participacoes).toFixed(2)) : 0;
      const historicoColocacoes = colocacoesList.join(";");

      return {
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
      };
    });

    // Ordenação Estrita Oficial do Ranking:
    // 1. Pontos DESC
    // 2. Pódios DESC
    // 3. Vitórias DESC
    // 4. Média de Colocação ASC (menor é melhor)
    // 5. Nome ASC
    consolidatedList.sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.podios !== a.podios) return b.podios - a.podios;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (a.mediaColocacao !== b.mediaColocacao) return a.mediaColocacao - b.mediaColocacao;
      return a.jogadorNome.localeCompare(b.jogadorNome, "pt-BR");
    });

    // Atualizar tabela de rankingConsolidado
    await db.delete(rankingConsolidado);

    for (const p of consolidatedList) {
      await db.insert(rankingConsolidado).values(p);
    }

    return NextResponse.json({
      success: true,
      message: "Etapa publicada e ranking consolidado recalculado com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao publicar etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
