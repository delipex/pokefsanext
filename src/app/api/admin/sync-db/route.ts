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
import fs from "fs";
import path from "path";

// Cria as tabelas se elas não existirem no Turso / SQLite
async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS jogadores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      tipo_energia TEXT NOT NULL DEFAULT 'colorless',
      imagem TEXT,
      limitless TEXT,
      icone TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS etapas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL UNIQUE,
      temporada INTEGER NOT NULL DEFAULT 5,
      total_jogadores INTEGER NOT NULL DEFAULT 0,
      campeao TEXT,
      deck_campeao TEXT,
      nome_arquivo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS etapa_resultados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etapa_id INTEGER NOT NULL REFERENCES etapas(id) ON DELETE CASCADE,
      etapa_data TEXT NOT NULL,
      jogador_id TEXT,
      jogador_nome TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Master',
      colocacao INTEGER NOT NULL,
      pontos REAL NOT NULL DEFAULT 0,
      vitorias INTEGER NOT NULL DEFAULT 0,
      empates INTEGER NOT NULL DEFAULT 0,
      derrotas INTEGER NOT NULL DEFAULT 0,
      deck_nome TEXT,
      dropou INTEGER NOT NULL DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS ranking_consolidado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temporada INTEGER NOT NULL DEFAULT 5,
      jogador_id TEXT NOT NULL,
      jogador_nome TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Master',
      pontos REAL NOT NULL DEFAULT 0,
      vitorias INTEGER NOT NULL DEFAULT 0,
      empates INTEGER NOT NULL DEFAULT 0,
      derrotas INTEGER NOT NULL DEFAULT 0,
      podios INTEGER NOT NULL DEFAULT 0,
      media_colocacao REAL NOT NULL DEFAULT 0,
      participacoes INTEGER NOT NULL DEFAULT 0,
      historico_colocacoes TEXT DEFAULT '',
      ultimo_deck TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      descricao TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS metagame (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etapa_data TEXT NOT NULL,
      session_code TEXT,
      jogador_nome TEXT NOT NULL,
      deck_nome TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS campeoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temporada TEXT NOT NULL,
      campeao TEXT NOT NULL,
      vice TEXT NOT NULL,
      deck_campeao TEXT NOT NULL,
      data TEXT NOT NULL,
      foto_campeao TEXT,
      url_deck TEXT,
      imagem_deck TEXT,
      observacao_deck TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS galeria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      url_imagem TEXT NOT NULL,
      data TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS scores_antigos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temporada TEXT NOT NULL,
      data_fechamento TEXT,
      pos INTEGER NOT NULL,
      jogador TEXT NOT NULL,
      categoria TEXT DEFAULT 'ME',
      pontos TEXT DEFAULT '',
      deck TEXT DEFAULT ''
    );`,
    `CREATE TABLE IF NOT EXISTS calendario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      evento TEXT NOT NULL,
      local TEXT DEFAULT 'Livraria Atlântica +',
      horario TEXT DEFAULT '14:00',
      status TEXT DEFAULT 'confirmado',
      descricao TEXT,
      link_maps TEXT,
      link_inscricao TEXT,
      foto TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS jogador_decklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_nome TEXT NOT NULL,
      jogador_id TEXT,
      categoria TEXT NOT NULL,
      deck_nome TEXT NOT NULL,
      decklist_raw TEXT NOT NULL,
      cards_json TEXT NOT NULL,
      etapa_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.warn("Aviso ao criar tabela:", err);
    }
  }
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
