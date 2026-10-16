/**
 * Parser Oficial de Arquivos TDF (Tournament Data File / TOM XML e TSV) da Liga Atlântica.
 * Contempla todas as regras de pontuação oficial, desempate OMW, identificação de categorias,
 * tratamento de Byes e detecção de Drops (DNF).
 */

export interface ParsedPlayerRow {
  colocacao: number;
  id: string;
  jogador: string;
  categoria: "Master" | "Senior" | "Junior";
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  omw?: number;
  isDnf?: boolean;
}

export interface ParsedTDFResult {
  nomeTorneio: string | null;
  dataTorneio: string | null;
  jogadores: ParsedPlayerRow[];
  detectedType?: string;
  detectedMultiplier?: number;
  detectedSubtitle?: string;
}

/**
 * Normaliza datas nos formatos ISO (AAAA-MM-DD), TOM (MM/DD/AAAA ou MM/DD/YYYY HH:MM:SS) ou BR (DD/MM/AAAA)
 */
export function parseTDFDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  // Limpar horário se presente (ex: "09/24/2026 18:49:40" -> "09/24/2026")
  const clean = dateStr.trim().split(" ")[0].trim();

  // 1. ISO AAAA-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. Formatos com barras ou hífens (MM/DD/AAAA ou DD/MM/AAAA)
  const parts = clean.split(/[/.-]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;

    // Se o 1º número > 12 -> DD/MM/AAAA
    if (p1 > 12 && p2 <= 12) {
      const day = String(p1).padStart(2, "0");
      const month = String(p2).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Se o 2º número > 12 -> MM/DD/AAAA (TOM default)
    if (p2 > 12 && p1 <= 12) {
      const month = String(p1).padStart(2, "0");
      const day = String(p2).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Ambíguo: no padrão TOM oficial, assume MM/DD/AAAA
    const month = String(p1).padStart(2, "0");
    const day = String(p2).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Faz o parse completo de um arquivo TDF (suporta XML nativo do TOM e TSV consolidado)
 */
export function parseTDFContent(rawContent: string, fileName?: string): ParsedTDFResult {
  if (!rawContent || !rawContent.trim()) {
    return { nomeTorneio: null, dataTorneio: null, jogadores: [] };
  }

  const cleanText = rawContent.replace(/^\ufeff/, "").trim();

  // 1. Detecção de XML oficial do TOM
  if (cleanText.startsWith("<?xml") || cleanText.includes("<tournament")) {
    return parseTOMXml(cleanText, fileName);
  }

  // 2. Fallback para TSV / CSV tabulado
  return parseTSV(cleanText, fileName);
}

function parseTOMXml(xmlText: string, fileName?: string): ParsedTDFResult {
  let tournamentName: string | null = null;
  let tournamentDate: string | null = null;

  // Extrair metadados com Regex
  const nameMatch = xmlText.match(/<name>(.*?)<\/name>/i);
  if (nameMatch) tournamentName = nameMatch[1].trim();

  // 1. Tentar <startdate>
  const dateMatch = xmlText.match(/<startdate>(.*?)<\/startdate>/i);
  if (dateMatch && dateMatch[1]?.trim()) {
    tournamentDate = parseTDFDate(dateMatch[1]);
  }

  // 2. Fallback: extrair das timestamps de rounds (<starttime> ou <pairtime>)
  if (!tournamentDate) {
    const roundTimeMatch = xmlText.match(/<(?:starttime|pairtime|creationdate)>(.*?)<\//i);
    if (roundTimeMatch && roundTimeMatch[1]?.trim()) {
      tournamentDate = parseTDFDate(roundTimeMatch[1]);
    }
  }

  // 3. Fallback: extrair do nome do arquivo
  if (!tournamentDate && fileName) {
    const fnDateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (fnDateMatch) {
      tournamentDate = fnDateMatch[1].replace(/_/g, "-");
    } else {
      // Formato DDMMYY (ex: S1T5 090726 ou 240926)
      const ddmmyyMatch = fileName.match(/(\d{2})(\d{2})(\d{2})/);
      if (ddmmyyMatch) {
        const d = ddmmyyMatch[1];
        const m = ddmmyyMatch[2];
        const y = `20${ddmmyyMatch[3]}`;
        tournamentDate = `${y}-${m}-${d}`;
      }
    }
  }

  // Detecção inteligente de tipo e multiplicador baseado no nome do torneio
  // Tipos oficiais: "Sessão de Liga", "League Challenge", "League Cup", "Sessão Especial"
  let detectedType = "Sessão de Liga";
  let detectedMultiplier = 1.0;
  let detectedSubtitle: string | undefined = undefined;

  if (tournamentName) {
    const upperName = tournamentName.toUpperCase();
    if (upperName.includes("TBT")) {
      detectedType = "Sessão Especial";
      detectedMultiplier = 0.5;
      detectedSubtitle = "Sessão TBT";
    } else if (upperName.includes("CHALLENGE") || upperName.includes("LEAGUE CHALLENGE")) {
      detectedType = "League Challenge";
      detectedMultiplier = 1.5;
    } else if (upperName.includes("CUP") || upperName.includes("LEAGUE CUP")) {
      detectedType = "League Cup";
      detectedMultiplier = 1.5;
    } else if (upperName.includes("OFFMETA") || upperName.includes("OFF-META")) {
      detectedType = "Sessão Especial";
      detectedMultiplier = 1.0;
      detectedSubtitle = "Off-Meta";
    } else if (upperName.includes("ESPECIAL") || upperName.includes("SESSAO ESPECIAL") || upperName.includes("WORLD") || upperName.includes("SPECIAL")) {
      detectedType = "Sessão Especial";
      detectedMultiplier = 1.5;
      detectedSubtitle = "Sessão Especial";
    } else {
      detectedType = "Sessão de Liga";
      detectedMultiplier = 1.0;
    }
  }

  // 1. Mapear jogadores cadastrados estritamente dentro do bloco <players>...</players>
  const playersMap = new Map<
    string,
    { name: string; birthdate: string; dropped: boolean; dropRound: number | null }
  >();
  const playersBlockMatch = xmlText.match(/<players>([\s\S]*?)<\/players>/i);
  if (playersBlockMatch) {
    const block = playersBlockMatch[1];
    const playerTagRegex = /<player\s+userid="([^"]+)"[^>]*>([\s\S]*?)<\/player>/gi;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = playerTagRegex.exec(block)) !== null) {
      const userid = pMatch[1].trim();
      const inner = pMatch[2];
      const firstname = inner.match(/<firstname>([\s\S]*?)<\/firstname>/i)?.[1]?.trim() || "";
      const lastname = inner.match(/<lastname>([\s\S]*?)<\/lastname>/i)?.[1]?.trim() || "";
      const birthdate = inner.match(/<birthdate>([\s\S]*?)<\/birthdate>/i)?.[1]?.trim() || "";
      const droppedMatch = inner.match(/<dropped>[\s\S]*?<round>(\d+)<\/round>/i);
      const dropRound = droppedMatch ? parseInt(droppedMatch[1], 10) : null;
      const dropped = Boolean(droppedMatch || inner.includes("<dropped>") || inner.includes('drop="true"'));
      const fullName = `${firstname} ${lastname}`.trim() || `Jogador ${userid}`;
      playersMap.set(userid, { name: fullName, birthdate, dropped, dropRound });
    }
  }

  // 2. Extrair rodadas e partidas preservando o número da rodada
  interface RoundMatch {
    outcome: number;
    p1?: string;
    p2?: string;
    singleP?: string;
  }
  const roundMatches: { roundNum: number; matches: RoundMatch[] }[] = [];
  const roundRegex = /<round\s+number="(\d+)"[^>]*>([\s\S]*?)<\/round>/gi;
  let rMatch: RegExpExecArray | null;
  while ((rMatch = roundRegex.exec(xmlText)) !== null) {
    const roundNum = parseInt(rMatch[1], 10);
    const mRegex = /<match\s+outcome="(\d+)"[^>]*>([\s\S]*?)<\/match>/gi;
    let m: RegExpExecArray | null;
    const matches: RoundMatch[] = [];
    while ((m = mRegex.exec(rMatch[2])) !== null) {
      const outcome = parseInt(m[1], 10);
      const matchContent = m[2];
      const p1 = matchContent.match(/<player1\s+userid="([^"]+)"/i)?.[1]?.trim();
      const p2 = matchContent.match(/<player2\s+userid="([^"]+)"/i)?.[1]?.trim();
      const singleP = matchContent.match(/<player\s+userid="([^"]+)"/i)?.[1]?.trim();
      matches.push({ outcome, p1, p2, singleP });
    }
    roundMatches.push({ roundNum, matches });
  }

  // Fallback caso não haja tags <round> delimitadas
  if (roundMatches.length === 0) {
    const mRegex = /<match\s+outcome="(\d+)"[^>]*>([\s\S]*?)<\/match>/gi;
    let m: RegExpExecArray | null;
    const matches: RoundMatch[] = [];
    while ((m = mRegex.exec(xmlText)) !== null) {
      const outcome = parseInt(m[1], 10);
      const matchContent = m[2];
      const p1 = matchContent.match(/<player1\s+userid="([^"]+)"/i)?.[1]?.trim();
      const p2 = matchContent.match(/<player2\s+userid="([^"]+)"/i)?.[1]?.trim();
      const singleP = matchContent.match(/<player\s+userid="([^"]+)"/i)?.[1]?.trim();
      matches.push({ outcome, p1, p2, singleP });
    }
    roundMatches.push({ roundNum: 1, matches });
  }

  // Helper para calcular cartel e MWP até uma determinada rodada
  function getPlayerStatsUpToRound(userId: string, maxRound?: number) {
    let v = 0, e = 0, d = 0, byes = 0, roundsPlayed = 0;
    const opps: string[] = [];

    for (const r of roundMatches) {
      if (maxRound !== undefined && r.roundNum > maxRound) break;
      for (const m of r.matches) {
        if (m.p1 === userId && m.p2) {
          roundsPlayed++;
          opps.push(m.p2);
          if (m.outcome === 1) v++;
          else if (m.outcome === 2) d++;
          else if (m.outcome === 3) e++;
        } else if (m.p2 === userId && m.p1) {
          roundsPlayed++;
          opps.push(m.p1);
          if (m.outcome === 2) v++;
          else if (m.outcome === 1) d++;
          else if (m.outcome === 3) e++;
        } else if (m.singleP === userId) {
          roundsPlayed++;
          if (m.outcome === 5 || m.outcome === 1) {
            v++;
            byes++;
          } else {
            d++;
          }
        }
      }
    }

    const realRounds = roundsPlayed - byes;
    const realWins = v - byes;
    const rawRate = realRounds > 0 ? (realWins * 1.0 + e * 0.5) / realRounds : 0.25;
    const mwp = Math.max(0.25, rawRate);

    return { v, e, d, byes, roundsPlayed, opps, mwp, pontos: v * 3 + e * 1 };
  }

  // 3. Estatísticas completas de todos os atletas
  const fullStats = new Map<string, ReturnType<typeof getPlayerStatsUpToRound>>();
  playersMap.forEach((_, id) => {
    fullStats.set(id, getPlayerStatsUpToRound(id));
  });

  // 4. Cálculo oficial de OMW% (Play! Pokémon / TOM)
  const omwMap = new Map<string, number>();
  playersMap.forEach((p, id) => {
    const st = fullStats.get(id);
    if (!st || st.opps.length === 0) {
      omwMap.set(id, 0.25);
      return;
    }
    let sum = 0;
    st.opps.forEach((oppId) => {
      if (p.dropped && p.dropRound) {
        const oppAtDrop = getPlayerStatsUpToRound(oppId, p.dropRound);
        sum += oppAtDrop.mwp;
      } else {
        sum += fullStats.get(oppId)?.mwp ?? 0.25;
      }
    });
    omwMap.set(id, sum / st.opps.length);
  });

  // 5. Cálculo oficial de OOMW% (Play! Pokémon / TOM)
  const oomwMap = new Map<string, number>();
  playersMap.forEach((_, id) => {
    const st = fullStats.get(id);
    if (!st || st.opps.length === 0) {
      oomwMap.set(id, 0.25);
      return;
    }
    let sum = 0;
    st.opps.forEach((oppId) => {
      sum += omwMap.get(oppId) ?? 0.25;
    });
    oomwMap.set(id, sum / st.opps.length);
  });

  // 6. Mapear categoria a partir dos pods de standings
  const categoryMap = new Map<string, "Master" | "Senior" | "Junior">();
  const standingsBlock = xmlText.match(/<standings>([\s\S]*?)<\/standings>/i)?.[1] || "";
  if (standingsBlock) {
    const podRegex = /<pod\s+category="([^"]+)"(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/pod>/gi;
    let podMatch: RegExpExecArray | null;
    while ((podMatch = podRegex.exec(standingsBlock)) !== null) {
      const catCode = podMatch[1];
      const podContent = podMatch[3];
      let cat: "Master" | "Senior" | "Junior" = "Master";
      if (catCode === "10" || catCode === "2") cat = "Master";
      else if (catCode === "11" || catCode === "1") cat = "Senior";
      else if (catCode === "12" || catCode === "0") cat = "Junior";

      const pInPodRegex = /<player\s+id="([^"]+)"/gi;
      let pipMatch: RegExpExecArray | null;
      while ((pipMatch = pInPodRegex.exec(podContent)) !== null) {
        categoryMap.set(pipMatch[1].trim(), cat);
      }
    }
  }

  // 7. Montar classificação geral oficial (idêntica à tabela impressa do TOM / Standings Todas)
  const playersResult: ParsedPlayerRow[] = [];

  playersMap.forEach((p, id) => {
    const st = fullStats.get(id) || { v: 0, e: 0, d: 0, byes: 0, roundsPlayed: 0, opps: [], mwp: 0.25, pontos: 0 };
    const omw = omwMap.get(id) ?? 0.25;
    const cat = categoryMap.get(id) || "Master";

    playersResult.push({
      colocacao: 1,
      id,
      jogador: p.name,
      categoria: cat,
      pontos: st.pontos,
      vitorias: st.v,
      empates: st.e,
      derrotas: st.d,
      omw,
      isDnf: Boolean(p.dropped),
    });
  });

  // Ordenação Geral Suíço Oficial TOM: Pontos DESC -> OMW% DESC -> OOMW% DESC -> Nome ASC
  playersResult.sort((a, b) => {
    if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
    const omwA = a.omw ?? 0.25;
    const omwB = b.omw ?? 0.25;
    if (Math.abs(omwB - omwA) > 1e-9) return omwB - omwA;
    const oomwA = oomwMap.get(a.id || "") ?? 0.25;
    const oomwB = oomwMap.get(b.id || "") ?? 0.25;
    if (oomwB !== oomwA) return oomwB - oomwA;
    return String(a.jogador || "").localeCompare(String(b.jogador || ""), "pt-BR");
  });

  // Atribuir colocações contínuas de 1º a N
  playersResult.forEach((p, idx) => {
    p.colocacao = idx + 1;
  });

  return {
    nomeTorneio: tournamentName,
    dataTorneio: tournamentDate,
    jogadores: playersResult,
    detectedType,
    detectedMultiplier,
    detectedSubtitle,
  };
}

