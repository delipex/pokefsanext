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
