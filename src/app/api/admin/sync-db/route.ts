import { NextResponse } from "next/server";
import { db, client } from "@/db";
import {
  jogadores,
  decks,
  etapas,
  rankingConsolidado,
  configuracoes,
  campeoes,
  scoresAntigos,
  calendario,
} from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
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

    // 2. Decks
    const rawDecks = readDataFile<any[]>("decks.json", []);
    for (const d of rawDecks) {
      if (!d.deck) continue;
      await db
        .insert(decks)
        .values({
          nome: d.deck,
          tipoEnergia: d.tipoEnergia || "colorless",
          imagem: d.imagem || null,
          limitless: d.limitless || null,
          icone: d.icone || null,
        })
        .onConflictDoNothing();
    }

    // 3. Jogadores
    const rawJogadores = readDataFile<any[]>("jogadores.json", []);
    for (const j of rawJogadores) {
      if (!j.id && !j.nome) continue;
      await db
        .insert(jogadores)
        .values({
          id: j.id || j.nome,
          nome: j.nome,
          categoria: j.categoria || "Master",
          ativo: true,
        })
        .onConflictDoNothing();
    }

    // 4. Campeões
    const rawCampeoes = readDataFile<any[]>("campeoes.json", []);
    for (const c of rawCampeoes) {
      await db
        .insert(campeoes)
        .values({
          temporada: String(c.temporada || "1"),
          campeao: c.campeao || c.nome || "Desconhecido",
          vice: c.vice || "Desconhecido",
          deckCampeao: c.deckCampeao || c.deck || "Desconhecido",
          data: c.data || "2026-01-01",
          fotoCampeao: c.fotoCampeao || c.foto || null,
        })
        .onConflictDoNothing();
    }

    // 5. Calendário
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
        })
        .onConflictDoNothing();
    }

    // 6. Scores Antigos
    const rawScores = readDataFile<any[]>("scores_antigos.json", []);
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
