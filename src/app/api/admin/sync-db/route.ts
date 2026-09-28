import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, client } from "@/db";
import {
  jogadores,
  decks,
  etapas,
  rankingConsolidado,
  configuracoes,
  campeoes,
  galeria,
  scoresAntigos,
  calendario,
} from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

// Cria as tabelas e migra colunas se elas não existirem no Turso / SQLite
async function ensureTables() {
  await ensureDatabaseSchema();
}

function readDataFile<T = any>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(process.cwd(), "src", "data", filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (filename.endsWith(".json")) {
        return JSON.parse(content) as T;
      }
      return content as unknown as T;
    }
  } catch (err) {
    console.error(`Erro ao ler ${filename}:`, err);
  }
  return defaultValue;
}

export async function POST() {
  try {
    console.log("⚡ Sincronizando banco de dados...");
    await ensureTables();

    // 1. Configurações
    const configs = readDataFile<Record<string, any>>("config.json", {});
    for (const [chave, valor] of Object.entries(configs)) {
      await db
        .insert(configuracoes)
        .values({
          chave,
          valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
        })
        .onConflictDoUpdate({
          target: configuracoes.chave,
          set: {
            valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
          },
        });
    }

    // 2. Decks (com upsert por nome)
    await db.delete(decks);
    const rawDecks = readDataFile<any[]>("decks.json", []);
    const seenDecks = new Set<string>();
    for (const d of rawDecks) {
      const dNome = (d.deck || d.nome || "").trim();
      if (!dNome || seenDecks.has(dNome.toLowerCase())) continue;
      seenDecks.add(dNome.toLowerCase());
      await db.insert(decks).values({
        nome: dNome,
        tipoEnergia: d.tipoEnergia || "colorless",
        imagem: d.imagem || null,
        limitless: d.limitless || null,
        icone: d.icone || null,
        ativo: true,
      });
    }

    // 3. Jogadores (com leitura segura de jogador/Jogador/nome e auto-ID)
    const rawJogadores = readDataFile<any[]>("jogadores.json", []);
    for (let i = 0; i < rawJogadores.length; i++) {
      const j = rawJogadores[i];
      const nome = String(j.jogador || j.Jogador || j.nome || "").trim();
      if (!nome) continue;
      const rawId = String(j.id || j.ID || "").trim();
      const id = rawId || `sem-id-${i + 1}`;
      const cat = ["Master", "Senior", "Junior"].includes(j.categoria || j.Categoria)
        ? (j.categoria || j.Categoria)
        : "Master";

      await db
        .insert(jogadores)
        .values({
          id,
          nome,
          categoria: cat,
          ativo: true,
        })
        .onConflictDoUpdate({
          target: jogadores.id,
          set: {
            nome,
            categoria: cat,
            ativo: true,
          },
        });
    }

    // 4. Campeões (limpa antes para impedir duplicação a cada clique)
    await db.delete(campeoes);
    const rawCampeoes = readDataFile<any[]>("campeoes.json", []);
    for (const c of rawCampeoes) {
      const seasonLabel = String(c.Temporada || c.temporada || "1").trim();
      await db
        .insert(campeoes)
        .values({
          temporada: seasonLabel,
          campeao: c.Campeao || c.campeao || c.nome || "Desconhecido",
          vice: c.Vice || c.vice || "Desconhecido",
          deckCampeao: c.DeckCampeao || c.deckCampeao || c.deck || "Desconhecido",
          data: c.Data || c.data || "2026-01-01",
          fotoCampeao: c.FotoCampeao || c.fotoCampeao || c.foto || null,
          urlDeck: c.URLDeck || c.urlDeck || null,
          imagemDeck: c.ImagemDeck || c.imagemDeck || null,
          observacaoDeck: c.ObservacaoDeck || c.observacaoDeck || null,
        });
    }

    // Galeria de Fotos
    await db.delete(galeria);
    const rawGaleria = readDataFile<any[]>("galeria.json", []);
    for (const g of rawGaleria) {
      if (!g.urlImagem) continue;
      await db.insert(galeria).values({
        titulo: g.titulo || "Foto do Evento",
        descricao: g.descricao || null,
        urlImagem: g.urlImagem,
        data: g.data || null,
      });
    }

    // 5. Calendário
    await db.delete(calendario);
    const rawCal = readDataFile<any[]>("calendario.json", []);
    for (const cal of rawCal) {
      await db
        .insert(calendario)
        .values({
          data: cal.data,
          evento: cal.evento || cal.titulo || "Torneio Semanal",
          local: cal.local || "Livraria Atlântica +",
          horario: cal.horario || "14:00",
          status: cal.status || "confirmado",
          descricao: cal.descricao || null,
          linkMaps: cal.linkMaps || cal.linkMapa || null,
          linkInscricao: cal.linkInscricao || null,
        });
    }

    // 6. Scores Antigos
    const rawScores = readDataFile<any[]>("scores_antigos.json", []);
    await db.delete(scoresAntigos);
    for (const s of rawScores) {
      await db
        .insert(scoresAntigos)
        .values({
          temporada: String(s.temporada || "1"),
          pos: Number(s.pos) || 1,
          jogador: s.jogador,
          categoria: s.categoria || "ME",
          pontos: String(s.pontos || "0"),
          deck: s.deck || "Desconhecido",
        })
        .onConflictDoNothing();
    }

    // 7. Ranking Consolidado a partir de ranking.tdf
    const rankingContent = readDataFile<string>("ranking.tdf", "");
    if (rankingContent) {
      await db.delete(rankingConsolidado);
      const lines = rankingContent.split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1);
      for (const row of rows) {
        const cols = row.split("\t");
        if (cols.length < 12) continue;
        const [
          _pos,
          id,
          jogador,
          categoria,
          pontos,
          vitorias,
          empates,
          derrotas,
          podios,
          mediaColocacao,
          participacoes,
          historicoColocacoes,
        ] = cols;

        await db.insert(rankingConsolidado).values({
          temporada: 5,
          jogadorId: id.trim(),
          jogadorNome: jogador.trim(),
          categoria: categoria.trim(),
          pontos: Number(pontos) || 0,
          vitorias: Number(vitorias) || 0,
          empates: Number(empates) || 0,
          derrotas: Number(derrotas) || 0,
          podios: Number(podios) || 0,
          mediaColocacao: Number(mediaColocacao) || 0,
          participacoes: Number(participacoes) || 0,
          historicoColocacoes: historicoColocacoes ? historicoColocacoes.trim() : "",
        });
      }
    }

    try {
      await recalculateRankingConsolidado(5);
    } catch (e) {
      console.warn("Aviso ao recalcular ranking em sync-db:", e);
    }

    clearFileCache();

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/etapas");
    revalidatePath("/campeoes");
    revalidatePath("/calendario");
    revalidatePath("/regras");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({
      success: true,
      message: "Banco de dados sincronizado e tabelas populadas com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro na sincronizacao do banco:", error);
    return NextResponse.json(
      { error: "Falha ao sincronizar banco: " + error.message },
      { status: 500 }
    );
  }
}
