import { db } from "@/db";
import {
  jogadores,
  decks,
  etapas,
  etapaResultados,
  rankingConsolidado,
  configuracoes,
  metagame,
  campeoes,
  galeria,
  scoresAntigos,
  calendario,
  jogadorDecklists,
} from "@/db/schema";
import { desc, asc, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Helper para ler arquivos de dados locais com segurança
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
    console.error(`Erro ao ler arquivo ${filename}:`, err);
  }
  return defaultValue;
}

// Mapa de decks por etapa a partir de metagame.json
function getMetagameMap(): Record<string, Record<string, string>> {
  const meta = readDataFile<Record<string, any>>("metagame.json", {});
  const map: Record<string, Record<string, string>> = {};
  for (const [etapaData, sessao] of Object.entries<any>(meta)) {
    map[etapaData] = {};
    const decksMap = sessao.decks || {};
    for (const [pName, dName] of Object.entries<string>(decksMap)) {
      if (pName && dName) {
        map[etapaData][pName.trim().toLowerCase()] = dName.trim();
      }
    }
  }
  return map;
}

// Busca o último deck jogado por cada jogador ao longo de todas as etapas
function getLatestDecksMap(): Record<string, string> {
  const meta = readDataFile<Record<string, any>>("metagame.json", {});
  const dates = Object.keys(meta).sort(); // datas em ordem cronológica
  const playerLatestDeck: Record<string, string> = {};

  for (const dt of dates) {
    const decksMap = meta[dt]?.decks || {};
    for (const [pName, dName] of Object.entries<string>(decksMap)) {
      if (pName && dName && dName.toLowerCase() !== "outros") {
        playerLatestDeck[pName.trim().toLowerCase()] = dName.trim();
      }
    }
  }
  return playerLatestDeck;
}

// Fallback ranking parser para ranking.tdf
function getFallbackRanking(): any[] {
  const content = readDataFile<string>("ranking.tdf", "");
  if (!content) return [];
  const latestDecks = getLatestDecksMap();
  const lines = content.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1);
  return rows.map((row) => {
    const cols = row.split("\t");
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

    const jName = jogador ? jogador.trim() : "";
    const ultimoDeck = latestDecks[jName.toLowerCase()] || null;

    return {
      temporada: 5,
      jogadorId: id ? id.trim() : "",
      jogadorNome: jName,
      categoria: categoria ? categoria.trim() : "Master",
      pontos: Number(pontos) || 0,
      vitorias: Number(vitorias) || 0,
      empates: Number(empates) || 0,
      derrotas: Number(derrotas) || 0,
      podios: Number(podios) || 0,
      mediaColocacao: Number(mediaColocacao) || 0,
      participacoes: Number(participacoes) || 0,
      historicoColocacoes: historicoColocacoes ? historicoColocacoes.trim() : "",
      ultimoDeck,
    };
  });
}

// Parse completo de todas as etapas e seus resultados a partir dos TDFs
function getFallbackEtapas(): any[] {
  const rawEtapas = readDataFile<any[]>("etapas.json", []);
  const metaMap = getMetagameMap();
  const etapasDir = path.join(process.cwd(), "src", "data", "etapas");

  return rawEtapas.map((etapa, idx) => {
    const tdfName = `${etapa.data}.tdf`;
    const tdfPath = path.join(etapasDir, tdfName);
    let stageResults: any[] = [];
    let campeaoNome = etapa.campeao || null;
    let campeaoDeck = etapa.deckCampeao || null;

    if (fs.existsSync(tdfPath)) {
      try {
        const tdfContent = fs.readFileSync(tdfPath, "utf-8");
        const lines = tdfContent.split(/\r?\n/).filter(Boolean);
        const rows = lines.slice(1);

        stageResults = rows.map((r, rIdx) => {
          const cols = r.split("\t");
          const [pos, id, jogador, categoria, pontos, vitorias, empates, derrotas] = cols;
          const pName = jogador ? jogador.trim() : "";
          const pDeck = metaMap[etapa.data]?.[pName.toLowerCase()] || null;

          return {
            id: rIdx + 1,
            etapaData: etapa.data,
            jogadorId: id ? id.trim() : null,
            jogadorNome: pName,
            categoria: categoria ? categoria.trim() : "Master",
            colocacao: Number(pos) || (rIdx + 1),
            pontos: Number(pontos) || 0,
            vitorias: Number(vitorias) || 0,
            empates: Number(empates) || 0,
            derrotas: Number(derrotas) || 0,
            deckNome: pDeck,
          };
        });

        const first = stageResults.find((r) => r.colocacao === 1);
        if (first) {
          campeaoNome = first.jogadorNome;
          campeaoDeck = first.deckNome || campeaoDeck;
        }
      } catch (e) {
        console.error(`Erro ao ler TDF da etapa ${etapa.data}:`, e);
      }
    }

    const top4 = stageResults.filter((r) => r.colocacao <= 4);

    return {
      id: idx + 1,
      data: etapa.data,
      tipo: etapa.tipo || "Liga",
      multiplicador: etapa.multiplicador || 1.0,
      temporada: etapa.temporada || 5,
      totalJogadores: stageResults.length || etapa.totalJogadores || 0,
      campeaoNome,
      campeaoId: null,
      campeaoDeck,
      top4,
      resultados: stageResults,
    };
  });
}

