/**
 * Utilitários para gestão de torneios, prazos e controle de inscrições da Liga Atlântica TCG
 */

export interface PremierRegistrationStatus {
  isOpen: boolean;
  statusBadge: "open" | "closed" | "deadline_passed" | "date_passed";
  statusText: string;
  badgeLabel: string;
  deadlineIso?: string;
  deadlineFormatted?: string;
  eventDateIso?: string;
  eventDateFormatted?: string;
  isDatePassed: boolean;
  isDeadlinePassed: boolean;
  isExplicitlyClosed: boolean;
}

/**
 * Normaliza qualquer data (DD-MM-YYYY, DD/MM/YYYY ou YYYY-MM-DD) para o padrão ISO YYYY-MM-DD
 */
export function normalizeDateToISO(dt?: string | null): string {
  if (!dt) return "";
  const clean = String(dt).trim().replace(/\//g, "-");
  const parts = clean.split("-");
  if (parts.length === 3) {
    // Caso DD-MM-YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    // Caso YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  return dt;
}

/**
 * Formata data ISO (YYYY-MM-DD) para exibição brasileira (DD/MM/YYYY)
 */
export function formatDateToBR(dt?: string | null): string {
  if (!dt) return "";
  const iso = normalizeDateToISO(dt);
  const parts = iso.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
  }
  return dt;
}

/**
 * Avalia o status das inscrições considerando:
 * 1. Chave de ativação do organizador (premierAbertas)
 * 2. Data limite configurada (premierDataLimite)
 * 3. Data do evento (se o dia do evento já passou)
 */
export function evaluatePremierRegistrationStatus(
  config: Record<string, any> = {}
): PremierRegistrationStatus {
  const isAbertasConfig =
    config?.premierAbertas === "true" ||
    config?.premierAbertas === true ||
    config?.inscricoesPremier?.abertas === true ||
    config?.inscricoesPremier?.abertas === "true";

  const premierData =
    config?.premierData ||
    config?.inscricoesPremier?.eventoData ||
    "";

  const premierDataLimite =
    config?.premierDataLimite ||
    config?.inscricoesPremier?.dataLimite ||
    "";

  const eventDateIso = normalizeDateToISO(premierData);
  const eventDateFormatted = formatDateToBR(eventDateIso);

  const now = new Date();

  // 1. Verificação de Data Limite Específica
  let isDeadlinePassed = false;
  let deadlineIso = "";
  let deadlineFormatted = "";

  if (premierDataLimite) {
    const deadlineDate = new Date(premierDataLimite);
    if (!isNaN(deadlineDate.getTime())) {
      deadlineIso = deadlineDate.toISOString();
      deadlineFormatted = deadlineDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      if (now.getTime() > deadlineDate.getTime()) {
        isDeadlinePassed = true;
      }
    }
  }

  // 2. Verificação da Data do Evento
  let isDatePassed = false;
  if (eventDateIso) {
    const parts = eventDateIso.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);

      // Fim do dia do torneio (23:59:59)
      const eventEnd = new Date(y, m - 1, d, 23, 59, 59);
      if (now.getTime() > eventEnd.getTime()) {
        isDatePassed = true;
      }
    }
  }

  // Se o organizador desativou manualmente
  if (!isAbertasConfig) {
    return {
      isOpen: false,
      statusBadge: "closed",
      badgeLabel: "Inscrições Fechadas",
      statusText: "As inscrições para este torneio estão encerradas pela organização.",
      deadlineIso,
      deadlineFormatted,
      eventDateIso,
      eventDateFormatted,
      isDatePassed,
      isDeadlinePassed,
      isExplicitlyClosed: true,
    };
  }

  // Se a data limite específica expirou
  if (isDeadlinePassed) {
    return {
      isOpen: false,
      statusBadge: "deadline_passed",
      badgeLabel: "Prazo Encerrado",
      statusText: `Prazo limite de inscrições expirou em ${deadlineFormatted}.`,
      deadlineIso,
      deadlineFormatted,
      eventDateIso,
      eventDateFormatted,
      isDatePassed,
      isDeadlinePassed,
      isExplicitlyClosed: false,
    };
  }

  // Se a data do evento já passou
  if (isDatePassed) {
    return {
      isOpen: false,
      statusBadge: "date_passed",
      badgeLabel: "Evento Encerrado",
      statusText: `A data deste evento (${eventDateFormatted || eventDateIso}) já passou. Inscrições encerradas.`,
      deadlineIso,
      deadlineFormatted,
      eventDateIso,
      eventDateFormatted,
      isDatePassed,
      isDeadlinePassed,
      isExplicitlyClosed: false,
    };
  }

  // Caso contrário, as inscrições estão válidas e abertas
  return {
    isOpen: true,
    statusBadge: "open",
    badgeLabel: "Inscrições Abertas",
    statusText: deadlineFormatted
      ? `Inscrições abertas até ${deadlineFormatted}`
      : "Inscrições Abertas para o Torneio",
    deadlineIso,
    deadlineFormatted,
    eventDateIso,
    eventDateFormatted,
    isDatePassed: false,
    isDeadlinePassed: false,
    isExplicitlyClosed: false,
  };
}

