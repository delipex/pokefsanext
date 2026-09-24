import crypto from "crypto";

// 1. Sanitizador de Texto (Anti-XSS e Anti-Injection)
export function sanitizeText(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // Remove tags HTML
    .replace(/['"`;\\]/g, "") // Remove caracteres comuns de SQLi
    .trim();
}

// 2. Validador Rigoroso de POP ID (Play! Pokémon ID)
export function validatePopId(rawId: string): { isValid: boolean; error?: string; cleanId?: string } {
  const cleanId = rawId.replace(/\D/g, ""); // Apenas números

  if (!cleanId) {
    return { isValid: false, error: "O POP ID é obrigatório e deve conter apenas números." };
  }

  if (cleanId.length < 5 || cleanId.length > 9) {
    return { isValid: false, error: "POP ID inválido. O ID oficial deve conter entre 5 e 9 dígitos numéricos." };
  }

  // Bloqueio de IDs óbvios fakes / trolls
  const fakeSequences = ["12345", "123456", "1234567", "000000", "111111", "999999", "123123"];
  if (fakeSequences.includes(cleanId) || /^(\d)\1+$/.test(cleanId)) {
    return { isValid: false, error: "Este POP ID aparenta ser inválido ou de teste. Informe seu ID oficial." };
  }

  return { isValid: true, cleanId };
}

// 3. Validador de Nome Completo (Nome + Sobrenome)
export function validatePlayerName(rawName: string): { isValid: boolean; error?: string; cleanName?: string } {
  const cleanName = sanitizeText(rawName).replace(/\s+/g, " ");

  if (cleanName.length < 3) {
    return { isValid: false, error: "O nome deve ter pelo menos 3 caracteres." };
  }

  const parts = cleanName.split(" ").filter((p) => p.length >= 2);
  if (parts.length < 2) {
    return { isValid: false, error: "Informe seu nome completo (Nome e Sobrenome oficial)." };
  }

  // Bloqueio de números e símbolos no nome
  if (/\d/.test(cleanName) || /[!@#$%^&*()_+=\[\]{};':"\\|,.<>\/?]/.test(cleanName)) {
    return { isValid: false, error: "O nome não pode conter números ou símbolos especiais." };
  }

  // Lista básica anti-palavrões / trolls
  const bannedKeywords = ["admin", "root", "teste", "fake", "null", "undefined", "troll", "hacker"];
  const lower = cleanName.toLowerCase();
  for (const b of bannedKeywords) {
    if (lower === b || lower.startsWith(b + " ") || lower.endsWith(" " + b)) {
      return { isValid: false, error: "Nome não permitido. Utilize seu nome real de competidor." };
    }
  }

  // Formatar em Title Case oficial
  const titleCaseName = parts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return { isValid: true, cleanName: titleCaseName };
}

// Helper para normalizar nomes removendo acentos e pontuações
export function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/g, "") // Remove pontuação
    .replace(/\s+/g, " ")
    .trim();
}

// 3.1. Algoritmo de Razoabilidade e Correspondência Inteligente de Nomes (Fuzzy Identity Match)
export function matchPlayerIdentity(
  inputName: string,
  storedName: string
): { isMatch: boolean; confidence: number; reason?: string } {
  const normInput = normalizeName(inputName);
  const normStored = normalizeName(storedName);

  // 1. Casamento Exato
  if (normInput === normStored) {
    return { isMatch: true, confidence: 1.0, reason: "Casamento exato" };
  }

  const inputParts = normInput.split(" ").filter(Boolean);
  const storedParts = normStored.split(" ").filter(Boolean);

  if (inputParts.length === 0 || storedParts.length === 0) {
    return { isMatch: false, confidence: 0, reason: "Nome vazio" };
  }

  const inputFirst = inputParts[0];
  const storedFirst = storedParts[0];

  // 2. O primeiro nome DEVE ser compatível (ex: Cristian vs Cristian, Carlos vs Carlos)
  const isFirstMatch =
    inputFirst === storedFirst ||
    (inputFirst.length > 3 && storedFirst.length > 3 && (inputFirst.includes(storedFirst) || storedFirst.includes(inputFirst)));

  if (!isFirstMatch) {
    return {
      isMatch: false,
      confidence: 0,
      reason: `Primeiro nome diferente: digitado "${inputFirst}" vs registrado "${storedFirst}"`,
    };
  }

  // 3. Casamento por Iniciais ou Sobrenome (ex: "Cristian Silva" vs "Cristian S" ou "Carlos Junior" vs "Carlos J")
  const inputRest = inputParts.slice(1);
  const storedRest = storedParts.slice(1);

  // Se o nome registrado tinha apenas 1 palavra (ex: apenas "Carlos") e o usuário digitou "Carlos Silva"
  if (storedRest.length === 0 && isFirstMatch) {
    return { isMatch: true, confidence: 0.85, reason: "Primeiro nome idêntico com sobrenome expandido" };
  }

  // Checa se alguma inicial ou sobrenome bate
  let matchFound = false;
  for (const sPart of storedRest) {
    for (const iPart of inputRest) {
      if (sPart === iPart) {
        matchFound = true;
        break;
      }
      // Se for inicial (ex: 's' vs 'silva' ou 'j' vs 'junior')
      if (sPart.length === 1 && iPart.startsWith(sPart)) {
        matchFound = true;
        break;
      }
      if (iPart.length === 1 && sPart.startsWith(iPart)) {
        matchFound = true;
        break;
      }
      // Se um contiver o outro (ex: 'jr' vs 'junior')
      if (
        (sPart === "jr" && iPart === "junior") ||
        (sPart === "junior" && iPart === "jr") ||
        (sPart === "neto" && iPart === "neto") ||
        (sPart === "filho" && iPart === "filho")
      ) {
        matchFound = true;
        break;
      }
    }
    if (matchFound) break;
  }

  if (matchFound) {
    return { isMatch: true, confidence: 0.9, reason: "Primeiro nome e sobrenome/inicial compatíveis" };
  }

  return {
    isMatch: false,
    confidence: 0.4,
    reason: `Sobrenome incompatível: "${inputRest.join(" ")}" vs registrado "${storedRest.join(" ")}"`,
  };
}

// 4. Validador de WhatsApp / Telefone
export function validateWhatsApp(rawPhone: string): { isValid: boolean; error?: string; cleanPhone?: string } {
  const digits = rawPhone.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 11) {
    return { isValid: false, error: "Telefone/WhatsApp inválido. Informe o DDD + número (ex: 75999999999)." };
  }

  // Não permitir DDDs irreais (DDD começa com 1 a 9)
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, error: "DDD inválido." };
  }

  const formatted = digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;

  return { isValid: true, cleanPhone: formatted };
}

