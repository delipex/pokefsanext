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

const PREPOSITIONS = new Set(["de", "da", "do", "dos", "das", "e", "del", "van", "von", "di"]);
const GENERATIONAL_SUFFIXES = new Set(["jr", "junior", "neto", "filho", "sobrinho", "segundo", "terceiro"]);

// Helper de Distância de Levenshtein para tratar variações comuns (ex: Luiz vs Luis, Matheus vs Mateus)
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// 3. Validador e Formatador de Nome Completo (Nome + Sobrenomes oficiais)
export function cleanAndFormatName(rawName?: string | null): string {
  if (!rawName) return "";

  // Remove pontuações e símbolos estranhos de forma suave, mantendo letras e acentos
  const cleaned = rawName
    .replace(/[,\.;:\[\]{}()\\\/_+=*&^%$#@!~?<>|"]/g, " ")
    .replace(/['`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter((w) => w.length > 0);

  const formatted = words
    .map((w, idx) => {
      const lower = w.toLowerCase();
      // Preposições em minúsculo se não for a primeira palavra
      if (idx > 0 && PREPOSITIONS.has(lower)) {
        return lower;
      }
      // Iniciais soltas em maiúsculo
      if (w.length === 1) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  return formatted;
}

export function validatePlayerName(rawName: string): { isValid: boolean; error?: string; cleanName?: string } {
  if (!rawName || typeof rawName !== "string") {
    return { isValid: false, error: "Informe seu Nome Completo (Nome e Sobrenome oficial)." };
  }

  const cleanName = cleanAndFormatName(rawName);

  if (cleanName.length < 3) {
    return { isValid: false, error: "O nome deve ter pelo menos 3 caracteres." };
  }

  // Bloqueio de números
  if (/\d/.test(rawName)) {
    return { isValid: false, error: "O nome não pode conter números." };
  }

  // Permite letras latinas e acentos do português
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(cleanName)) {
    return { isValid: false, error: "O nome contém caracteres ou símbolos inválidos." };
  }

  const parts = cleanName.split(" ").filter(Boolean);
  if (parts.length < 2) {
    return { isValid: false, error: "Informe seu nome completo (Nome e Sobrenome oficial)." };
  }

  // Lista básica anti-palavrões / trolls
  const bannedKeywords = ["admin", "root", "teste", "fake", "null", "undefined", "troll", "hacker"];
  const lower = cleanName.toLowerCase();
  for (const b of bannedKeywords) {
    if (lower === b || lower.startsWith(b + " ") || lower.endsWith(" " + b)) {
      return { isValid: false, error: "Nome não permitido. Utilize seu nome real de competidor." };
    }
  }

  return { isValid: true, cleanName };
}

// Helper para normalizar nomes removendo acentos e pontuações
export function normalizeName(str?: string | null): string {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s]/g, " ") // Pontuação vira espaço
    .replace(/\s+/g, " ")
    .trim();
}

// Extrai tokens significativos descartando preposições (de, da, do, dos, das, e)
export function getSignificantTokens(name?: string | null): string[] {
  return normalizeName(name)
    .split(" ")
    .filter((token) => token.length > 0 && !PREPOSITIONS.has(token));
}

// Compara se dois tokens/nomes são semanticamente equivalentes
export function areTokensSimilar(t1: string, t2: string): boolean {
  if (t1 === t2) return true;

  // Casamento por inicial: 's' vs 'silva' ou 'm' vs 'morais'
  if (t1.length === 1 && t2.startsWith(t1)) return true;
  if (t2.length === 1 && t1.startsWith(t2)) return true;

  // Sufixos geracionais equivalentes
  if (
    (t1 === "jr" && t2 === "junior") ||
    (t1 === "junior" && t2 === "jr") ||
    (t1 === "neto" && t2 === "neto") ||
    (t1 === "filho" && t2 === "filho") ||
    (t1 === "sobrinho" && t2 === "sobrinho")
  ) {
    return true;
  }

  // Variações fonéticas e ortográficas frequentes no Brasil (distância 1 para palavras com 4+ letras, distância 2 para 6+)
  const minLen = Math.min(t1.length, t2.length);
  if (minLen >= 4) {
    const dist = levenshteinDistance(t1, t2);
    if (dist <= 1) return true;
    if (minLen >= 6 && dist <= 2) return true;
  }

  return false;
}

// 3.1. Algoritmo Resiliente de Titularidade (Fuzzy Identity Match multi-token)
export function matchPlayerIdentity(
  inputName?: string | null,
  storedName?: string | null
): { isMatch: boolean; confidence: number; reason?: string } {
  const normInput = normalizeName(inputName);
  const normStored = normalizeName(storedName);

  // Se não houver nome pré-registrado na base, aceita o nome digitado
  if (!normStored) {
    return { isMatch: true, confidence: 1.0, reason: "Primeiro registro" };
  }

  // Casamento Exato Direto
  if (normInput === normStored) {
    return { isMatch: true, confidence: 1.0, reason: "Casamento exato" };
  }

  const inputTokens = getSignificantTokens(inputName);
  const storedTokens = getSignificantTokens(storedName);

  if (inputTokens.length === 0 || storedTokens.length === 0) {
    return { isMatch: false, confidence: 0, reason: "Nome vazio" };
  }

  // Contabiliza quantos tokens do cadastro oficial estão presentes no nome digitado pelo atleta
  const matchedStoredTokens = new Set<number>();
  const matchedInputTokens = new Set<number>();

  for (let sIdx = 0; sIdx < storedTokens.length; sIdx++) {
    const sToken = storedTokens[sIdx];
    for (let iIdx = 0; iIdx < inputTokens.length; iIdx++) {
      if (matchedInputTokens.has(iIdx)) continue;
      const iToken = inputTokens[iIdx];

      if (areTokensSimilar(sToken, iToken)) {
        matchedStoredTokens.add(sIdx);
        matchedInputTokens.add(iIdx);
        break;
      }
    }
  }

  const storedCount = storedTokens.length;
  const matchCount = matchedStoredTokens.size;

  // 1. Se o registro tinha apenas 1 palavra (ex: "Carlos" ou "Massao")
  if (storedCount === 1) {
    if (matchCount >= 1) {
      return { isMatch: true, confidence: 0.9, reason: "Nome único correspondido" };
    }
    return { isMatch: false, confidence: 0, reason: "Nome diferente" };
  }

  // 2. Se o registro tinha 2 termos (ex: "Carlos Morais", "Cristian S", "Felipe Damasceno", "Morais, Carlos")
  if (storedCount === 2) {
    // Ambos os termos do registro oficial constam no nome informado pelo atleta
    if (matchCount === 2) {
      return {
        isMatch: true,
        confidence: 0.95,
        reason: "Todos os termos do registro oficial constam no nome informado",
      };
    }

    // Se 1 dos termos for um sufixo geracional (Neto, Junior, Filho) e o outro termo bateu
    const unmatchedIdx = [0, 1].find((i) => !matchedStoredTokens.has(i));
    if (unmatchedIdx !== undefined) {
      const unmatchedToken = storedTokens[unmatchedIdx];
      if (GENERATIONAL_SUFFIXES.has(unmatchedToken) && matchCount >= 1) {
        return {
          isMatch: true,
          confidence: 0.85,
          reason: "Termo principal correspondido com sufixo geracional opcional",
        };
      }
    }

    return {
      isMatch: false,
      confidence: matchCount / storedCount,
      reason: `Apenas ${matchCount} de ${storedCount} termos do registro oficial foram localizados`,
    };
  }

  // 3. Se o registro oficial tinha 3+ termos (ex: "João Pedro Oliveira", "Kaike Falcão de Oliveira")
  if (storedCount >= 3) {
    if (matchCount >= Math.min(2, storedCount)) {
      return {
        isMatch: true,
        confidence: matchCount / storedCount,
        reason: `${matchCount} de ${storedCount} termos oficiais correspondidos com sucesso`,
      };
    }
    return {
      isMatch: false,
      confidence: matchCount / storedCount,
      reason: `Termos insuficientes: ${matchCount} de ${storedCount}`,
    };
  }

  return { isMatch: false, confidence: 0 };
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
export function calculatePokemonCategory(birthDateStr?: string | null): {
  isValid: boolean;
  categoria: "Master" | "Senior" | "Junior";
  age?: number;
  error?: string;
} {
  if (!birthDateStr) {
    return { isValid: false, categoria: "Master", error: "Data de nascimento é obrigatória." };
  }

  let birthYear = 0;
  if (birthDateStr.includes("/")) {
    const parts = birthDateStr.split("/");
    if (parts.length === 3) {
      birthYear = parseInt(parts[2], 10);
    }
  } else if (birthDateStr.includes("-")) {
    const parts = birthDateStr.split("-");
    if (parts.length === 3) {
      birthYear = parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10);
    }
  } else {
    const d = new Date(birthDateStr);
    if (!isNaN(d.getTime())) {
      birthYear = d.getFullYear();
    }
  }

  const currentYear = new Date().getFullYear();
  if (isNaN(birthYear) || birthYear < 1920 || birthYear > currentYear - 4) {
    return { isValid: false, categoria: "Master", error: "Data de nascimento inválida ou fora do intervalo válido." };
  }

  const age = currentYear - birthYear;

  // Regras Oficiais Play! Pokémon (Temporada 2026/2027):
  // Junior: Nascidos a partir de 2014
  // Senior: Nascidos entre 2010 e 2013
  // Master: Nascidos até 2009
  let categoria: "Master" | "Senior" | "Junior" = "Master";
  if (birthYear >= 2014) {
    categoria = "Junior";
  } else if (birthYear >= 2010) {
    categoria = "Senior";
  } else {
    categoria = "Master";
  }

  return { isValid: true, categoria, age };
}

export function verifyAthleteIdentity(
  athlete: { nome: string; categoria?: string | null; dataNascimento?: string | null },
  input: { nome: string; dataNascimento: string }
): {
  isValid: boolean;
  error?: string;
  cleanName?: string;
  calculatedCategory?: "Master" | "Senior" | "Junior";
} {
  if (!input.nome || !input.nome.trim()) {
    return { isValid: false, error: "Informe seu Nome Completo (Nome e Sobrenome) para validar sua titularidade." };
  }

  const nameVal = validatePlayerName(input.nome);
  if (!nameVal.isValid) {
    return { isValid: false, error: nameVal.error };
  }

  const match = matchPlayerIdentity(nameVal.cleanName, athlete.nome);
  if (!match.isMatch) {
    return {
      isValid: false,
      error: `O Nome Completo informado ("${nameVal.cleanName}") não confere com o titular cadastrado para este POP ID. Por segurança, digite seu nome e sobrenome oficial como registrado na Liga ou contate o organizador.`,
    };
  }

  if (!input.dataNascimento) {
    return { isValid: false, error: "Data de nascimento é obrigatória para validar sua titularidade na Liga." };
  }

  const catCheck = calculatePokemonCategory(input.dataNascimento);
  if (!catCheck.isValid) {
    return { isValid: false, error: catCheck.error };
  }

  // Se o atleta já possuía data de nascimento registrada anteriormente, valida se coincide a categoria
  if (athlete.dataNascimento) {
    const existingCatCheck = calculatePokemonCategory(athlete.dataNascimento);
    if (existingCatCheck.isValid && existingCatCheck.categoria.toLowerCase() !== catCheck.categoria.toLowerCase()) {
      return {
        isValid: false,
        error: `A Data de Nascimento informada resulta na categoria "${catCheck.categoria}", divergindo do registro histórico oficial ("${existingCatCheck.categoria}"). Contate o organizador.`,
      };
    }
  }

  return {
    isValid: true,
    cleanName: nameVal.cleanName,
    calculatedCategory: catCheck.categoria,
  };
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