/**
 * Converte qualquer representação de valor monetário (ex: "35,00", "R$ 180,00", "180.50") para number
 */
export function parseBRLMoney(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  let s = String(val).replace(/[^\d.,]/g, "").trim();
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * Formata um número para a representação monetária brasileira padrão (ex: "35,00", "360,00")
 */
export function formatBRLMoney(num: number): string {
  return (isNaN(num) ? 0 : num).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Verifica se uma string de turno indica participação em ambos os horários (Kit Duplo / 2 Inscrições)
 */
export function isBothTurnosSelected(turno?: string | null): boolean {
  if (!turno) return false;
  const t = String(turno).toLowerCase().trim();

  // Palavras-chave explícitas de ambos os turnos / kit duplo
  if (
    t.includes("ambos") ||
    t.includes("duplo") ||
    t.includes("2 inscri") ||
    t.includes("duas inscri") ||
    t.includes("2 horários") ||
    t.includes("2 horarios") ||
    t.includes("dois horários") ||
    t.includes("dois horarios")
  ) {
    return true;
  }

  // Combinações explícitas de horários (ex: "1º e 2º", "1º + 2º", "1 e 2", "14h e 17h")
  // NOTA: NUNCA usar simples (t.includes("1") && t.includes("2")), pois "2º Horário (17h00)" possui o dígito 1 em 17h!
  const hasBothExplicit =
    /\b1[ºªo°]?\s*(?:e|\+|&|\/)\s*2[ºªo°]?\b/i.test(t) ||
    /\b(?:14(?:h(?:00)?|:00)?)\s*(?:e|\+|&|\/)\s*(?:17(?:h(?:00)?|:00)?)\b/i.test(t);

  return hasBothExplicit;
}

/**
 * Detecta se uma string de turno refere-se ao 1º Horário/Turno (14h00) de forma individual
 */
export function isTurno1Only(turno?: string | null): boolean {
  if (!turno || isBothTurnosSelected(turno)) return false;
  const t = String(turno).toLowerCase().trim();
  if (/\b(?:2[ºªo°]|17(?:h(?:00)?|:00)?)\b/i.test(t)) return false;

  return (
    /\b(?:1[ºªo°]|14(?:h(?:00)?|:00)?|manh[aã])\b/i.test(t) ||
    /\b1\s*hor[aá]rio\b/i.test(t) ||
    /^\s*1[ºªo°\s]/i.test(t)
  );
}

/**
 * Detecta se uma string de turno refere-se ao 2º Horário/Turno (17h00) de forma individual
 */
export function isTurno2Only(turno?: string | null): boolean {
  if (!turno || isBothTurnosSelected(turno)) return false;
  const t = String(turno).toLowerCase().trim();
  if (/\b(?:1[ºªo°]|14(?:h(?:00)?|:00)?)\b/i.test(t)) return false;

  return (
    /\b(?:2[ºªo°]|17(?:h(?:00)?|:00)?|tarde|noite)\b/i.test(t) ||
    /\b2\s*hor[aá]rio\b/i.test(t) ||
    /^\s*2[ºªo°\s]/i.test(t)
  );
}

/**
 * Máscara inteligente para digitação de data de nascimento no formato brasileiro DD/MM/AAAA.
 * Aceita números contínuos, barras ou formato ISO e devolve sempre DD/MM/AAAA.
 */
export function formatBirthDateMask(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  // Se já for formato ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatDateToBR(trimmed);
  }
  const digits = trimmed.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Validação rigorosa e cálculo oficial da categoria Play! Pokémon a partir da data de nascimento.
 */
export function calculatePokemonAgeCategory(birthStr?: string | null): {
  categoria: "Master" | "Senior" | "Junior";
  age?: number;
  year?: number;
  isValid: boolean;
  statusText?: string;
} {
  if (!birthStr) return { categoria: "Master", isValid: false };
  const iso = normalizeDateToISO(birthStr);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { categoria: "Master", isValid: false };
  }
  const parts = iso.split("-");
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return { categoria: "Master", isValid: false };
  const currentYear = new Date().getFullYear();
  if (y < 1920 || y > currentYear || m < 1 || m > 12 || d < 1 || d > 31) {
    return { categoria: "Master", isValid: false };
  }

  // Verifica dias do mês selecionado (considerando anos bissextos)
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d > daysInMonth) {
    return { categoria: "Master", isValid: false };
  }

  const today = new Date();
  let age = today.getFullYear() - y;
  const birthThisYear = new Date(today.getFullYear(), m - 1, d);
  if (today < birthThisYear) {
    age--;
  }

  // Regras Oficiais Play! Pokémon:
  // Junior: Nascidos a partir de 2014
  // Senior: Nascidos entre 2010 e 2013
  // Master: Nascidos até 2009
  let categoria: "Master" | "Senior" | "Junior" = "Master";
  if (y >= 2014) {
    categoria = "Junior";
  } else if (y >= 2010) {
    categoria = "Senior";
  } else {
    categoria = "Master";
  }

  return {
    categoria,
    age: Math.max(0, age),
    year: y,
    isValid: true,
    statusText: `${categoria} (${Math.max(0, age)} anos)`,
  };
}

