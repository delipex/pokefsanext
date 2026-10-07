/**
 * Parser e resolvedor de artes oficiais de Pokémon TCG para Decklists da Liga Atlântica
 */

export interface ParsedCardItem {
  count: number;
  name: string;
  set: string;
  number: string;
  category: "pokemon" | "trainer" | "energy";
  imageUrl: string;
  fallbackImageUrl: string;
}

export interface ParsedDecklistResult {
  totalCards: number;
  pokemon: ParsedCardItem[];
  trainer: ParsedCardItem[];
  energy: ParsedCardItem[];
  allCards: ParsedCardItem[];
  isValid60: boolean;
  archetypeSuggestion?: string;
}

// Mapeamento de coleções conhecidas para padronização de códigos Limitless/PTCG
export const SET_CODES: Record<string, string> = {
  SVI: "SVI",
  PAL: "PAL",
  OBF: "OBF",
  MEW: "MEW",
  PAR: "PAR",
  PAF: "PAF",
  TEF: "TEF",
  TWM: "TWM",
  SFA: "SFA",
  SCR: "SCR",
  SSP: "SSP",
  PRE: "PRE",
  JTG: "JTG",
  MEG: "MEG",
  PFL: "PFL",
  DRI: "DRI",
  ASC: "ASC",
  BRS: "BRS",
  ASR: "ASR",
  LOR: "LOR",
  SIT: "SIT",
  CRZ: "CRZ",
  SSH: "SSH",
  RCL: "RCL",
  DAA: "DAA",
  CPA: "CPA",
  VV: "VIV",
  VIV: "VIV",
  SHF: "SHF",
  BST: "BST",
  CRE: "CRE",
  EVS: "EVS",
  CEL: "CEL",
  FST: "FST",
  SVE: "SVE",
};

/**
 * Gera URL da imagem oficial da carta no CDN da Limitless / TCGDex
 */
