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
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import fs from "fs";
import path from "path";

// Cache em memória baseado em timestamp de modificação (mtime) para máxima velocidade
const fileCache = new Map<string, { mtime: number; data: any }>();

export function clearFileCache() {
  fileCache.clear();
}

// Helper para ler arquivos de dados locais com segurança e cache de alta performance
function readDataFile<T = any>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(process.cwd(), "src", "data", filename);
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const cached = fileCache.get(filePath);
      if (cached && cached.mtime === stat.mtimeMs) {
        return cached.data as T;
      }
      const content = fs.readFileSync(filePath, "utf-8");
      let parsed: any = content;
      if (filename.endsWith(".json")) {
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = defaultValue;
        }
      }
      fileCache.set(filePath, { mtime: stat.mtimeMs, data: parsed });
      return parsed as T;
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
  rawEtapas.sort((a, b) => a.data.localeCompare(b.data)); // Ordem cronológica rigorosa
  const metaMap = getMetagameMap();
  const etapasDir = path.join(process.cwd(), "src", "data", "etapas");

  const mapped = rawEtapas.map((etapa, idx) => {
    const tdfName = `${etapa.data}.tdf`;
    const tdfPath = path.join(etapasDir, tdfName);
    let stageResults: any[] = [];
    let campeaoNome = etapa.campeao || null;
    let campeaoDeck = etapa.deckCampeao || null;

    const tdfContent = readDataFile<string>(path.join("etapas", tdfName), "");
    if (tdfContent) {
      try {
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
      numeroEtapa: idx + 1,
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

  return mapped.sort((a, b) => b.data.localeCompare(a.data));
}

export async function getRanking(categoria?: string) {
  await ensureDatabaseSchema();
  const fallback = getFallbackRanking();
  const latestDecks = getLatestDecksMap();
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
    if (res && res.length > 0) {
      const enriched = res.map((p) => {
        const resolvedDeck =
          p.ultimoDeck && p.ultimoDeck !== "Não registrado" && p.ultimoDeck !== "Sem deck registrado"
            ? p.ultimoDeck
            : latestDecks[p.jogadorNome.toLowerCase().trim()] || null;
        return {
          ...p,
          ultimoDeck: resolvedDeck,
        };
      });

      // Deduplicação defensiva do ranking por ID ou Nome
      const rankMap = new Map<string, any>();
      for (const p of enriched) {
        const rawId = String(p.jogadorId || "").trim();
        const rawName = String(p.jogadorNome || "").trim().toLowerCase();
        const key = rawId ? `id_${rawId}` : `name_${rawName}`;
        if (!rankMap.has(key)) {
          rankMap.set(key, p);
        }
      }
      return Array.from(rankMap.values());
    }
  } catch (err) {
    // Silencioso
  }

  if (categoria && categoria !== "TODOS") {
    return fallback.filter((r) => r.categoria?.toUpperCase() === categoria.toUpperCase());
  }
  return fallback;
}

export async function getTop4Podium() {
  await ensureDatabaseSchema();
  const latestDecks = getLatestDecksMap();
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
    if (res && res.length > 0) {
      return res.map((p) => {
        const resolvedDeck =
          p.ultimoDeck && p.ultimoDeck !== "Não registrado" && p.ultimoDeck !== "Sem deck registrado"
            ? p.ultimoDeck
            : latestDecks[p.jogadorNome.toLowerCase().trim()] || null;
        return {
          ...p,
          ultimoDeck: resolvedDeck,
        };
      });
    }
  } catch (err) {
    // Silencioso
  }

  const fallback = getFallbackRanking();
  return fallback.slice(0, 4);
}

export async function getAllDecks() {
  await ensureDatabaseSchema();
  let list: any[] = [];
  try {
    const res = await db.select().from(decks).where(eq(decks.ativo, true)).orderBy(asc(decks.nome));
    if (res && res.length > 0) list = res;
  } catch (err) {
    // Silencioso
  }

  if (list.length === 0) {
    const rawDecks = readDataFile<any[]>("decks.json", []);
    list = rawDecks.map((d, i) => ({
      id: i + 1,
      nome: d.deck || d.nome || "",
      tipoEnergia: d.tipoEnergia || "colorless",
      imagem: d.imagem || null,
      limitless: d.limitless || null,
      icone: d.icone || null,
      ativo: true,
    }));
  }

  const map = new Map<string, any>();
  for (const d of list) {
    const key = (d.nome || "").toLowerCase().trim();
    if (key && !map.has(key)) {
      map.set(key, d);
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getAllEtapas() {
  await ensureDatabaseSchema();
  try {
    const res = await db.select().from(etapas).orderBy(desc(etapas.data));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("etapas.json", []);
}

export async function getEtapasWithSummary() {
  await ensureDatabaseSchema();
  const fallback = getFallbackEtapas();
  const metaMap = getMetagameMap();

  try {
    const allEtapas = await db.select().from(etapas).orderBy(asc(etapas.data));
    const results = await db
      .select()
      .from(etapaResultados)
      .orderBy(asc(etapaResultados.colocacao));

    if (allEtapas && allEtapas.length > 0) {
      const fallbackMap = new Map<string, any>(fallback.map((f: any) => [f.data, f]));

      const mapped = allEtapas.map((etapa, idx) => {
        let etapaMatches = results.filter((r) => r.etapaData === etapa.data || r.etapaId === etapa.id);

        if (etapaMatches.length === 0 && fallbackMap.has(etapa.data)) {
          etapaMatches = fallbackMap.get(etapa.data).resultados || [];
        }

        const enrichedMatches = etapaMatches.map((m) => {
          let deck = m.deckNome;
          if (!deck || deck === "Sem deck" || deck === "Sem deck registrado" || deck === "Não registrado") {
            const fromMeta = metaMap[etapa.data]?.[(m.jogadorNome || "").toLowerCase().trim()];
            if (fromMeta) deck = fromMeta;
          }
          return {
            ...m,
            deckNome: deck || null,
          };
        });

        const campeao = enrichedMatches.find((r) => r.colocacao === 1);
        const top4 = enrichedMatches.filter((r) => r.colocacao <= 4);

        return {
          ...etapa,
          numeroEtapa: idx + 1,
          totalJogadores: enrichedMatches.length || (fallbackMap.get(etapa.data)?.totalJogadores || 0),
          campeaoNome: campeao?.jogadorNome || fallbackMap.get(etapa.data)?.campeaoNome || null,
          campeaoId: campeao?.jogadorId || null,
          campeaoDeck: campeao?.deckNome || fallbackMap.get(etapa.data)?.campeaoDeck || null,
          top4,
          resultados: enrichedMatches,
        };
      });

      return mapped.sort((a, b) => b.data.localeCompare(a.data));
    }
  } catch (err) {
    console.error("Erro ao buscar etapas resumidas:", err);
  }

  return fallback;
}

export async function getMetagameData() {
  await ensureDatabaseSchema();
  let allMeta: any[] = [];
  let allDecks: any[] = [];
  let allEtapas: any[] = [];
  let allResults: any[] = [];

  try {
    const [dbMeta, dbDecks, dbEtapas, dbResults] = await Promise.all([
      db.select().from(metagame).catch(() => []),
      db.select().from(decks).catch(() => []),
      db.select().from(etapas).orderBy(desc(etapas.data)).catch(() => []),
      db.select().from(etapaResultados).catch(() => []),
    ]);
    if (dbMeta && dbMeta.length > 0) allMeta = dbMeta;
    if (dbDecks && dbDecks.length > 0) allDecks = dbDecks;
    if (dbEtapas && dbEtapas.length > 0) allEtapas = dbEtapas;
    if (dbResults && dbResults.length > 0) allResults = dbResults;
  } catch (err) {
    // Silencioso
  }

  // Fallback Metagame Entries
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

  // Fallback Decks Info
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

  // Fallback Etapas
  if (!allEtapas || allEtapas.length === 0) {
    allEtapas = readDataFile<any[]>("etapas.json", []);
  }

  // Fallback Etapa Resultados (Lê dos 21 TDFs de etapas com correspondência de decks)
  if (!allResults || allResults.length === 0) {
    const fallbackEtapas = getFallbackEtapas();
    allResults = fallbackEtapas.flatMap((e) => e.resultados || []);
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
    const res = await db.select().from(campeoes);
    if (res && res.length > 0) {
      const map = new Map<string, any>();
      for (const c of res) {
        const key = (c.temporada || "").toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, c);
        }
      }
      return Array.from(map.values()).sort((a, b) => {
        return (b.temporada || "").localeCompare(a.temporada || "", undefined, { numeric: true });
      });
    }
  } catch (err) {
    // Silencioso
  }

  const raw = readDataFile<any[]>("campeoes.json", []);
  const map = new Map<string, any>();
  raw.forEach((c, i) => {
    const temp = c.Temporada || c.temporada || `Temporada #${4 - i}`;
    const key = temp.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        id: i + 1,
        temporada: temp,
        campeao: c.Campeao || c.campeao || c.nome || "Desconhecido",
        vice: c.Vice || c.vice || "Desconhecido",
        deckCampeao: c.DeckCampeao || c.deckCampeao || c.deck || "Desconhecido",
        data: c.Data || c.data || "",
        fotoCampeao: c.FotoCampeao || c.fotoCampeao || c.foto || null,
        urlDeck: c.URLDeck || c.urlDeck || null,
        imagemDeck: c.ImagemDeck || c.imagemDeck || null,
        observacaoDeck: c.ObservacaoDeck || c.observacaoDeck || null,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    return (b.temporada || "").localeCompare(a.temporada || "", undefined, { numeric: true });
  });
}

export async function getGaleria() {
  let list: any[] = [];
  try {
    const res = await db.select().from(galeria).orderBy(desc(galeria.id));
    if (res && res.length > 0) list = res;
  } catch (err) {
    // Silencioso
  }

  if (list.length === 0) {
    const raw = readDataFile<any[]>("galeria.json", []);
    list = raw.map((g, i) => ({
      id: i + 1,
      titulo: g.titulo || "Foto do Evento",
      descricao: g.descricao || null,
      urlImagem: g.urlImagem || "",
      data: g.data || null,
    }));
  }

  const map = new Map<string, any>();
  for (const g of list) {
    const key = (g.urlImagem || "").toLowerCase().trim();
    if (key && !map.has(key)) {
      map.set(key, g);
    }
  }
  return Array.from(map.values());
}

export async function getScoresAntigos() {
  let list: any[] = [];
  try {
    const res = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.pos));
    if (res && res.length > 0) {
      list = res;
    }
  } catch (err) {
    // Silencioso
  }

  if (list.length === 0) {
    const raw = readDataFile<any[]>("scores_antigos.json", []);
    list = raw.map((s, i) => ({
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

  const uniqueMap = new Map<string, any>();
  for (const s of list) {
    const key = `${(s.temporada || "").trim()}-${s.pos}-${(s.jogador || "").toLowerCase().trim()}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, s);
    }
  }
  return Array.from(uniqueMap.values());
}

function parseEventDateTime(dateStr: string, timeStr?: string | null): Date {
  let y = 2026, m = 1, d = 1;
  const clean = (dateStr || "").replace(/\//g, "-").trim();
  const parts = clean.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
  }
  let hr = 14, min = 0;
  if (timeStr) {
    const tParts = timeStr.trim().split(":");
    hr = parseInt(tParts[0] || "14", 10);
    min = parseInt(tParts[1] || "0", 10);
  }
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-03:00`;
  return new Date(iso);
}

export function getEventEndDateTime(dateStr: string, timeStr?: string | null): Date {
  const start = parseEventDateTime(dateStr, timeStr);
  // Torneio é considerado em andamento por até 4 horas após o horário oficial de início
  return new Date(start.getTime() + 4 * 60 * 60 * 1000);
}

export async function getCalendario() {
  let list: any[] = [];
  try {
    const res = await db.select().from(calendario);
    if (res && res.length > 0) {
      list = res;
    }
  } catch (err) {
    // Silencioso
  }

  if (list.length === 0) {
    const raw = readDataFile<any[]>("calendario.json", []);
    list = raw.map((cal, i) => ({
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

  // Deduplicação estrita para impedir eventos clonados na interface
  const uniqueMap = new Map<string, any>();
  for (const ev of list) {
    const cleanDate = (ev.data || "").replace(/\//g, "-").trim();
    const cleanName = (ev.evento || "").trim().toLowerCase();
    const key = `${cleanDate}_${cleanName}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, ev);
    } else {
      const isConcluded = String(ev.status || "").toLowerCase().includes("conclui");
      if (isConcluded) {
        uniqueMap.set(key, ev);
      }
    }
  }

  const deduplicated = Array.from(uniqueMap.values());

  return deduplicated.sort((a, b) => {
    return parseEventDateTime(a.data, a.horario).getTime() - parseEventDateTime(b.data, b.horario).getTime();
  });
}

export async function getNextEvent() {
  const events = await getCalendario();
  if (!events || events.length === 0) return null;

  const now = new Date();

  // 1. Procura eventos ativos cujo término ainda não ocorreu (início até início + 4h)
  const upcoming = events.filter((e) => {
    const st = (e.status || "").toLowerCase().trim();
    if (st === "concluido" || st === "cancelado") return false;
    const eventEnd = getEventEndDateTime(e.data, e.horario);
    return eventEnd.getTime() >= now.getTime();
  });

  if (upcoming.length > 0) {
    upcoming.sort((a, b) => {
      return parseEventDateTime(a.data, a.horario).getTime() - parseEventDateTime(b.data, b.horario).getTime();
    });
    return upcoming[0];
  }

  return null;
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
    // Normalização rigorosa por nome de jogador canônico para não separar por maiúsculas/minúsculas
    const canonicalPlayerNameMap = new Map<string, string>();
    ranking.forEach((r) => {
      canonicalPlayerNameMap.set(r.jogadorNome.toLowerCase().trim(), r.jogadorNome.trim());
      if (r.jogadorId) {
        canonicalPlayerNameMap.set(r.jogadorId.trim(), r.jogadorNome.trim());
      }
    });

    const playerDecksMap: Record<string, Set<string>> = {};
    for (const entry of metaEntries) {
      const rawName = entry.jogadorNome?.trim();
      const dName = entry.deckNome?.trim();
      if (!rawName || !dName || dName.toLowerCase() === "outros" || dName.toLowerCase() === "sem deck registrado" || dName.toLowerCase() === "não registrado") continue;

      const canonicalName = canonicalPlayerNameMap.get(rawName.toLowerCase()) || rawName;

      if (!playerDecksMap[canonicalName]) playerDecksMap[canonicalName] = new Set();
      playerDecksMap[canonicalName].add(dName.toLowerCase());
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

    // 4. POKÉBOLA MURCHA (Maior Déficit de Derrotas D - V com Alta Presença nas Etapas, mín 2 etapas)
    const murchaCandidates = ranking
      .filter((r) => r.participacoes >= 2 && r.derrotas > r.vitorias)
      .map((r) => {
        const totalPartidas = r.vitorias + r.derrotas + r.empates;
        const winRate = totalPartidas > 0 ? (r.vitorias / totalPartidas) * 100 : 0;
        const lossRate = totalPartidas > 0 ? (r.derrotas / totalPartidas) * 100 : 0;
        const mediaDerrotasEtapa = r.participacoes > 0 ? r.derrotas / r.participacoes : 0;
        const deficit = r.derrotas - r.vitorias;

        return {
          player: r.jogadorNome,
          id: r.jogadorId,
          deficit,
          wins: r.vitorias,
          draws: r.empates,
          losses: r.derrotas,
          participations: r.participacoes,
          totalPartidas,
          winRate: Number(winRate.toFixed(1)),
          lossRate: Number(lossRate.toFixed(1)),
          mediaDerrotas: Number(mediaDerrotasEtapa.toFixed(2)),
        };
      })
      .sort((a, b) => {
        // 1º Maior Déficit de Derrotas (D - V)
        if (b.deficit !== a.deficit) return b.deficit - a.deficit;
        // 2º Maior quantidade de Etapas disputadas (Presença e Resiliência contínua)
        if (b.participations !== a.participations) return b.participations - a.participations;
        // 3º Maior número total de derrotas
        if (b.losses !== a.losses) return b.losses - a.losses;
        return b.lossRate - a.lossRate;
      });

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
  let list: any[] = [];
  try {
    const res = await db.select().from(jogadores).where(eq(jogadores.ativo, true)).orderBy(asc(jogadores.nome));
    if (res && res.length > 0) list = res;
  } catch (err) {
    // Silencioso
  }

  if (list.length === 0) {
    const raw = readDataFile<any[]>("jogadores.json", []);
    list = raw.map((j) => ({
      id: String(j.id || j.ID || "").trim(),
      nome: String(j.nome || j.jogador || j.Jogador || "Desconhecido").trim(),
      categoria: j.categoria || j.Categoria || "Master",
      ativo: true,
      deckAtivoNome: j.deckAtivoNome || null,
      decklistTexto: j.decklistTexto || null,
    }));
  }

  const map = new Map<string, any>();
  for (const p of list) {
    const rawId = String(p.id || "").trim();
    const cleanName = String(p.nome || p.jogador || "").trim();
    const key = rawId ? `id_${rawId}` : `name_${cleanName.toLowerCase()}`;
    if (key && !map.has(key)) {
      map.set(key, { ...p, nome: cleanName || "Desconhecido" });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
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
    await ensureDatabaseSchema();
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
