export interface BracketPlayer {
  id: string;
  nome: string;
  categoria: string;
  seed: number;
  deckNome?: string | null;
  deckEnergia?: string | null;
}

export interface BracketMatch {
  id: string;
  phase: "oitavas" | "quartas" | "semifinal" | "final";
  phaseName: string;
  matchIndex: number;
  mesa?: number;
  player1?: BracketPlayer | null;
  player2?: BracketPlayer | null;
  score1: number;
  score2: number;
  winnerId?: string | null;
  nextMatchId?: string;
  nextMatchSlot?: "player1" | "player2";
}

export interface CategoryBracket {
  categoria: "MASTER" | "SENIOR_JUNIOR";
  titulo: string;
  subtitulo: string;
  totalSeeds: number; // 16 para Master, 8 para Senior/Junior
  status: "aguardando" | "em_andamento" | "concluido";
  campeao?: BracketPlayer | null;
  viceCampeao?: BracketPlayer | null;
  matches: BracketMatch[];
  updatedAt?: string;
}

export interface SeasonFinalBrackets {
  temporada: number;
  tituloEvento: string;
  dataEvento: string;
  localEvento: string;
  statusGeral: "aguardando" | "em_andamento" | "concluido";
  master: CategoryBracket;
  seniorJunior: CategoryBracket;
  updatedAt?: string;
}

/**
 * Gera a árvore vazia de Top 16 para a categoria Master
 */