export function getCardImageUrl(setCode: string, cardNumber: string): string {
  if (!setCode || !cardNumber) return "";
  const cleanSet = (SET_CODES[setCode.toUpperCase()] || setCode).toUpperCase();
  const numOnly = cardNumber.replace(/\D/g, "");
  const paddedNum = numOnly ? numOnly.padStart(3, "0") : cardNumber.padStart(3, "0");

  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${cleanSet}/${cleanSet}_${paddedNum}_R_EN.png`;
}

/**
 * Classifica a carta em Pokémon, Treinador ou Energia baseado em palavras-chave
 */
export function inferCardCategory(name: string, rawSectionHeader?: string): "pokemon" | "trainer" | "energy" {
  if (rawSectionHeader) {
    const s = rawSectionHeader.toLowerCase();
    if (s.includes("pok") || s.includes("mon")) return "pokemon";
    if (s.includes("trein") || s.includes("train") || s.includes("item") || s.includes("supp") || s.includes("stad")) return "trainer";
    if (s.includes("energ")) return "energy";
  }

  const n = name.toLowerCase();

  // Energias
  if (
    n.includes("energy") ||
    n.includes("energia") ||
    n.includes("double turbo") ||
    n.includes("jet energy") ||
    n.includes("mist energy") ||
    n.includes("luminous energy") ||
    n.includes("reversal energy") ||
    n.includes("legacy energy") ||
    n.includes("boomerang energy")
  ) {
    return "energy";
  }

  // Treinadores comuns
  const trainerKeywords = [
    "arven", "iono", "boss's orders", "ordens da chefia", "research", "pesquisa", "sadha", "turo",
    "ultra ball", "nest ball", "bola de ninho", "rare candy", "caramelo raro", "poffin", "buddy-buddy",
    "super rod", "supervara", "night stretcher", "maca noturna", "counter catcher", "pegador de contra",
    "prime catcher", "secret box", "caixa secreta", "earthen vessel", "vaso terrestre", "switch", "troca",
    "feathermall", "heavy ball", "pokégear", "town store", "temple of sinnoh", "artazon", "jamming tower",
    "pokestop", "bravery charm", "maximum belt", "hero's cape", "rescue board", "technical machine", "crushing hammer",
    "crispin", "briar", "kieran", "cynthia", "giovanni", "serena", "judge", "penny", "atticus", "colress",
    "larry", "explorer's guidance", "vitality band", "defiance band", "sparkling crystal", "canceling cologne"
  ];

  if (trainerKeywords.some((k) => n.includes(k))) {
    return "trainer";
  }

  // Padrão: Pokémon
  return "pokemon";
}

/**
 * Parser de texto puro de decklist (PTCG Live / Limitless / Manual)
 */
export function parsePTCGDecklist(rawText: string): ParsedDecklistResult {
  if (!rawText || typeof rawText !== "string") {
    return { totalCards: 0, pokemon: [], trainer: [], energy: [], allCards: [], isValid60: false };
  }

  const lines = rawText.split(/\r?\n/);
  const pokemon: ParsedCardItem[] = [];
  const trainer: ParsedCardItem[] = [];
  const energy: ParsedCardItem[] = [];
  const allCards: ParsedCardItem[] = [];

  let currentSectionHeader = "";
  let totalCards = 0;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detecta cabeçalhos (Ex: "Pokémon: 14", "Treinadores: 36", "Trainer: 36", "Energy: 10")
    if (/^(pok[eé]mon|trainer|treinador|energia|energy)/i.test(line)) {
      currentSectionHeader = line;
      continue;
    }

    // Padrão PTCG: "4 Charmander MEW 4" ou "4 Charmander MEW 004" ou "4 Charmander MEW 4 PH"
    // Regex flexível: [Quantidade] [Nome da Carta ...] [Código Coleção (2 a 5 letras)] [Número]
    const match = line.match(/^(\d+)\s+(.+?)(?:\s+([A-Za-z0-9]{2,5})\s+(\d+[a-zA-Z]?))(?:\s+.*)?$/);

    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2].trim();
      const set = match[3].toUpperCase();
      const number = match[4];
      const category = inferCardCategory(name, currentSectionHeader);
      const imageUrl = getCardImageUrl(set, number);
      const fallbackImageUrl = `https://limitless3.nyc3.cdn.digitaloceanspaces.com/limitless/social-preview.png`;

      const item: ParsedCardItem = {
        count,
        name,
        set,
        number,
        category,
        imageUrl,
        fallbackImageUrl,
      };

      totalCards += count;
      allCards.push(item);
      if (category === "pokemon") pokemon.push(item);
      else if (category === "trainer") trainer.push(item);
      else energy.push(item);
    } else {
      // Linha simples sem código de set: "4 Charmander"
      const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
      if (simpleMatch) {
        const count = parseInt(simpleMatch[1], 10);
        const name = simpleMatch[2].trim();
        const category = inferCardCategory(name, currentSectionHeader);

        const item: ParsedCardItem = {
          count,
          name,
          set: "SVI",
          number: "1",
          category,
          imageUrl: "",
          fallbackImageUrl: "",
        };

        totalCards += count;
        allCards.push(item);
        if (category === "pokemon") pokemon.push(item);
        else if (category === "trainer") trainer.push(item);
        else energy.push(item);
      }
    }
  }

  // Tenta sugerir o arquétipo principal baseado nos Pokémon principais
  let archetypeSuggestion: string | undefined = undefined;
  if (pokemon.length > 0) {
    const mainEx = pokemon.find((p) => /ex|vstar|vmax|v/i.test(p.name) || p.count >= 2);
    if (mainEx) {
      archetypeSuggestion = mainEx.name.replace(/ ex| VSTAR| VMAX| V/i, "").trim();
    }
  }

  return {
    totalCards,
    pokemon,
    trainer,
    energy,
    allCards,
    isValid60: totalCards === 60,
    archetypeSuggestion,
  };
}

/**
 * Converte array estruturado de cartas em texto PTCG Live standard
 */
export function formatCardsToPTCGText(cards: ParsedCardItem[]): string {
  const pokes = cards.filter((c) => c.category === "pokemon");
  const trainers = cards.filter((c) => c.category === "trainer");
  const energies = cards.filter((c) => c.category === "energy");

  const pokeCount = pokes.reduce((sum, c) => sum + c.count, 0);
  const trainerCount = trainers.reduce((sum, c) => sum + c.count, 0);
  const energyCount = energies.reduce((sum, c) => sum + c.count, 0);

  let out = "";
  if (pokes.length > 0) {
    out += `Pokémon: ${pokeCount}\n`;
    pokes.forEach((c) => {
      out += `${c.count} ${c.name} ${c.set} ${c.number}\n`;
    });
    out += "\n";
  }

  if (trainers.length > 0) {
    out += `Treinador: ${trainerCount}\n`;
    trainers.forEach((c) => {
      out += `${c.count} ${c.name} ${c.set} ${c.number}\n`;
    });
    out += "\n";
  }

  if (energies.length > 0) {
    out += `Energia: ${energyCount}\n`;
    energies.forEach((c) => {
      out += `${c.count} ${c.name} ${c.set} ${c.number}\n`;
    });
  }

  return out.trim();
}
