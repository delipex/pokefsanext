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

// Helper para ler arquivos JSON / TDF de fallback local de forma segura
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
    console.error(`Erro ao ler arquivo de fallback ${filename}:`, err);
  }
  return defaultValue;
}

// Fallback ranking parser para ranking.tdf
function getFallbackRanking(): any[] {
  const content = readDataFile<string>("ranking.tdf", "");
  if (!content) return [];
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

    return {
      temporada: 5,
      jogadorId: id ? id.trim() : "",
      jogadorNome: jogador ? jogador.trim() : "",
      categoria: categoria ? categoria.trim() : "Master",
      pontos: Number(pontos) || 0,
      vitorias: Number(vitorias) || 0,
      empates: Number(empates) || 0,
      derrotas: Number(derrotas) || 0,
      podios: Number(podios) || 0,
      mediaColocacao: Number(mediaColocacao) || 0,
      participacoes: Number(participacoes) || 0,
      historicoColocacoes: historicoColocacoes ? historicoColocacoes.trim() : "",
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
    // Silencioso: prossegue para fallback
  }

  // Fallback
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

    if (allEtapas && allEtapas.length > 0) {
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

  const rawEtapas = readDataFile<any[]>("etapas.json", []);
  return rawEtapas.map((etapa) => ({
    ...etapa,
    totalJogadores: etapa.totalJogadores || 0,
    campeaoNome: etapa.campeao || null,
    campeaoId: null,
    campeaoDeck: etapa.deckCampeao || null,
    top4: [],
    resultados: [],
  }));
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

  return readDataFile<any[]>("campeoes.json", []);
}

export async function getGaleria() {
  try {
    const res = await db.select().from(galeria).orderBy(desc(galeria.id));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("galeria.json", []);
}

export async function getScoresAntigos() {
  try {
    const res = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.pos));
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("scores_antigos.json", []);
}

export async function getCalendario() {
  try {
    const res = await db.select().from(calendario);
    if (res && res.length > 0) return res;
  } catch (err) {
    // Silencioso
  }

  return readDataFile<any[]>("calendario.json", []);
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
      return { gold: null, gym: null, ditto: null, murcha: null };
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
    const gymLeader = [...ranking].sort((a, b) => {
      if (b.participacoes !== a.participacoes) return b.participacoes - a.participacoes;
      return b.pontos - a.pontos;
    })[0];

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
      gym: gymLeader
        ? {
            player: gymLeader.jogadorNome,
            id: gymLeader.jogadorId,
            participations: gymLeader.participacoes,
            points: gymLeader.pontos,
          }
        : null,
      ditto: dittoCandidates[0] || null,
      murcha: murchaCandidates[0] || null,
    };
  } catch (err) {
    console.error("Erro em getSeasonAwards:", err);
    return { gold: null, gym: null, ditto: null, murcha: null };
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
