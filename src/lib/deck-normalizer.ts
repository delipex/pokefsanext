/**
 * Normalizador e detector de correspondência inteligente para Decks da Liga Atlântica
 */

// Dicionário de Sinônimos / Aliases conhecidos para correção automática
export const DECK_ALIASES: Record<string, string> = {
  "esconde some": "Esconde e Some",
  "esconde e some": "Esconde e Some",
  "esconde-some": "Esconde e Some",
  "praca de festas": "Praça de Festas",
  "mewtwo": "Mewtwo Ex da Equipe Rocket",
  "mewtwo ex": "Mewtwo Ex da Equipe Rocket",
  "mewtwo rocket": "Mewtwo Ex da Equipe Rocket",
  "grimmsnarl": "Grimmsnarl da Marine",
  "grimmsnarl marine": "Grimmsnarl da Marine",
  "typhlosion": "Typhlosion do Ethan",
  "typhlosion ethan": "Typhlosion do Ethan",
  "garchomp": "Garchomp Ex da Cíntia",
  "garchomp cintia": "Garchomp Ex da Cíntia",
  "garchomp da cintia": "Garchomp Ex da Cíntia",
  "lucario": "Mega Lucario Ex",
  "mega lucario": "Mega Lucario Ex",
  "gardevoir": "Mega Gardevoir Ex",
  "mega gardevoir": "Mega Gardevoir Ex",
  "excadrill": "Mega Excadrill Ex",
  "mega excadrill": "Mega Excadrill Ex",
  "greninja": "Mega Greninja Ex",
  "mega greninja": "Mega Greninja Ex",
  "kangaskhan": "Mega Kangaskhan Ex + Bastiodon",
  "trevenant": "Trevenant do Lupo",
  "zoroark": "Zoroark Ex do N",
  "zoroark n": "Zoroark Ex do N",
};

/**
 * Remove acentos, pontuações e converte para minúsculas
 */
export function normalizeDeckString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, " ") // troca pontuação por espaço
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Encontra a melhor correspondência no catálogo de decks oficial
 */
export function findMatchingCatalogDeck(
  inputDeck: string,
  catalogDecks: { id?: any; nome: string }[]
): { exact: boolean; matchedDeck: string | null } {
  if (!inputDeck) return { exact: false, matchedDeck: null };

  const cleanInput = inputDeck.trim();
  const normInput = normalizeDeckString(cleanInput);

  // 1. Match exato (case-insensitive)
  const exactMatch = catalogDecks.find(
    (d) => d.nome.toLowerCase() === cleanInput.toLowerCase()
  );
  if (exactMatch) {
    return { exact: true, matchedDeck: exactMatch.nome };
  }

  // 2. Match por Alias conhecido
  if (DECK_ALIASES[normInput]) {
    const aliasTarget = DECK_ALIASES[normInput];
    const match = catalogDecks.find(
      (d) => d.nome.toLowerCase() === aliasTarget.toLowerCase()
    );
    if (match) {
      return { exact: false, matchedDeck: match.nome };
    }
  }

  // 3. Match por string normalizada (sem acentos e pontuação)
  const normMatch = catalogDecks.find(
    (d) => normalizeDeckString(d.nome) === normInput
  );
  if (normMatch) {
    return { exact: false, matchedDeck: normMatch.nome };
  }

  // 4. Match parcial / sem palavras de ligação ("e", "de", "do", "da", "ex")
  const stripConnectors = (s: string) =>
    normalizeDeckString(s)
      .split(" ")
      .filter((w) => !["e", "de", "do", "da", "ex", "+"].includes(w))
      .join(" ");

  const strippedInput = stripConnectors(cleanInput);
  if (strippedInput.length > 3) {
    const partialMatch = catalogDecks.find(
      (d) => stripConnectors(d.nome) === strippedInput
    );
    if (partialMatch) {
      return { exact: false, matchedDeck: partialMatch.nome };
    }
  }

  return { exact: false, matchedDeck: null };
}