export function generateEmptyMasterTop16(players: BracketPlayer[] = []): CategoryBracket {
  const seedsMap = new Map<number, BracketPlayer>();
  players.slice(0, 16).forEach((p, idx) => {
    seedsMap.set(idx + 1, { ...p, seed: idx + 1 });
  });

  const matches: BracketMatch[] = [
    // Oitavas (8 partidas)
    {
      id: "m_oit_1",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 1,
      mesa: 1,
      player1: seedsMap.get(1) || null,
      player2: seedsMap.get(16) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_1",
      nextMatchSlot: "player1",
    },
    {
      id: "m_oit_2",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 2,
      mesa: 2,
      player1: seedsMap.get(8) || null,
      player2: seedsMap.get(9) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_1",
      nextMatchSlot: "player2",
    },
    {
      id: "m_oit_3",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 3,
      mesa: 3,
      player1: seedsMap.get(4) || null,
      player2: seedsMap.get(13) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_2",
      nextMatchSlot: "player1",
    },
    {
      id: "m_oit_4",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 4,
      mesa: 4,
      player1: seedsMap.get(5) || null,
      player2: seedsMap.get(12) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_2",
      nextMatchSlot: "player2",
    },
    {
      id: "m_oit_5",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 5,
      mesa: 5,
      player1: seedsMap.get(2) || null,
      player2: seedsMap.get(15) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_3",
      nextMatchSlot: "player1",
    },
    {
      id: "m_oit_6",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 6,
      mesa: 6,
      player1: seedsMap.get(7) || null,
      player2: seedsMap.get(10) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_3",
      nextMatchSlot: "player2",
    },
    {
      id: "m_oit_7",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 7,
      mesa: 7,
      player1: seedsMap.get(3) || null,
      player2: seedsMap.get(14) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_4",
      nextMatchSlot: "player1",
    },
    {
      id: "m_oit_8",
      phase: "oitavas",
      phaseName: "Oitavas de Final",
      matchIndex: 8,
      mesa: 8,
      player1: seedsMap.get(6) || null,
      player2: seedsMap.get(11) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_qua_4",
      nextMatchSlot: "player2",
    },

    // Quartas (4 partidas)
    {
      id: "m_qua_1",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 9,
      mesa: 1,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_sem_1",
      nextMatchSlot: "player1",
    },
    {
      id: "m_qua_2",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 10,
      mesa: 2,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_sem_1",
      nextMatchSlot: "player2",
    },
    {
      id: "m_qua_3",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 11,
      mesa: 3,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_sem_2",
      nextMatchSlot: "player1",
    },
    {
      id: "m_qua_4",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 12,
      mesa: 4,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_sem_2",
      nextMatchSlot: "player2",
    },

    // Semifinais (2 partidas)
    {
      id: "m_sem_1",
      phase: "semifinal",
      phaseName: "Semifinal",
      matchIndex: 13,
      mesa: 1,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_fin_1",
      nextMatchSlot: "player1",
    },
    {
      id: "m_sem_2",
      phase: "semifinal",
      phaseName: "Semifinal",
      matchIndex: 14,
      mesa: 2,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "m_fin_1",
      nextMatchSlot: "player2",
    },

    // Grande Final (1 partida)
    {
      id: "m_fin_1",
      phase: "final",
      phaseName: "Grande Final",
      matchIndex: 15,
      mesa: 1,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
    },
  ];

  return {
    categoria: "MASTER",
    titulo: "Divisão Master",
    subtitulo: "Top 16 • Finais da Temporada",
    totalSeeds: 16,
    status: players.length > 0 ? "em_andamento" : "aguardando",
    matches,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gera a árvore vazia de Top 8 para a categoria Senior + Junior
 */
export function generateEmptySeniorJuniorTop8(players: BracketPlayer[] = []): CategoryBracket {
  const seedsMap = new Map<number, BracketPlayer>();
  players.slice(0, 8).forEach((p, idx) => {
    seedsMap.set(idx + 1, { ...p, seed: idx + 1 });
  });

  const matches: BracketMatch[] = [
    // Quartas (4 partidas)
    {
      id: "sj_qua_1",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 1,
      mesa: 9,
      player1: seedsMap.get(1) || null,
      player2: seedsMap.get(8) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_sem_1",
      nextMatchSlot: "player1",
    },
    {
      id: "sj_qua_2",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 2,
      mesa: 10,
      player1: seedsMap.get(4) || null,
      player2: seedsMap.get(5) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_sem_1",
      nextMatchSlot: "player2",
    },
    {
      id: "sj_qua_3",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 3,
      mesa: 11,
      player1: seedsMap.get(2) || null,
      player2: seedsMap.get(7) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_sem_2",
      nextMatchSlot: "player1",
    },
    {
      id: "sj_qua_4",
      phase: "quartas",
      phaseName: "Quartas de Final",
      matchIndex: 4,
      mesa: 12,
      player1: seedsMap.get(3) || null,
      player2: seedsMap.get(6) || null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_sem_2",
      nextMatchSlot: "player2",
    },

    // Semifinais (2 partidas)
    {
      id: "sj_sem_1",
      phase: "semifinal",
      phaseName: "Semifinal",
      matchIndex: 5,
      mesa: 9,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_fin_1",
      nextMatchSlot: "player1",
    },
    {
      id: "sj_sem_2",
      phase: "semifinal",
      phaseName: "Semifinal",
      matchIndex: 6,
      mesa: 10,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      nextMatchId: "sj_fin_1",
      nextMatchSlot: "player2",
    },

    // Grande Final (1 partida)
    {
      id: "sj_fin_1",
      phase: "final",
      phaseName: "Grande Final",
      matchIndex: 7,
      mesa: 9,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
    },
  ];

  return {
    categoria: "SENIOR_JUNIOR",
    titulo: "Divisão Senior + Junior",
    subtitulo: "Top 8 • Finais da Temporada",
    totalSeeds: 8,
    status: players.length > 0 ? "em_andamento" : "aguardando",
    matches,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Propaga vencedores no chaveamento
 */
export function updateBracketMatchWinner(
  bracket: CategoryBracket,
  matchId: string,
  winnerId: string | null,
  score1: number = 0,
  score2: number = 0
): CategoryBracket {
  const updatedMatches = bracket.matches.map((m) => ({ ...m }));
  const match = updatedMatches.find((m) => m.id === matchId);
  if (!match) return bracket;

  match.score1 = score1;
  match.score2 = score2;
  match.winnerId = winnerId;

  const winnerPlayer =
    winnerId === match.player1?.id
      ? match.player1
      : winnerId === match.player2?.id
      ? match.player2
      : null;

  // Se houver próxima partida, avança o vencedor
  if (match.nextMatchId && match.nextMatchSlot) {
    const nextMatch = updatedMatches.find((m) => m.id === match.nextMatchId);
    if (nextMatch) {
      if (match.nextMatchSlot === "player1") {
        nextMatch.player1 = winnerPlayer;
      } else {
        nextMatch.player2 = winnerPlayer;
      }
      // Se alterou para null, desfaz avanços posteriores recursivamente
      if (!winnerPlayer && nextMatch.winnerId) {
        nextMatch.winnerId = null;
        nextMatch.score1 = 0;
        nextMatch.score2 = 0;
      }
    }
  }

  // Se for a Grande Final e tiver vencedor, define o Campeão e o Vice
  let campeao: BracketPlayer | null = bracket.campeao || null;
  let viceCampeao: BracketPlayer | null = bracket.viceCampeao || null;

  if (match.phase === "final") {
    if (winnerPlayer) {
      campeao = winnerPlayer;
      viceCampeao =
        winnerPlayer.id === match.player1?.id
          ? match.player2 || null
          : match.player1 || null;
    } else {
      campeao = null;
      viceCampeao = null;
    }
  }

  const isCompleted = Boolean(campeao);

  return {
    ...bracket,
    status: isCompleted ? "concluido" : "em_andamento",
    campeao,
    viceCampeao,
    matches: updatedMatches,
    updatedAt: new Date().toISOString(),
  };
}
