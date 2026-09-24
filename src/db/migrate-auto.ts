import { client } from "./index";

let hasMigrated = false;

export async function ensureDatabaseSchema() {
  if (hasMigrated) return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS jogadores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Master',
      posicao_final INTEGER,
      avatar_url TEXT,
      pin_hash TEXT,
      whatsapp TEXT,
      data_nascimento TEXT,
      cidade TEXT DEFAULT 'Feira de Santana - BA',
      deck_ativo_nome TEXT,
      decklist_texto TEXT,
      status TEXT DEFAULT 'ativo',
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      tipo_energia TEXT NOT NULL DEFAULT 'colorless',
      imagem TEXT,
      limitless TEXT,
      icone TEXT,
      ativo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS etapas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL DEFAULT 'Liga',
      multiplicador REAL NOT NULL DEFAULT 1.0,
      temporada INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'concluida',
      tdf_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS etapa_resultados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etapa_id INTEGER REFERENCES etapas(id) ON DELETE CASCADE,
      etapa_data TEXT NOT NULL,
      jogador_id TEXT,
      jogador_nome TEXT NOT NULL,
      categoria TEXT DEFAULT 'Master',
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

  // Executa criação das tabelas
  for (const sql of tables) {
    try {
      await client.execute(sql);
    } catch (err) {
      // Silencioso se já existir
    }
  }

  // Safe ALTER TABLE para tabelas existentes que possam estar sem colunas novas
  const alterStatements = [
    `ALTER TABLE jogadores ADD COLUMN posicao_final INTEGER;`,
    `ALTER TABLE jogadores ADD COLUMN avatar_url TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN pin_hash TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN whatsapp TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN data_nascimento TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN cidade TEXT DEFAULT 'Feira de Santana - BA';`,
    `ALTER TABLE jogadores ADD COLUMN deck_ativo_nome TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN decklist_texto TEXT;`,
    `ALTER TABLE jogadores ADD COLUMN status TEXT DEFAULT 'ativo';`,
    `ALTER TABLE jogadores ADD COLUMN ativo INTEGER DEFAULT 1;`,
    `ALTER TABLE jogadores ADD COLUMN created_at TEXT DEFAULT (datetime('now'));`,
    `ALTER TABLE decks ADD COLUMN tipo_energia TEXT DEFAULT 'colorless';`,
    `ALTER TABLE decks ADD COLUMN imagem TEXT;`,
    `ALTER TABLE decks ADD COLUMN limitless TEXT;`,
    `ALTER TABLE decks ADD COLUMN icone TEXT;`,
    `ALTER TABLE decks ADD COLUMN ativo INTEGER DEFAULT 1;`,
    `ALTER TABLE etapas ADD COLUMN tipo TEXT DEFAULT 'Liga';`,
    `ALTER TABLE etapas ADD COLUMN multiplicador REAL DEFAULT 1.0;`,
    `ALTER TABLE etapas ADD COLUMN temporada INTEGER DEFAULT 5;`,
    `ALTER TABLE etapas ADD COLUMN status TEXT DEFAULT 'concluida';`,
    `ALTER TABLE etapas ADD COLUMN tdf_url TEXT;`,
    `ALTER TABLE calendario ADD COLUMN link_maps TEXT;`,
    `ALTER TABLE calendario ADD COLUMN link_inscricao TEXT;`,
    `ALTER TABLE calendario ADD COLUMN foto TEXT;`,
    `ALTER TABLE campeoes ADD COLUMN foto_campeao TEXT;`,
    `ALTER TABLE campeoes ADD COLUMN url_deck TEXT;`,
    `ALTER TABLE campeoes ADD COLUMN imagem_deck TEXT;`,
    `ALTER TABLE campeoes ADD COLUMN observacao_deck TEXT;`,
  ];

  for (const alterSql of alterStatements) {
    try {
      await client.execute(alterSql);
    } catch {
      // Ignora erro se coluna já existir (comportamento padrão do SQLite para duplicatas)
    }
  }

  hasMigrated = true;
}
