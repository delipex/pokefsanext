import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { etapaResultados, metagame, rankingConsolidado } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { clearFileCache } from "@/lib/queries";
import { getCanonicalPlayersMap, resolveCanonicalPlayer } from "@/lib/player-canonical";
import fs from "fs";
import path from "path";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { etapaData, decksMap } = body;

    if (!etapaData || !decksMap || typeof decksMap !== "object") {
      return NextResponse.json({ error: "Dados inválidos para atualização do metagame" }, { status: 400 });
    }

    const canonicalMaps = await getCanonicalPlayersMap();

    // 1. Atualizar etapa_resultados com match case-insensitive
    for (const [rawNome, deckNome] of Object.entries<any>(decksMap)) {
      const cleanDeck =
        deckNome && deckNome !== "Não registrado" && deckNome !== "Sem deck registrado"
          ? String(deckNome).trim()
          : null;
      const canonical = resolveCanonicalPlayer({ nome: rawNome }, canonicalMaps);
      const jogadorNome = canonical.nome;
      const normName = jogadorNome.toLowerCase().trim();
      const rawNormName = String(rawNome).toLowerCase().trim();

      await db
        .update(etapaResultados)
        .set({ deckNome: cleanDeck, jogadorNome: jogadorNome })
        .where(
          and(
            eq(etapaResultados.etapaData, etapaData),
            or(
              eq(etapaResultados.jogadorNome, jogadorNome),
              eq(etapaResultados.jogadorNome, rawNome),
              eq(sql`lower(trim(${etapaResultados.jogadorNome}))`, normName),
              eq(sql`lower(trim(${etapaResultados.jogadorNome}))`, rawNormName)
            )
          )
        );

      // 2. Atualizar ou inserir na tabela de metagame
      if (cleanDeck) {
        await db
          .delete(metagame)
          .where(
            and(
              eq(metagame.etapaData, etapaData),
              or(
                eq(metagame.jogadorNome, jogadorNome),
                eq(metagame.jogadorNome, rawNome),
                eq(sql`lower(trim(${metagame.jogadorNome}))`, normName),
                eq(sql`lower(trim(${metagame.jogadorNome}))`, rawNormName)
              )
            )
          );

        await db.insert(metagame).values({
          etapaData,
          sessionCode: `${etapaData}-Liga`,
          jogadorNome: jogadorNome,
          deckNome: cleanDeck,
        });
      } else {
        await db
          .delete(metagame)
          .where(
            and(
              eq(metagame.etapaData, etapaData),
              or(
                eq(metagame.jogadorNome, jogadorNome),
                eq(metagame.jogadorNome, rawNome),
                eq(sql`lower(trim(${metagame.jogadorNome}))`, normName),
                eq(sql`lower(trim(${metagame.jogadorNome}))`, rawNormName)
              )
            )
          );
      }
    }

    // 3. Atualizar fisicamente o arquivo src/data/metagame.json
    try {
      const metaPath = path.join(process.cwd(), "src", "data", "metagame.json");
      let currentMeta: Record<string, any> = {};
      if (fs.existsSync(metaPath)) {
        try {
          currentMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        } catch (e) {
          currentMeta = {};
        }
      }

      if (!currentMeta[etapaData]) {
        currentMeta[etapaData] = { sessionCode: `${etapaData}-Liga`, decks: {} };
      }
      if (!currentMeta[etapaData].decks) {
        currentMeta[etapaData].decks = {};
      }

      for (const [rawNome, deckNome] of Object.entries<any>(decksMap)) {
        const cleanDeck =
          deckNome && deckNome !== "Não registrado" && deckNome !== "Sem deck registrado"
            ? String(deckNome).trim()
            : null;
        const canonical = resolveCanonicalPlayer({ nome: rawNome }, canonicalMaps);
        const jogadorNome = canonical.nome;

        if (cleanDeck) {
          currentMeta[etapaData].decks[jogadorNome] = cleanDeck;
        } else {
          delete currentMeta[etapaData].decks[jogadorNome];
        }
      }

      fs.writeFileSync(metaPath, JSON.stringify(currentMeta, null, 4), "utf-8");

      // Sincronizar com repositório legado se existir
      const ligaMetaPath = path.resolve(process.cwd(), "..", "LigaAtlântica", "metagame.json");
      if (fs.existsSync(ligaMetaPath)) {
        try {
          fs.writeFileSync(ligaMetaPath, JSON.stringify(currentMeta, null, 4), "utf-8");
        } catch (e) {}
      }
    } catch (fsErr) {
      console.warn("Aviso ao persistir metagame.json:", fsErr);
    }

    // 4. Limpar cache em memória e recalcular ranking consolidado
    clearFileCache();
    await recalculateRankingConsolidado();

    // 5. Revalidar rotas públicas Next.js
    try {
      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/etapas");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Metagame e decks da etapa atualizados e sincronizados com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar metagame da etapa:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
