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
}

/**
 * Normaliza datas nos formatos ISO (AAAA-MM-DD), TOM (MM/DD/AAAA) ou BR (DD/MM/AAAA)
 */
export function parseTDFDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();

  // 1. ISO AAAA-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, "0");
    const d = isoMatch[3].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 2. Formatos com barras (MM/DD/AAAA ou DD/MM/AAAA)
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

  const dateMatch = xmlText.match(/<startdate>(.*?)<\/startdate>/i);
  if (dateMatch) tournamentDate = parseTDFDate(dateMatch[1]);

  if (!tournamentDate && fileName) {
    const fnDateMatch = fileName.match(/(\d{4}[-_]\d{2}[-_]\d{2})/);
    if (fnDateMatch) tournamentDate = fnDateMatch[1].replace(/_/g, "-");
  }

  // 1. Mapear jogadores cadastrados estritamente dentro do bloco <players>...</players>
  const playersMap = new Map<string, { name: string; birthdate: string }>();
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
      const fullName = `${firstname} ${lastname}`.trim() || `Jogador ${userid}`;
      playersMap.set(userid, { name: fullName, birthdate });
    }
  }

  // 2. Estatísticas de partidas (V, E, D) e oponentes
  const statsMap = new Map<string, { v: number; e: number; d: number }>();
  const opponentsMap = new Map<string, Set<string>>();

  playersMap.forEach((_, id) => {
    statsMap.set(id, { v: 0, e: 0, d: 0 });
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
        statsMap.set(p1, { v: 0, e: 0, d: 0 });
        opponentsMap.set(p1, new Set());
      }
      if (!statsMap.has(p2)) {
        statsMap.set(p2, { v: 0, e: 0, d: 0 });
        opponentsMap.set(p2, new Set());
      }

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
    } else if (p1 && !p2) {
      if (statsMap.has(p1)) statsMap.get(p1)!.v++;
    } else if (singleP) {
      // Byes no TOM: outcome 1, 5 ou 8 contam como vitória de 3 pontos
      if (statsMap.has(singleP)) {
        statsMap.get(singleP)!.v++;
      }
    }
  }

  // 3. Winrates individuais e OMW%
  const winRates = new Map<string, number>();
  playersMap.forEach((_, id) => {
    const st = statsMap.get(id) || { v: 0, e: 0, d: 0 };
    const points = st.v * 3 + st.e * 1;
    const opps = opponentsMap.get(id);
    const totalMatches = opps ? opps.size : 0;
    if (totalMatches === 0) {
      winRates.set(id, 0.25);
    } else {
      const rate = points / (totalMatches * 3);
      winRates.set(id, Math.max(0.25, rate));
    }
  });

  const omwMap = new Map<string, number>();
  playersMap.forEach((_, id) => {
    const opps = opponentsMap.get(id);
    if (!opps || opps.size === 0) {
      omwMap.set(id, 0.25);
    } else {
      let sum = 0;
      opps.forEach((oppId) => {
        sum += winRates.get(oppId) || 0.25;
      });
      omwMap.set(id, sum / opps.size);
    }
  });

  // 4. Standings finais a partir do bloco oficial <standings>
  const playersResult: ParsedPlayerRow[] = [];
  const standingsBlock = xmlText.match(/<standings>([\s\S]*?)<\/standings>/i)?.[1] || "";

  if (standingsBlock) {
    const podRegex = /<pod\s+category="([^"]+)"(?:\s+type="([^"]+)")?[^>]*>([\s\S]*?)<\/pod>/gi;
    let podMatch: RegExpExecArray | null;

    while ((podMatch = podRegex.exec(standingsBlock)) !== null) {
      const catCode = podMatch[1];
      const podType = podMatch[2] || "finished"; // "finished" ou "dnf"
      const podContent = podMatch[3];

      let categoria: "Master" | "Senior" | "Junior" = "Master";
      if (catCode === "10" || catCode === "2") categoria = "Master";
      else if (catCode === "11" || catCode === "1") categoria = "Senior";
      else if (catCode === "12" || catCode === "0") categoria = "Junior";

      const pInPodRegex = /<player\s+id="([^"]+)"(?:\s+place="([^"]+)")?[^>]*\/>/gi;
      let pipMatch: RegExpExecArray | null;
      let fallbackPlace = 1;

      while ((pipMatch = pInPodRegex.exec(podContent)) !== null) {
        const id = pipMatch[1].trim();
        const place = pipMatch[2] ? parseInt(pipMatch[2], 10) : fallbackPlace++;
        const pInfo = playersMap.get(id) || { name: `Jogador ${id}`, birthdate: "" };
        const st = statsMap.get(id) || { v: 0, e: 0, d: 0 };
        const pontos = st.v * 3 + st.e * 1;
        const omw = omwMap.get(id) || 0.25;

        playersResult.push({
          colocacao: place,
          id,
          jogador: pInfo.name,
          categoria,
          pontos,
          vitorias: st.v,
          empates: st.e,
          derrotas: st.d,
          omw,
          isDnf: podType === "dnf",
        });
      }
    }
  }

  // 5. Fallback para jogadores cadastrados se não houver standings explícitos
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
  }

  // 6. Ordenação oficial Play! Pokémon:
  // 1º Pontos DESC -> 2º Vitórias DESC -> 3º OMW DESC -> 4º Colocação Oficial ASC -> 5º Nome ASC
  playersResult.sort((a, b) => {
    if ((b.pontos || 0) !== (a.pontos || 0)) return (b.pontos || 0) - (a.pontos || 0);
    if ((b.vitorias || 0) !== (a.vitorias || 0)) return (b.vitorias || 0) - (a.vitorias || 0);
    if (Math.abs((b.omw || 0) - (a.omw || 0)) > 0.0001) return (b.omw || 0) - (a.omw || 0);
    if ((a.colocacao || 0) !== (b.colocacao || 0)) return (a.colocacao || 0) - (b.colocacao || 0);
    return String(a.jogador || "").localeCompare(String(b.jogador || ""), "pt-BR");
  });

  // Reatribuir colocação sequencial
  playersResult.forEach((p, idx) => {
    p.colocacao = idx + 1;
  });

  return {
    nomeTorneio: tournamentName,
    dataTorneio: tournamentDate,
    jogadores: playersResult,
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
