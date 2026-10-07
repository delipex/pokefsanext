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

// Lista de Pokémon de suporte universais (não devem ser o nome principal se houver atacante)
const SUPPORT_POKEMON = [
  "lumineon", "rotom", "fezandipiti", "squawkabilly", "mew ex", "radiant", "greninja radiante",
  "bidoof", "bibarel", "pidgey", "pidgeotto", "duskull", "dusclops", "drakloak", "dreepy",
  "charmander", "charmeleon", "ralts", "kirlia", "manaphy", "jirachi", "cleffa", "dunsparce",
  "dudunsparce", "budew", "hawlucha", "mew", "radiante"
];

/**
 * Detecta o nome do arquétipo/deck automaticamente a partir de uma lista de cartas colada
 */
export function detectArchetypeFromDecklist(rawText: string, catalogDecks: string[] = []): string | null {
  if (!rawText || typeof rawText !== "string") return null;

  const lines = rawText.split(/\r?\n/);
  const pokemonCards: { count: number; name: string }[] = [];

  let inPokemonSection = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(pok[eé]mon)/i.test(trimmed)) {
      inPokemonSection = true;
      continue;
    }
    if (/^(trainer|treinador|energia|energy)/i.test(trimmed)) {
      inPokemonSection = false;
      continue;
    }

    const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+[A-Za-z0-9]{2,5}\s+\d+[a-zA-Z]?)?(?:\s+.*)?$/);
    if (match) {
      const count = parseInt(match[1], 10);
      const name = match[2].trim();
      const lower = name.toLowerCase();

      // Ignora itens ou energias se não estiver em seção explícita
      if (
        lower.includes("energy") || lower.includes("energia") ||
        lower.includes("ball") || lower.includes("candy") || lower.includes("rod") ||
        lower.includes("stretcher") || lower.includes("vessel") || lower.includes("switch") ||
        lower.includes("iono") || lower.includes("arven") || lower.includes("orders") ||
        lower.includes("research") || lower.includes("poffin")
      ) {
        continue;
      }

      if (inPokemonSection || count > 0) {
        pokemonCards.push({ count, name });
      }
    }
  }

  if (pokemonCards.length === 0) return null;

  // 1. Separa atacantes principais dos Pokémon de puro suporte
  const attackers = pokemonCards.filter(
    (p) => !SUPPORT_POKEMON.some((sup) => p.name.toLowerCase().includes(sup))
  );

  const candidates = attackers.length > 0 ? attackers : pokemonCards;

  // Ordena por quantidade (cópias) e prioridade de sufixos (ex, VSTAR, VMAX, V)
  candidates.sort((a, b) => {
    const aEx = /ex|vstar|vmax|v/i.test(a.name) ? 10 : 0;
    const bEx = /ex|vstar|vmax|v/i.test(b.name) ? 10 : 0;
    return (b.count + bEx) - (a.count + aEx);
  });

  const topCard = candidates[0];
  if (!topCard) return null;

  // 2. Tenta fazer match contra o catálogo oficial da Liga
  if (catalogDecks.length > 0) {
    const topNameNorm = normalizeDeckString(topCard.name.replace(/ ex| VSTAR| VMAX| V/i, ""));

    // Verifica combos populares de 2 Pokémon (Ex: Dragapult + Dusknoir)
    for (const catDeck of catalogDecks) {
      const normCat = normalizeDeckString(catDeck);
      const words = normCat.split(" ");

      if (words.length >= 2) {
        const matchesAllWords = words.every((w) =>
          pokemonCards.some((p) => normalizeDeckString(p.name).includes(w))
        );
        if (matchesAllWords) {
          return catDeck;
        }
      }
    }

    // Match direto pelo atacante principal
    for (const catDeck of catalogDecks) {
      const normCat = normalizeDeckString(catDeck);
      if (normCat.includes(topNameNorm) || topNameNorm.includes(normCat)) {
        return catDeck;
      }
    }
  }

  // 3. Fallback: Retorna o nome limpo do Pokémon principal
  return topCard.name;
}