export async function getRanking(categoria?: string) {
  try {
    let query = db
      .select()
      .from(rankingConsolidado)
      .orderBy(
        desc(rankingConsolidado.pontos),
        desc(rankingConsolidado.podios),
        asc(rankingConsolidado.mediaColocacao),
        asc(rankingConsolidado.jogadorNome)
      );

    if (categoria && categoria !== "TODOS") {
      // @ts-ignore
      query = query.where(eq(rankingConsolidado.categoria, categoria.toUpperCase()));
    }

    const res = await query;
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const fallback = getFallbackRanking();
  if (categoria && categoria !== "TODOS") {
    return fallback.filter((r) => r.categoria?.toUpperCase() === categoria.toUpperCase());
  }
  return fallback;
}

export async function getTop4Podium() {
  try {
    const res = await db
      .select()
      .from(rankingConsolidado)
      .orderBy(
        desc(rankingConsolidado.pontos),
        desc(rankingConsolidado.podios),
        asc(rankingConsolidado.mediaColocacao),
        asc(rankingConsolidado.jogadorNome)
      )
      .limit(4);
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const fallback = getFallbackRanking();
  return fallback.slice(0, 4);
}

export async function getAllDecks() {
  try {
    const res = await db.select().from(decks).where(eq(decks.ativo, true)).orderBy(asc(decks.nome));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const rawDecks = readDataFile<any[]>("decks.json", []);
  return rawDecks.map((d, i) => ({
    id: i + 1,
    nome: d.deck || "",
    tipoEnergia: d.tipoEnergia || "colorless",
    imagem: d.imagem || null,
    limitless: d.limitless || null,
    icone: d.icone || null,
    ativo: true,
  }));
}

export async function getAllEtapas() {
  try {
    const res = await db.select().from(etapas).orderBy(desc(etapas.data));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("etapas.json", []);
}

export async function getEtapasWithSummary() {
  try {
    const allEtapas = await db.select().from(etapas).orderBy(desc(etapas.data));
    const results = await db
      .select()
      .from(etapaResultados)
      .orderBy(asc(etapaResultados.colocacao));

    if (allEtapas && allEtapas.length > 0 && results.length > 0) {
      return allEtapas.map((etapa) => {
        const etapaMatches = results.filter((r) => r.etapaData === etapa.data);
        const campeao = etapaMatches.find((r) => r.colocacao === 1);
        const top4 = etapaMatches.filter((r) => r.colocacao <= 4);

        return {
          ...etapa,
          totalJogadores: etapaMatches.length,
          campeaoNome: campeao?.jogadorNome || null,
          campeaoId: campeao?.jogadorId || null,
          campeaoDeck: campeao?.deckNome || null,
          top4,
          resultados: etapaMatches,
        };
      });
    }
  } catch (err) {
    // Silencioso
  }

  return getFallbackEtapas();
}

export async function getMetagameData() {
  let allMeta: any[] = [];
  let allDecks: any[] = [];
  let allEtapas: any[] = [];
  let allResults: any[] = [];

  try {
    [allMeta, allDecks, allEtapas, allResults] = await Promise.all([
      db.select().from(metagame).catch(() => []),
      db.select().from(decks).catch(() => []),
      db.select().from(etapas).orderBy(desc(etapas.data)).catch(() => []),
      db.select().from(etapaResultados).catch(() => []),
    ]);
  } catch (err) {
    // Silencioso
  }

  if (!allMeta || allMeta.length === 0) {
    const rawMeta = readDataFile<Record<string, any>>("metagame.json", {});
    allMeta = [];
    for (const [etapaData, sessao] of Object.entries<any>(rawMeta)) {
      const decksMap = sessao.decks || {};
      for (const [jogadorNome, deckNome] of Object.entries<string>(decksMap)) {
        if (!deckNome) continue;
        allMeta.push({
          etapaData,
          sessionCode: sessao.sessionCode || null,
          jogadorNome,
          deckNome,
        });
      }
    }
  }

  if (!allDecks || allDecks.length === 0) {
    const rawDecks = readDataFile<any[]>("decks.json", []);
    allDecks = rawDecks.map((d, i) => ({
      id: i + 1,
      nome: d.deck || "",
      tipoEnergia: d.tipoEnergia || "colorless",
      imagem: d.imagem || null,
      limitless: d.limitless || null,
      icone: d.icone || null,
      ativo: true,
    }));
  }

  if (!allEtapas || allEtapas.length === 0) {
    allEtapas = readDataFile<any[]>("etapas.json", []);
  }

  return {
    metagameEntries: allMeta || [],
    decksInfo: allDecks || [],
    etapas: allEtapas || [],
    etapaResultados: allResults || [],
  };
}

export async function getCampeoes() {
  try {
    const res = await db.select().from(campeoes).orderBy(desc(campeoes.id));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const raw = readDataFile<any[]>("campeoes.json", []);
  return raw.map((c, i) => ({
    id: i + 1,
    temporada: c.Temporada || c.temporada || `Temporada #${4 - i}`,
    campeao: c.Campeao || c.campeao || c.nome || "Desconhecido",
    vice: c.Vice || c.vice || "Desconhecido",
    deckCampeao: c.DeckCampeao || c.deckCampeao || c.deck || "Desconhecido",
    data: c.Data || c.data || "",
    fotoCampeao: c.FotoCampeao || c.fotoCampeao || c.foto || null,
    urlDeck: c.URLDeck || c.urlDeck || null,
    imagemDeck: c.ImagemDeck || c.imagemDeck || null,
    observacaoDeck: c.ObservacaoDeck || c.observacaoDeck || null,
  }));
}

export async function getGaleria() {
  try {
    const res = await db.select().from(galeria).orderBy(desc(galeria.id));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const raw = readDataFile<any[]>("galeria.json", []);
  return raw.map((g, i) => ({
    id: i + 1,
    titulo: g.titulo || "Foto do Evento",
    descricao: g.descricao || null,
    urlImagem: g.urlImagem || "",
    data: g.data || null,
  }));
}

export async function getScoresAntigos() {
  try {
    const res = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.pos));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const raw = readDataFile<any[]>("scores_antigos.json", []);
  return raw.map((s, i) => ({
    id: i + 1,
    temporada: s.temporada || s.Temporada || "Temporada #1",
    dataFechamento: s.dataFechamento || s.DataFechamento || null,
    pos: Number(s.pos || s.Pos) || i + 1,
    jogador: s.jogador || s.Jogador || "",
    categoria: s.categoria || s.Categoria || "ME",
    pontos: String(s.pontos || s.Pontos || "0"),
    deck: s.deck || s.Deck || "",
  }));
}

export async function getCalendario() {
  try {
    const res = await db.select().from(calendario);
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  const raw = readDataFile<any[]>("calendario.json", []);
  return raw.map((cal, i) => ({
    id: i + 1,
    data: cal.data,
    evento: cal.evento || cal.titulo || "Torneio Semanal",
    local: cal.local || "Livraria Atlântica +",
    horario: cal.horario || "14:00",
    status: cal.status || "confirmado",
    descricao: cal.descricao || null,
    linkMaps: cal.linkMaps || cal.linkMapa || null,
    linkInscricao: cal.linkInscricao || null,
    foto: cal.foto || null,
  }));
}

export async function getNextEvent() {
  const events = await getCalendario();
  return events[0] || null;
}

export async function getSeasonAwards() {
  try {
    const ranking = await getRanking();
    const metaData = await getMetagameData();
    const metaEntries = metaData.metagameEntries;

    if (!ranking || ranking.length === 0) {
      return {
        gold: null,
        goldRanking: [],
        gym: null,
        gymRanking: [],
        ditto: null,
        dittoRanking: [],
        murcha: null,
        murchaRanking: [],
      };
    }

    // 1. POKÉBOLA DE OURO (Maior saldo V - D, mín 2 etapas)
    const goldCandidates = ranking
      .filter((r) => r.participacoes >= 2)
      .map((r) => {
        const total = r.vitorias + r.derrotas + r.empates;
        const winRate = total > 0 ? r.vitorias / total : 0;
        const saldo = r.vitorias - r.derrotas;
        return {
          player: r.jogadorNome,
          id: r.jogadorId,
          saldo,
          wins: r.vitorias,
          losses: r.derrotas,
          draws: r.empates,
          participations: r.participacoes,
          winRate: (winRate * 100).toFixed(1),
          podiums: r.podios,
          points: r.pontos,
        };
      })
      .sort((a, b) => {
        if (b.saldo !== a.saldo) return b.saldo - a.saldo;
        if (b.participations !== a.participations) return b.participations - a.participations;
        return Number(b.winRate) - Number(a.winRate);
      });

    // 2. LÍDER DE GINÁSIO (Maior assiduidade / participações)
    const gymCandidates = [...ranking]
      .map((r) => ({
        player: r.jogadorNome,
        id: r.jogadorId,
        participations: r.participacoes,
        points: r.pontos,
        wins: r.vitorias,
        podiums: r.podios,
      }))
      .sort((a, b) => {
        if (b.participations !== a.participations) return b.participations - a.participations;
        return b.points - a.points;
      });

    const gymLeader = gymCandidates[0] || null;

    const allDecks = await getAllDecks();

    function formatDeckName(name: string): string {
      if (!name) return "";
      const lowerWords = ["da", "de", "do", "das", "dos", "e", "com", "no", "na"];
      return name
        .split(" ")
        .map((word, idx) => {
          const w = word.trim();
          if (!w) return "";
          const lower = w.toLowerCase();
          if (lower === "ex") return "Ex";
          if (lower === "gx") return "GX";
          if (lower === "vmax") return "VMAX";
          if (lower === "vstar") return "VSTAR";
          if (lower === "v") return "V";
          if (lowerWords.includes(lower) && idx > 0) return lower;
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ")
        .replace(/\s*\+\s*/g, " + ");
    }

    // 3. DITTO PLAYER (Maior número de decks diferentes jogados no metagame)
    const playerDecksMap: Record<string, Set<string>> = {};
    for (const entry of metaEntries) {
      const pName = entry.jogadorNome?.trim();
      const dName = entry.deckNome?.trim();
      if (!pName || !dName || dName.toLowerCase() === "outros") continue;

      if (!playerDecksMap[pName]) playerDecksMap[pName] = new Set();
      playerDecksMap[pName].add(dName.toLowerCase());
    }

    const dittoCandidates = Object.entries(playerDecksMap)
      .map(([pName, deckSet]) => {
        const r = ranking.find((rk) => rk.jogadorNome.toLowerCase() === pName.toLowerCase());
        const formattedDecks = Array.from(deckSet).map((rawD) => {
          const found = allDecks.find(
            (d) => d.nome.toLowerCase() === rawD.toLowerCase()
          );
          return {
            nome: found ? formatDeckName(found.nome) : formatDeckName(rawD),
            tipoEnergia: found?.tipoEnergia || "colorless",
          };
        });

        return {
          player: pName,
          count: deckSet.size,
          decks: formattedDecks,
          participations: r?.participacoes || 1,
          mediaColocacao: r?.mediaColocacao || 99,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.mediaColocacao - b.mediaColocacao;
      });

    // 4. POKÉBOLA MURCHA (Maior déficit D - V, mín 2 etapas)
    let murchaCandidates = ranking
      .filter((r) => r.participacoes >= 2 && r.derrotas > r.vitorias)
      .map((r) => {
        const deficit = r.derrotas - r.vitorias;
        return {
          player: r.jogadorNome,
          id: r.jogadorId,
          deficit,
          wins: r.vitorias,
          losses: r.derrotas,
          participations: r.participacoes,
        };
      })
      .sort((a, b) => {
        if (b.deficit !== a.deficit) return b.deficit - a.deficit;
        return b.participations - a.participations;
      });

    if (murchaCandidates.length === 0) {
      murchaCandidates = ranking
        .filter((r) => r.participacoes >= 2)
        .map((r) => ({
          player: r.jogadorNome,
          id: r.jogadorId,
          deficit: r.derrotas - r.vitorias,
          wins: r.vitorias,
          losses: r.derrotas,
          participations: r.participacoes,
        }))
        .sort((a, b) => b.deficit - a.deficit);
    }

    return {
      gold: goldCandidates[0] || null,
      goldRanking: goldCandidates,
      gym: gymLeader,
      gymRanking: gymCandidates,
      ditto: dittoCandidates[0] || null,
      dittoRanking: dittoCandidates,
      murcha: murchaCandidates[0] || null,
      murchaRanking: murchaCandidates,
    };
  } catch (err) {
    console.error("Erro em getSeasonAwards:", err);
    return {
      gold: null,
      goldRanking: [],
      gym: null,
      gymRanking: [],
      ditto: null,
      dittoRanking: [],
      murcha: null,
      murchaRanking: [],
    };
  }
}

export async function getAllJogadores() {
  try {
    const res = await db.select().from(jogadores).where(eq(jogadores.ativo, true)).orderBy(asc(jogadores.nome));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("jogadores.json", []);
}

export async function getSubmittedDecklists() {
  try {
    return await db.select().from(jogadorDecklists).orderBy(desc(jogadorDecklists.createdAt));
  } catch (err) {
    return [];
  }
}

export async function getConfigMap(): Promise<Record<string, any>> {
  try {
    const rows = await db.select().from(configuracoes);
    if (rows && rows.length > 0) {
      const map: Record<string, any> = {};
      for (const r of rows) {
        try {
          map[r.chave] = JSON.parse(r.valor);
        } catch {
          map[r.chave] = r.valor;
        }
      }
      return map;
    }
  } catch (err) {
    // Silencioso
  }

  return readDataFile<Record<string, any>>("config.json", {});
}
