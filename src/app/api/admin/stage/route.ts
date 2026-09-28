import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { etapas, etapaResultados, metagame, configuracoes, jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { clearFileCache, getEtapasWithSummary } from "@/lib/queries";
import { getCanonicalPlayersMap, resolveCanonicalPlayer } from "@/lib/player-canonical";
import fs from "fs";
import path from "path";

async function syncEtapasJson() {
  try {
    const allStages = await db.select().from(etapas).orderBy(etapas.data);
    const mapped = allStages.map((s) => ({
      data: s.data,
      tipo: s.tipo || "Liga",
      multiplicador: Number(s.multiplicador) || 1,
    }));

    const p1 = path.join(process.cwd(), "src", "data", "etapas.json");
    try {
      fs.writeFileSync(p1, JSON.stringify(mapped, null, 2), "utf-8");
    } catch {}

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "etapas.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(mapped, null, 2), "utf-8");
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar etapas.json:", err);
  }
}

// GET: Listar todas as etapas com resumo
export async function GET() {
  try {
    const etapasList = await getEtapasWithSummary();
    return NextResponse.json({ success: true, etapas: etapasList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Publicar nova etapa (ou atualizar existente)
export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { data, tipo, multiplicador, resultados, action } = body;

    // Se for apenas uma ação de recalcular o ranking geral:
    if (action === "recalculate") {
      const result = await recalculateRankingConsolidado();
      await syncEtapasJson();
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

    if (!data || !resultados || !Array.isArray(resultados) || resultados.length === 0) {
      return NextResponse.json({ error: "A etapa precisa conter resultados e participantes válidos do arquivo TDF para ser publicada." }, { status: 400 });
    }

    // 0. Obter a temporada ativa das configurações
    let activeSeason = 5;
    try {
      const configRows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
      activeSeason = Number(configRows[0]?.valor) || 5;
    } catch {
      activeSeason = 5;
    }

    // 1. Inserir ou atualizar a etapa de forma segura
    const cleanData = String(data).trim();
    const cleanTipo = String(tipo || "Liga").trim();
    const cleanMult = Number(multiplicador) || 1.0;

    const existingEtapa = await db.select().from(etapas).where(eq(etapas.data, cleanData));
    let etapaId: number | undefined;

    if (existingEtapa && existingEtapa.length > 0) {
      etapaId = existingEtapa[0].id;
      await db
        .update(etapas)
        .set({
          tipo: cleanTipo,
          multiplicador: cleanMult,
          temporada: activeSeason,
          status: "concluida",
        })
        .where(eq(etapas.id, etapaId));
    } else {
      await db.insert(etapas).values({
        data: cleanData,
        tipo: cleanTipo,
        multiplicador: cleanMult,
        temporada: activeSeason,
        status: "concluida",
      });
      const newlyInserted = await db.select().from(etapas).where(eq(etapas.data, cleanData));
      etapaId = newlyInserted[0]?.id;
    }

    // 2. Limpar resultados anteriores da mesma data
    await db.delete(etapaResultados).where(eq(etapaResultados.etapaData, cleanData));
    await db.delete(metagame).where(eq(metagame.etapaData, cleanData));

    // 3. Inserir os resultados da etapa e auto-cadastrar jogadores se necessário
    const canonicalMaps = await getCanonicalPlayersMap();
    const tdfRows: string[] = ["Pos\tID\tJogador\tCategoria\tPontos\tVitorias\tEmpates\tDerrotas"];

    for (const res of resultados) {
      const deckName = res.deckNome && res.deckNome !== "Não registrado" && res.deckNome !== "Sem deck registrado" ? res.deckNome.trim() : null;
      const rawNome = String(res.jogador || "").trim();
      const rawId = res.id ? String(res.id).trim() : null;
      const canonical = resolveCanonicalPlayer({ id: rawId, nome: rawNome, categoria: res.categoria }, canonicalMaps);
      const jogadorNome = canonical.nome;
      const jogadorId = canonical.id || rawId;

      if (jogadorId) {
        try {
          const existingPlayer = await db.select().from(jogadores).where(eq(jogadores.id, jogadorId));
          if (!existingPlayer || existingPlayer.length === 0) {
            await db.insert(jogadores).values({
              id: jogadorId,
              nome: jogadorNome,
              categoria: canonical.categoria || "Master",
              status: "ativo",
              ativo: true,
            });
          }
        } catch (e) {
          console.warn(`Aviso ao auto-cadastrar jogador ${jogadorNome} (${jogadorId}):`, e);
        }
      }

      await db.insert(etapaResultados).values({
        etapaId: etapaId || null,
        etapaData: cleanData,
        jogadorId: jogadorId,
        jogadorNome: jogadorNome,
        categoria: canonical.categoria || "Master",
        colocacao: Number(res.colocacao) || 99,
        pontos: Number(res.pontos) || 0,
        vitorias: Number(res.vitorias) || 0,
        empates: Number(res.empates) || 0,
        derrotas: Number(res.derrotas) || 0,
        deckNome: deckName,
        dropou: Boolean(res.isDnf || res.dropou),
      });

      if (deckName) {
        await db.insert(metagame).values({
          etapaData: cleanData,
          sessionCode: `${cleanData}-${cleanTipo}`,
          jogadorNome: jogadorNome,
          deckNome: deckName,
        });
      }

      tdfRows.push(
        `${res.colocacao}\t${jogadorId || ""}\t${jogadorNome}\t${canonical.categoria || "Master"}\t${res.pontos || 0}\t${res.vitorias || 0}\t${res.empates || 0}\t${res.derrotas || 0}`
      );
    }

    // Gravar backup do arquivo TDF em disco
    try {
      const tdfContent = tdfRows.join("\n");
      const f1 = path.join(process.cwd(), "src", "data", "etapas", `${cleanData}.tdf`);
      fs.writeFileSync(f1, tdfContent, "utf-8");

      const f2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "etapas", `${cleanData}.tdf`);
      if (fs.existsSync(path.dirname(f2))) {
        fs.writeFileSync(f2, tdfContent, "utf-8");
      }
    } catch (e) {
      console.warn("Aviso ao salvar backup do TDF em disco:", e);
    }

    // 4. Recalcular o ranking consolidado da temporada
    await recalculateRankingConsolidado(activeSeason);
    await syncEtapasJson();

    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/etapas");
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

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
    await syncEtapasJson();

    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/etapas");
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Etapa ${data} excluída e ranking recalculado com sucesso (${result.totalEtapas} etapas restantes).`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Atualizar tipo e multiplicador de uma etapa e recalcular o ranking consolidado
export async function PATCH(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { data, tipo, multiplicador } = body;

    if (!data) {
      return NextResponse.json({ error: "Data da etapa não fornecida" }, { status: 400 });
    }

    const mult = Number(multiplicador) || 1.0;

    const updateFields: Record<string, any> = { multiplicador: mult };
    if (tipo !== undefined && tipo !== null) {
      updateFields.tipo = String(tipo).trim() || "Liga";
    }

    await db.update(etapas).set(updateFields).where(eq(etapas.data, data));

    // Recalcular o ranking consolidado da temporada
    const result = await recalculateRankingConsolidado();
    await syncEtapasJson();

    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/etapas");
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Etapa ${data} atualizada para ${mult}x e ranking consolidado recalculado com sucesso!`,
      ...result,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
