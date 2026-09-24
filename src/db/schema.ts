import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. Tabela de Jogadores Cadastrados
export const jogadores = sqliteTable("jogadores", {
  id: text("id").primaryKey(), // POP ID / TOM ID (ex: '5685779')
  nome: text("nome").notNull(),
  categoria: text("categoria", { enum: ["Master", "Senior", "Junior"] }).notNull().default("Master"),
  posicaoFinal: integer("posicao_final"), // Posição consolidada da temporada anterior (opcional)
  avatarUrl: text("avatar_url"),
  pinHash: text("pin_hash"), // Hash criptografado do PIN pessoal
  whatsapp: text("whatsapp"), // Contato com DDD
  dataNascimento: text("data_nascimento"), // YYYY-MM-DD
  cidade: text("cidade").default("Feira de Santana - BA"),
  deckAtivoNome: text("deck_ativo_nome"),
  decklistTexto: text("decklist_texto"),
  status: text("status").default("ativo"), // 'ativo', 'pendente'
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 2. Tabela de Decks / Arquétipos Pokémon
export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull().unique(), // ex: 'Charizard Ex', 'Gardevoir Ex'
  tipoEnergia: text("tipo_energia").notNull(), // ex: 'fire', 'psychic', 'darkness+fire'
  imagem: text("imagem"), // Carta destaque / imagem do deck
  limitless: text("limitless"), // Link de lista no LimitlessTCG
  icone: text("icone"), // Sprite / ícone Pokémon
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
});

// 3. Tabela de Etapas / Torneios
export const etapas = sqliteTable("etapas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data").notNull().unique(), // Formato: YYYY-MM-DD
  tipo: text("tipo").notNull().default("Liga"), // 'Liga', 'Challenge', 'Cup', 'Off-meta'
  multiplicador: real("multiplicador").notNull().default(1.0),
  temporada: integer("temporada").notNull().default(5),
  status: text("status", { enum: ["agendada", "em_andamento", "concluida"] }).notNull().default("concluida"),
  tdfUrl: text("tdf_url"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 4. Resultados de Partidas/Etapas por Jogador
export const etapaResultados = sqliteTable("etapa_resultados", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  etapaId: integer("etapa_id").references(() => etapas.id, { onDelete: "cascade" }),
  etapaData: text("etapa_data").notNull(),
  jogadorId: text("jogador_id"),
  jogadorNome: text("jogador_nome").notNull(),
  categoria: text("categoria").default("Master"),
  colocacao: integer("colocacao").notNull(),
  pontos: real("pontos").notNull().default(0),
  vitorias: integer("vitorias").notNull().default(0),
  empates: integer("empates").notNull().default(0),
  derrotas: integer("derrotas").notNull().default(0),
  deckNome: text("deck_nome"),
  dropou: integer("dropou", { mode: "boolean" }).notNull().default(false),
});

// 5. Ranking Consolidado da Temporada Ativa
export const rankingConsolidado = sqliteTable("ranking_consolidado", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  temporada: integer("temporada").notNull().default(5),
  jogadorId: text("jogador_id").notNull(),
  jogadorNome: text("jogador_nome").notNull(),
  categoria: text("categoria").notNull().default("Master"),
  pontos: real("pontos").notNull().default(0),
  vitorias: integer("vitorias").notNull().default(0),
  empates: integer("empates").notNull().default(0),
  derrotas: integer("derrotas").notNull().default(0),
  podios: integer("podios").notNull().default(0),
  mediaColocacao: real("media_colocacao").notNull().default(0),
  participacoes: integer("participacoes").notNull().default(0),
  historicoColocacoes: text("historico_colocacoes").default(""), // ex: '1;4;2;-;5'
  ultimoDeck: text("ultimo_deck"),
});

// 6. Configurações Globais da Liga
export const configuracoes = sqliteTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
  descricao: text("descricao"),
});

// 7. Tabela de Metagame (Decks jogados por etapa)
export const metagame = sqliteTable("metagame", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  etapaData: text("etapa_data").notNull(),
  sessionCode: text("session_code"),
  jogadorNome: text("jogador_nome").notNull(),
  deckNome: text("deck_nome").notNull(),
});

// 8. Tabela de Campeões Históricos (Hall da Fama)
export const campeoes = sqliteTable("campeoes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  temporada: text("temporada").notNull(),
  campeao: text("campeao").notNull(),
  vice: text("vice").notNull(),
  deckCampeao: text("deck_campeao").notNull(),
  data: text("data").notNull(),
  fotoCampeao: text("foto_campeao"),
  urlDeck: text("url_deck"),
  imagemDeck: text("imagem_deck"),
  observacaoDeck: text("observacao_deck"),
});

// 9. Galeria de Fotos dos Torneios
export const galeria = sqliteTable("galeria", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  urlImagem: text("url_imagem").notNull(),
  data: text("data"),
});

// 10. Scores Antigos (Era Legada das Temporadas #1 a #4)
export const scoresAntigos = sqliteTable("scores_antigos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  temporada: text("temporada").notNull(),
  dataFechamento: text("data_fechamento"),
  pos: integer("pos").notNull(),
  jogador: text("jogador").notNull(),
  categoria: text("categoria").default("ME"),
  pontos: text("pontos").default(""),
  deck: text("deck").default(""),
});

// 11. Tabela de Calendário de Eventos Futuros
export const calendario = sqliteTable("calendario", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data").notNull(),
  evento: text("evento").notNull(),
  local: text("local").default("Livraria Atlântica +"),
  horario: text("horario").default("14:00"),
  status: text("status").default("confirmado"),
  descricao: text("descricao"),
  linkMaps: text("link_maps"),
  linkInscricao: text("link_inscricao"),
  foto: text("foto"),
});

// 12. Tabela de Submissão de Decklists e Inscrições Premier
export const jogadorDecklists = sqliteTable("jogador_decklists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  protocolo: text("protocolo"),
  jogadorId: text("jogador_id"),
  jogadorNome: text("jogador_nome").notNull(),
  categoria: text("categoria").default("Master"),
  eventoNome: text("evento_nome"),
  etapaData: text("etapa_data").notNull(),
  deckNome: text("deck_nome").notNull(),
  tipoEnergia: text("tipo_energia").default("colorless"),
  decklistRaw: text("decklist_raw").default(""),
  totalCartas: integer("total_cartas").default(60),
  validada: integer("validada", { mode: "boolean" }).default(false),
  statusPix: text("status_pix").default("Pendente"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
