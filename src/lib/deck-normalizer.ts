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

/**
 * Infere o tipo de energia automaticamente a partir do nome do deck ou da decklist
 */
export function inferDeckEnergy(deckName?: string | null, decklistText?: string | null): string {
  const normName = normalizeDeckString(deckName || "");
  const normList = (decklistText || "").toLowerCase();

  // Multi-energy / Box decks
  if (
    normName.includes("box") ||
    normName.includes("basic") ||
    normName.includes("lost box") ||
    normName.includes("regi") ||
    normName.includes("terapagos")
  ) {
    return "colorless";
  }

  // Check specific deck archetypes
  if (
    normName.includes("charizard") ||
    normName.includes("gouging fire") ||
    normName.includes("ceruledge") ||
    normName.includes("arcanine") ||
    normName.includes("typhlosion")
  )
    return "fire";
  if (
    normName.includes("dragapult") ||
    normName.includes("gardevoir") ||
    normName.includes("mewtwo") ||
    normName.includes("clefairy") ||
    normName.includes("flutter mane") ||
    normName.includes("banette")
  )
    return "psychic";
  if (
    normName.includes("miraidon") ||
    normName.includes("iron hands") ||
    normName.includes("regieleki") ||
    normName.includes("zapdos") ||
    normName.includes("vikavolt") ||
    normName.includes("pikachu")
  )
    return "lightning";
  if (
    normName.includes("chien pao") ||
    normName.includes("palkia") ||
    normName.includes("greninja") ||
    normName.includes("blastoise") ||
    normName.includes("gholdengo water")
  )
    return "water";
  if (
    normName.includes("ogerpon grass") ||
    normName.includes("teal mask") ||
    normName.includes("meowscarada") ||
    normName.includes("venusaur") ||
    normName.includes("hydrapple") ||
    normName.includes("trevenant")
  )
    return "grass";
  if (
    normName.includes("roaring moon") ||
    normName.includes("darkrai") ||
    normName.includes("grimmsnarl") ||
    normName.includes("zoroark") ||
    normName.includes("pecharunt") ||
    normName.includes("kingambit") ||
    normName.includes("sneasler")
  )
    return "darkness";
  if (
    normName.includes("raging bolt") ||
    normName.includes("dragonite") ||
    normName.includes("giratina") ||
    normName.includes("archaludon") ||
    normName.includes("goodra") ||
    normName.includes("garchomp")
  )
    return "dragon";
  if (
    normName.includes("gholdengo") ||
    normName.includes("dialga") ||
    normName.includes("scizor") ||
    normName.includes("melmetal") ||
    normName.includes("excadrill") ||
    normName.includes("steelix")
  )
    return "metal";
  if (
    normName.includes("lucario") ||
    normName.includes("ting lu") ||
    normName.includes("koraidon") ||
    normName.includes("ursaluna") ||
    normName.includes("annihilape") ||
    normName.includes("machamp")
  )
    return "fighting";
  if (
    normName.includes("lugia") ||
    normName.includes("kangaskhan") ||
    normName.includes("snorlax") ||
    normName.includes("blissey") ||
    normName.includes("cinccino") ||
    normName.includes("pidgeot")
  )
    return "colorless";

  // Check energy counts in decklist text if present
  if (normList) {
    const energies = [
      { type: "grass", count: (normList.match(/grass\s+energy|energia.*planta/g) || []).length },
      { type: "fire", count: (normList.match(/fire\s+energy|energia.*fogo/g) || []).length },
      { type: "water", count: (normList.match(/water\s+energy|energia.*água/g) || []).length },
      { type: "lightning", count: (normList.match(/lightning\s+energy|energia.*elétr/g) || []).length },
      { type: "psychic", count: (normList.match(/psychic\s+energy|energia.*psíq/g) || []).length },
      { type: "fighting", count: (normList.match(/fighting\s+energy|energia.*luta/g) || []).length },
      { type: "darkness", count: (normList.match(/darkness\s+energy|energia.*escur/g) || []).length },
      { type: "metal", count: (normList.match(/metal\s+energy|energia.*metál/g) || []).length },
    ];
    const presentEnergies = energies.filter((e) => e.count > 0);
    if (presentEnergies.length > 2) return "colorless";
    if (presentEnergies.length === 1) return presentEnergies[0].type;
  }

  return "colorless";
}

