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
  const playersMap = new Map<string, { name: string; birthdate: string; dropped?: boolean }>();
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
      const dropped = inner.includes("<dropped>") || inner.includes('drop="true"');
      const fullName = `${firstname} ${lastname}`.trim() || `Jogador ${userid}`;
      playersMap.set(userid, { name: fullName, birthdate, dropped });
    }
  }

  // 2. Estatísticas de partidas (V, E, D), Byes e oponentes
  const statsMap = new Map<string, { v: number; e: number; d: number; byes: number; realMatches: number }>();
  const opponentsMap = new Map<string, Set<string>>();

  playersMap.forEach((_, id) => {
    statsMap.set(id, { v: 0, e: 0, d: 0, byes: 0, realMatches: 0 });
    opponentsMap.set(id, new Set());
  });

  const matchRegex = /<match\s+outcome="(\d+)"[^>]*>([\s\S]*?)<\/match>/gi;
  let mMatch: RegExpExecArray | null;

  while ((mMatch = matchRegex.exec(xmlText)) !== null) {
    const outcome = parseInt(mMatch[1], 10);
    const matchContent = mMatch[2];

    const p1 = matchContent.match(/<player1\s+userid="([^"]+)"/i)?.[1]?.trim();
    const p2 = matchContent.match(/<player2\s+userid="([^"]+)"/i)?.[1]?.trim();
    const singleP = matchContent.match(/<player\s+userid="([^"]+)"/i)?.[1]?.trim();

    if (p1 && p2) {
      if (!statsMap.has(p1)) {
        statsMap.set(p1, { v: 0, e: 0, d: 0, byes: 0, realMatches: 0 });
        opponentsMap.set(p1, new Set());
      }
      if (!statsMap.has(p2)) {
        statsMap.set(p2, { v: 0, e: 0, d: 0, byes: 0, realMatches: 0 });
        opponentsMap.set(p2, new Set());
      }

      statsMap.get(p1)!.realMatches++;
      statsMap.get(p2)!.realMatches++;
      opponentsMap.get(p1)!.add(p2);
      opponentsMap.get(p2)!.add(p1);

      if (outcome === 1) {
        statsMap.get(p1)!.v++;
        statsMap.get(p2)!.d++;
      } else if (outcome === 2) {
        statsMap.get(p1)!.d++;
        statsMap.get(p2)!.v++;
      } else if (outcome === 3) {
        statsMap.get(p1)!.e++;
        statsMap.get(p2)!.e++;
      }
    } else if (singleP) {
      // Byes no TOM: vitória automática de 3 pontos
      if (statsMap.has(singleP)) {
        statsMap.get(singleP)!.v++;
        statsMap.get(singleP)!.byes++;
      }
    }
  }

  // 3. Winrates individuais (MWP) e OMW% oficiais do Play! Pokémon / TOM
  const totalRounds = 4;
  const mwpMap = new Map<string, number>();
  playersMap.forEach((p, id) => {
    const st = statsMap.get(id) || { v: 0, e: 0, d: 0, byes: 0, realMatches: 0 };
    const winsReal = st.v - st.byes;
    const scoreReal = winsReal * 1.0 + st.e * 0.5;
    const matchesCount = st.realMatches > 0 ? st.realMatches : Math.max(1, totalRounds - st.byes);
    const rawRate = matchesCount > 0 ? scoreReal / matchesCount : 0.25;
    mwpMap.set(id, Math.max(0.25, rawRate));
  });

  const omwMap = new Map<string, number>();
  playersMap.forEach((_, id) => {
    const opps = opponentsMap.get(id);
    if (!opps || opps.size === 0) {
      omwMap.set(id, 0.25);
    } else {
      let sum = 0;
      opps.forEach((oppId) => {
        sum += mwpMap.get(oppId) || 0.25;
      });
      omwMap.set(id, sum / opps.size);
    }
  });

  const oomwMap = new Map<string, number>();
  playersMap.forEach((_, id) => {
    const opps = opponentsMap.get(id);
    if (!opps || opps.size === 0) {
      oomwMap.set(id, 0.25);
    } else {
      let sum = 0;
      opps.forEach((oppId) => {
        sum += omwMap.get(oppId) || 0.25;
      });
      oomwMap.set(id, sum / opps.size);
    }
  });

  // Mapear categoria a partir dos pods de standings
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

  // 4. Montar classificação geral única do torneio (idêntica à tabela impressa do TOM)
  const activeList: ParsedPlayerRow[] = [];
  const droppedList: ParsedPlayerRow[] = [];

  playersMap.forEach((p, id) => {
    const st = statsMap.get(id) || { v: 0, e: 0, d: 0, byes: 0, realMatches: 0 };
    const pontos = st.v * 3 + st.e * 1;
    const omw = omwMap.get(id) || 0.25;
    const cat = categoryMap.get(id) || "Master";

    const row: ParsedPlayerRow = {
      colocacao: 1,
      id,
      jogador: p.name,
      categoria: cat,
      pontos,
      vitorias: st.v,
      empates: st.e,
      derrotas: st.d,
      omw,
      isDnf: Boolean(p.dropped),
    };

    if (row.isDnf) {
      droppedList.push(row);
    } else {
      activeList.push(row);
    }
  });

  // Ordenação Geral Suíço Oficial: Pontos DESC -> OMW% DESC -> OOMW% DESC -> Nome ASC
  activeList.sort((a, b) => {
    if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
    if (Math.abs((b.omw || 0) - (a.omw || 0)) > 0.0001) return (b.omw || 0) - (a.omw || 0);
    const oomwA = oomwMap.get(a.id) || 0.25;
    const oomwB = oomwMap.get(b.id) || 0.25;
    if (Math.abs(oomwB - oomwA) > 0.0001) return oomwB - oomwA;
    return String(a.jogador || "").localeCompare(String(b.jogador || ""), "pt-BR");
  });

  droppedList.sort((a, b) => {
    if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
    if (Math.abs((b.omw || 0) - (a.omw || 0)) > 0.0001) return (b.omw || 0) - (a.omw || 0);
    return String(a.jogador || "").localeCompare(String(b.jogador || ""), "pt-BR");
  });

  // Atribuir colocações contínuas de 1º a N
  let pos = 1;
  activeList.forEach((p) => {
    p.colocacao = pos++;
  });
  droppedList.forEach((p) => {
    p.colocacao = pos++;
  });

  const playersResult: ParsedPlayerRow[] = [...activeList, ...droppedList];

  // 5. Fallback estritamente para arquivos sem bloco <standings> (em andamento)
  if (playersResult.length === 0 && playersMap.size > 0) {
    let idx = 1;
    playersMap.forEach((pInfo, id) => {
      const st = statsMap.get(id) || { v: 0, e: 0, d: 0 };
      const pontos = st.v * 3 + st.e * 1;
      playersResult.push({
        colocacao: idx++,
        id,
        jogador: pInfo.name,
        categoria: "Master",
        pontos,
        vitorias: st.v,
        empates: st.e,
        derrotas: st.d,
        omw: omwMap.get(id) || 0.25,
        isDnf: false,
      });
    });

    // Ordenação oficial Play! Pokémon no fallback: Pontos DESC -> OMW DESC -> Nome ASC
    playersResult.sort((a, b) => {
      if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
      if (Math.abs((b.omw || 0) - (a.omw || 0)) > 0.0001) return (b.omw || 0) - (a.omw || 0);
      return String(a.jogador || "").localeCompare(String(b.jogador || ""), "pt-BR");
    });

    playersResult.forEach((p, idx) => {
      p.colocacao = idx + 1;
    });
  }

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