// 5. Calculador Automático e Inviolável de Categoria Play! Pokémon por Data de Nascimento
export function calculatePokemonCategory(birthDateStr: string): {
  isValid: boolean;
  categoria: "Master" | "Senior" | "Junior";
  age?: number;
  error?: string;
} {
  if (!birthDateStr) {
    return { isValid: false, categoria: "Master", error: "Data de nascimento é obrigatória." };
  }

  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) {
    return { isValid: false, categoria: "Master", error: "Data de nascimento inválida." };
  }

  const today = new Date();
  const birthYear = birth.getFullYear();
  const currentYear = today.getFullYear();

  if (birthYear < 1940 || birthYear > currentYear - 4) {
    return { isValid: false, categoria: "Master", error: "Data de nascimento fora do intervalo válido." };
  }

  const age = currentYear - birthYear;

  // Regras Oficiais Play! Pokémon (Temporada 2026/2027):
  // Junior: Nascidos a partir de 2013 (<12 anos)
  // Senior: Nascidos entre 2009 e 2012 (12 a 15 anos)
  // Master: Nascidos até 2008 (16+ anos)
  let categoria: "Master" | "Senior" | "Junior" = "Master";
  if (birthYear >= 2013) {
    categoria = "Junior";
  } else if (birthYear >= 2009) {
    categoria = "Senior";
  } else {
    categoria = "Master";
  }

  return { isValid: true, categoria, age };
}