function parseTSV(tsvText: string, fileName?: string): ParsedTDFResult {
  const lines = tsvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { nomeTorneio: null, dataTorneio: null, jogadores: [] };

  let dataTorneio: string | null = null;
  if (fileName) {
    const fnDateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (fnDateMatch) dataTorneio = fnDateMatch[1].replace(/_/g, "-");
  }

  const rows = lines.slice(1);
  const jogadores: ParsedPlayerRow[] = [];

  for (const row of rows) {
    const cols = row.split("\t");
    if (cols.length < 5) continue;
    const [pos, id, jogador, categoria, pontos, vitorias, empates, derrotas] = cols;
    const cleanPlayerName = (jogador || "").trim();
    if (!cleanPlayerName) continue;

    let cat: "Master" | "Senior" | "Junior" = "Master";
    const catStr = (categoria || "").trim().toUpperCase();
    if (catStr === "SENIOR") cat = "Senior";
    else if (catStr === "JUNIOR") cat = "Junior";

    jogadores.push({
      colocacao: Number(pos) || 99,
      id: id ? id.trim() : "",
      jogador: cleanPlayerName,
      categoria: cat,
      pontos: Number(pontos) || 0,
      vitorias: Number(vitorias) || 0,
      empates: Number(empates) || 0,
      derrotas: Number(derrotas) || 0,
    });
  }

  return {
    nomeTorneio: null,
    dataTorneio,
    jogadores,
  };
}
