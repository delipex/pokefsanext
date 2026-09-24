import { client } from "./index";

let hasMigrated = false;

const DEFAULT_REGRAS = JSON.stringify([
  {
    icon: "ShieldCheck",
    color: "blue",
    title: "1. Formato do Torneio",
    content: [
      "As partidas das Sessões de Liga seguem o Formato Standard oficial estabelecido pela The Pokémon Company International.",
      "Legalidade: São permitidas apenas cartas com as marcas de regulamento vigentes (ex: bloco H e posteriores).",
      "Listas de Deck: Os jogadores são responsáveis por manter seus decks dentro das diretrizes de legalidade vigentes em cada etapa.",
    ],
  },
  {
    icon: "Trophy",
    color: "yellow",
    title: "2. Sistema de Pontuação e Ranking",
    content: [
      "Vitória: 3 pontos | Empate: 1 ponto | Derrota: 0 pontos.",
      "Multiplicadores de Eventos Especiais: League Challenge e League Cup possuem multiplicador de 1.5x a 2.0x sobre a pontuação.",
      "Critérios de Desempate no Ranking: 1º Pontos Acumulados ➔ 2º Número de Pódios (Top 4) ➔ 3º Média de Colocação (menor é melhor) ➔ 4º Ordem Alfabética.",
    ],
  },
  {
    icon: "Award",
    color: "purple",
    title: "3. Premiação e Playoffs Trimestrais",
    content: [
      "Ao final de cada temporada trimestral, os 4 melhores colocados avançam para os Playoffs (Top Cut).",
      "Formato do Top Cut: Rodada eliminatória presencial (Single Elimination).",
      "Premiação: Troféus personalizados, boosters exclusivos e premiações especiais para os campeões.",
    ],
  },
  {
    icon: "Scale",
    color: "emerald",
    title: "4. Código de Conduta e Fair Play",
    content: [
      "A integridade do jogo e o respeito mútuo são pilares fundamentais da nossa comunidade.",
      "Seguimos rigorosamente o manual de Play! Pokémon e as orientações da arbitragem oficial.",
      "Condutas antidesportivas, trapaças ou desrespeito a outros jogadores resultam em advertência ou desclassificação imediata da temporada.",
    ],
  },
]);

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

  // Inserir configurações padrão caso não existam
  const defaultConfigs = [
    { chave: "temporadaAtual", valor: "5", descricao: "Número da temporada atual ativa" },
    { chave: "adminPin", valor: "0408", descricao: "PIN de acesso ao painel de administração" },
    { chave: "nomeLiga", valor: "Liga Atlântica", descricao: "Nome oficial da liga" },
    { chave: "regras", valor: DEFAULT_REGRAS, descricao: "Regulamento oficial da Liga" },
    { chave: "exibirPodio", valor: "true", descricao: "Exibir pódio dos líderes na home" },
    { chave: "exibirProximoEvento", valor: "true", descricao: "Exibir card de próximo evento na home" },
    { chave: "inscricoesAtivas", valor: "false", descricao: "Flag de inscrições abertas para torneios" },
  ];

  for (const cfg of defaultConfigs) {
    try {
      await client.execute({
        sql: `INSERT INTO configuracoes (chave, valor, descricao) VALUES (?, ?, ?) ON CONFLICT(chave) DO NOTHING;`,
        args: [cfg.chave, cfg.valor, cfg.descricao],
      });
    } catch {
      // Ignora erro
    }
  }

  hasMigrated = true;

  // Auto-hidratação de dados iniciais caso as tabelas estejam vazias
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dataDir = path.join(process.cwd(), "src", "data");
    if (fs.existsSync(dataDir)) {
      // 1. Jogadores
      const countJogadores = await client.execute("SELECT COUNT(*) as cnt FROM jogadores;");
      const numJogadores = Number(countJogadores.rows[0]?.cnt || 0);
      if (numJogadores === 0) {
        const jFile = path.join(dataDir, "jogadores.json");
        if (fs.existsSync(jFile)) {
          const jData = JSON.parse(fs.readFileSync(jFile, "utf-8"));
          for (let i = 0; i < jData.length; i++) {
            const j = jData[i];
            const rawId = String(j.id || j.ID || "").trim();
            const nome = String(j.jogador || j.Jogador || j.nome || "").trim();
            if (!nome) continue;
            const id = rawId || `sem-id-${i + 1}`;
            const cat = j.categoria || j.Categoria || "Master";
            await client.execute({
              sql: `INSERT INTO jogadores (id, nome, categoria, status, ativo) VALUES (?, ?, ?, 'ativo', 1) ON CONFLICT(id) DO NOTHING;`,
              args: [id, nome, cat],
            });
          }
        }
      }

      // 2. Decks
      const countDecks = await client.execute("SELECT COUNT(*) as cnt FROM decks;");
      const numDecks = Number(countDecks.rows[0]?.cnt || 0);
      if (numDecks === 0) {
        const dFile = path.join(dataDir, "decks.json");
        if (fs.existsSync(dFile)) {
          const dData = JSON.parse(fs.readFileSync(dFile, "utf-8"));
          for (const d of dData) {
            const dNome = d.deck || d.nome;
            if (!dNome) continue;
            await client.execute({
              sql: `INSERT INTO decks (nome, tipo_energia, imagem, limitless, icone, ativo) VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT(nome) DO NOTHING;`,
              args: [dNome, d.tipoEnergia || "colorless", d.imagem || null, d.limitless || null, d.icone || null],
            });
          }
        }
      }

      // 3. Calendário
      const countCal = await client.execute("SELECT COUNT(*) as cnt FROM calendario;");
      const numCal = Number(countCal.rows[0]?.cnt || 0);
      if (numCal === 0) {
        const calFile = path.join(dataDir, "calendario.json");
        if (fs.existsSync(calFile)) {
          const calData = JSON.parse(fs.readFileSync(calFile, "utf-8"));
          for (const c of calData) {
            if (!c.data) continue;
            await client.execute({
              sql: `INSERT INTO calendario (data, evento, local, horario, status, descricao, link_maps, link_inscricao, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              args: [
                c.data,
                c.evento || "Torneio",
                c.local || "Livraria Atlântica +",
                c.horario || "14:00",
                c.status || "confirmado",
                c.descricao || null,
                c.linkMaps || null,
                c.linkInscricao || null,
                c.foto || null,
              ],
            });
          }
        }
      }

      // 4. Campeões
      const countCamp = await client.execute("SELECT COUNT(*) as cnt FROM campeoes;");
      const numCamp = Number(countCamp.rows[0]?.cnt || 0);
      if (numCamp === 0) {
        const campFile = path.join(dataDir, "campeoes.json");
        if (fs.existsSync(campFile)) {
          const campData = JSON.parse(fs.readFileSync(campFile, "utf-8"));
          for (const c of campData) {
            await client.execute({
              sql: `INSERT INTO campeoes (temporada, campeao, vice, deck_campeao, data, foto_campeao, url_deck, imagem_deck, observacao_deck) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              args: [
                c.Temporada || c.temporada || "Temporada",
                c.Campeao || c.campeao || "",
                c.Vice || c.vice || "",
                c.DeckCampeao || c.deckCampeao || "",
                c.Data || c.data || "",
                c.FotoCampeao || c.fotoCampeao || null,
                c.URLDeck || c.urlDeck || null,
                c.ImagemDeck || c.imagemDeck || null,
                c.ObservacaoDeck || c.observacaoDeck || null,
              ],
            });
          }
        }
      }

      // 5. Scores Antigos
      const countScores = await client.execute("SELECT COUNT(*) as cnt FROM scores_antigos;");
      const numScores = Number(countScores.rows[0]?.cnt || 0);
      if (numScores === 0) {
        const scFile = path.join(dataDir, "scores_antigos.json");
        if (fs.existsSync(scFile)) {
          const scData = JSON.parse(fs.readFileSync(scFile, "utf-8"));
          for (const s of scData) {
            await client.execute({
              sql: `INSERT INTO scores_antigos (temporada, data_fechamento, pos, jogador, categoria, pontos, deck) VALUES (?, ?, ?, ?, ?, ?, ?);`,
              args: [
                s.temporada || "",
                s.dataFechamento || "",
                Number(s.pos) || 1,
                s.jogador || "",
                s.categoria || "ME",
                String(s.pontos || "0"),
                s.deck || "",
              ],
            });
          }
        }
      }
    }
  } catch (seedErr) {
    console.warn("Aviso ao auto-hidratar banco de dados:", seedErr);
  }
}