// 6. Criptografia de PIN (Hash SHA-256 com Salt)
const PIN_SALT = "liga_atlantica_secret_salt_2026";
export function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin + PIN_SALT).digest("hex");
}

export function verifyPin(pin: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;
  return hashPin(pin) === storedHash;
}

// 7. Validador Sintático de Decklist Oficial de 60 Cartas (Anti-Troll)
export interface DecklistParseResult {
  isValid: boolean;
  totalCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  warnings: string[];
  error?: string;
}

export function parseAndValidateDecklist(rawText: string): DecklistParseResult {
  const result: DecklistParseResult = {
    isValid: false,
    totalCards: 0,
    pokemonCount: 0,
    trainerCount: 0,
    energyCount: 0,
    warnings: [],
  };

  if (!rawText || rawText.trim().length < 20) {
    result.error = "A decklist está vazia ou muito curta. Cole a lista exportada do Pokémon TCG Live ou Limitless.";
    return result;
  }

  const lines = rawText.split(/\r?\n/);
  const cardCounts: Record<string, number> = {};
  let currentSection = "pokemon";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (lower.includes("pokémon:") || lower.includes("pokemon:") || lower === "pokémon" || lower === "pokemon") {
      currentSection = "pokemon";
      continue;
    }
    if (lower.includes("treinador:") || lower.includes("trainer:") || lower === "treinadores" || lower === "trainer") {
      currentSection = "trainer";
      continue;
    }
    if (lower.includes("energia:") || lower.includes("energy:") || lower === "energia" || lower === "energy") {
      currentSection = "energy";
      continue;
    }

    // Identifica linhas que começam com quantidade, ex: "4 Dragapult Ex TWM 130" ou "2 Iono PAL 185"
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (match) {
      const count = parseInt(match[1], 10);
      const cardName = match[2].trim();

      if (count <= 0 || count > 59) continue;

      result.totalCards += count;
      if (currentSection === "pokemon") result.pokemonCount += count;
      else if (currentSection === "trainer") result.trainerCount += count;
      else if (currentSection === "energy") result.energyCount += count;

      // Regra dos 4 exemplares (exceto energias básicas)
      const isBasicEnergy = /basic\s+.*energy|energia\s+básica/i.test(cardName);
      if (!isBasicEnergy) {
        cardCounts[cardName] = (cardCounts[cardName] || 0) + count;
        if (cardCounts[cardName] > 4) {
          result.warnings.push(`A carta "${cardName}" possui mais de 4 cópias (${cardCounts[cardName]}).`);
        }
      }
    }
  }

  if (result.totalCards === 0) {
    result.error = "Formato de lista não reconhecido. Certifique-se de usar o formato padrão do Pokémon TCG Live (ex: '4 Charizard Ex OBF 125').";
    return result;
  }

  if (result.totalCards !== 60) {
    result.warnings.push(`A lista contém ${result.totalCards} cartas (deve conter exatamente 60 cartas para torneios oficiais).`);
  }

  if (result.pokemonCount === 0) {
    result.warnings.push("A lista não possui nenhum Pokémon identificado.");
  }

  result.isValid = result.totalCards === 60 && result.pokemonCount > 0 && result.warnings.length === 0;
  return result;
}

// 8. Rate Limiter Simples em Memória por IP (Anti-Spam de Requisições)
const ipRequestHistory = new Map<string, number[]>();

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];

  // Remove requisições fora da janela
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return false; // Bloqueia por excesso de tentativas
  }

  recent.push(now);
  ipRequestHistory.set(ip, recent);
  return true;
}
