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

    return await query;
  } catch (err) {
    console.error("Erro em getRanking:", err);
    return [];
  }
}

export async function getTop4Podium() {
  try {
    return await db
      .select()
      .from(rankingConsolidado)
      .orderBy(
        desc(rankingConsolidado.pontos),
        desc(rankingConsolidado.podios),
        asc(rankingConsolidado.mediaColocacao),
        asc(rankingConsolidado.jogadorNome)
      )
      .limit(4);
  } catch (err) {
    console.error("Erro em getTop4Podium:", err);
    return [];
  }
}

export async function getAllDecks() {
  try {
    return await db.select().from(decks).where(eq(decks.ativo, true)).orderBy(asc(decks.nome));
  } catch (err) {
    console.error("Erro em getAllDecks:", err);
    return [];
  }
}

export async function getAllEtapas() {
  try {
    return await db.select().from(etapas).orderBy(desc(etapas.data));
  } catch (err) {
    console.error("Erro em getAllEtapas:", err);
    return [];
  }
}

export async function getEtapasWithSummary() {
  try {
    const allEtapas = await db.select().from(etapas).orderBy(desc(etapas.data));
    const results = await db
      .select()
      .from(etapaResultados)
      .orderBy(asc(etapaResultados.colocacao));

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
  } catch (err) {
    console.error("Erro em getEtapasWithSummary:", err);
    return [];
  }
}

export async function getMetagameData() {
  try {
    const [allMeta, allDecks, allEtapas, allResults] = await Promise.all([
      db.select().from(metagame).catch(() => []),
      db.select().from(decks).catch(() => []),
      db.select().from(etapas).orderBy(desc(etapas.data)).catch(() => []),
      db.select().from(etapaResultados).catch(() => []),
    ]);

    return {
      metagameEntries: allMeta || [],
      decksInfo: allDecks || [],
      etapas: allEtapas || [],
      etapaResultados: allResults || [],
    };
  } catch (err) {
    console.error("Erro em getMetagameData:", err);
    return {
      metagameEntries: [],
      decksInfo: [],
      etapas: [],
      etapaResultados: [],
    };
  }
}

export async function getCampeoes() {
  try {
    return await db.select().from(campeoes).orderBy(desc(campeoes.id));
  } catch (err) {
    console.error("Erro em getCampeoes:", err);
    return [];
  }
}

export async function getGaleria() {
  try {
    return await db.select().from(galeria).orderBy(desc(galeria.id));
  } catch (err) {
    console.error("Erro em getGaleria:", err);
    return [];
  }
}

export async function getScoresAntigos() {
  try {
    return await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.pos));
  } catch (err) {
    console.error("Erro em getScoresAntigos:", err);
    return [];
  }
}

export async function getCalendario() {
  try {
    return await db.select().from(calendario);
  } catch (err) {
    console.error("Erro em getCalendario:", err);
    return [];
  }
}

export async function getNextEvent() {
  try {
    const events = await db.select().from(calendario);
    return events[0] || null;
  } catch (err) {
    console.error("Erro em getNextEvent:", err);
    return null;
  }
}

export async function getSeasonAwards() {
  try {
    const ranking = await db.select().from(rankingConsolidado);
    const metaEntries = await db.select().from(metagame);

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

    const allDecks = await db.select().from(decks);

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
    return await db.select().from(jogadores).where(eq(jogadores.ativo, true)).orderBy(asc(jogadores.nome));
  } catch (err) {
    console.error("Erro em getAllJogadores:", err);
    return [];
  }
}

export async function getSubmittedDecklists() {
  try {
    return await db.select().from(jogadorDecklists).orderBy(desc(jogadorDecklists.createdAt));
  } catch (err) {
    console.error("Erro em getSubmittedDecklists:", err);
    return [];
  }
}

export async function getConfigMap(): Promise<Record<string, any>> {
  try {
    const rows = await db.select().from(configuracoes);
    const map: Record<string, any> = {};
    for (const r of rows) {
      try {
        map[r.chave] = JSON.parse(r.valor);
      } catch {
        map[r.chave] = r.valor;
      }
    }
    return map;
  } catch (err) {
    console.error("Erro em getConfigMap:", err);
    return {};
  }
}
