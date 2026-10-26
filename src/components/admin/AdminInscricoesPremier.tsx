"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  Settings,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  ClipboardList,
  Sparkles,
  X,
  Clock,
  Trophy,
  Users,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Zap,
  Layers,
  MapPin,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { parsePTCGDecklist } from "@/lib/decklist-parser";
import { DecklistVisualGallery } from "@/components/deck/DecklistVisualGallery";
import {
  evaluatePremierRegistrationStatus,
  formatDateToBR,
  isBothTurnosSelected,
  isTurno1Only,
  isTurno2Only,
} from "@/lib/tournament-utils";
import { AVAILABLE_ICONS, resolvePremierTheme, resolveIconEmoji } from "@/components/inscricao/PremierCtaTheme";

interface AdminInscricoesPremierProps {
  initialConfig: Record<string, any>;
  initialCalendar?: any[];
  initialDecklists?: any[];
  initialPlayers?: any[];
  initialDecks?: any[];
  onConfigUpdated?: (newConfig: Record<string, any>) => void;
}

// Helper para normalizar data DD-MM-YYYY ou DD/MM/YYYY para o formato ISO YYYY-MM-DD aceito pelo input date
const normalizeDateToISO = (dt?: string) => {
  if (!dt) return "";
  const clean = String(dt).trim().replace(/\//g, "-");
  const parts = clean.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  return dt;
};

export function AdminInscricoesPremier({
  initialConfig,
  initialCalendar = [],
  initialDecklists = [],
  initialPlayers = [],
  initialDecks = [],
  onConfigUpdated,
}: AdminInscricoesPremierProps) {
  // Configurações do Torneio
  const [premierAbertas, setPremierAbertas] = useState(
    initialConfig.premierAbertas === "true" || initialConfig.premierAbertas === true
  );
  const [premierTipo, setPremierTipo] = useState(initialConfig.premierTipo || "Challenge");
  const [premierMultiplicador, setPremierMultiplicador] = useState(
    initialConfig.premierMultiplicador || (initialConfig.premierTipo === "Liga" ? "1.0" : initialConfig.premierTipo === "Especial" ? "1.0" : "1.5")
  );
  const [premierNome, setPremierNome] = useState(
    initialConfig.premierNome || "League Challenge #2 — Temporada 5"
  );
  const [premierSubtitulo, setPremierSubtitulo] = useState(
    initialConfig.premierSubtitulo || "Valendo 15 Championship Points (CP) + Premiação em Boosters"
  );
  const [premierData, setPremierData] = useState(
    initialConfig.premierData ? normalizeDateToISO(initialConfig.premierData) : new Date().toISOString().split("T")[0]
  );
  const [premierDataLimite, setPremierDataLimite] = useState(
    initialConfig.premierDataLimite || ""
  );
  const [premierHorario, setPremierHorario] = useState(
    initialConfig.premierHorario || "Check-in às 13:30 • Rodada 1 às 14:00"
  );

  const currentRegStatus = useMemo(() => {
    return evaluatePremierRegistrationStatus({
      premierAbertas,
      premierData,
      premierDataLimite,
      premierHorario,
    });
  }, [premierAbertas, premierData, premierDataLimite, premierHorario]);
  const [premierLocal, setPremierLocal] = useState(
    initialConfig.premierLocal || "Livraria Atlântica +"
  );
  const [premierValor, setPremierValor] = useState(initialConfig.premierValor || "35,00");
  const [premierVagas, setPremierVagas] = useState(initialConfig.premierVagas || "32");
  const [premierExigirDecklist, setPremierExigirDecklist] = useState(
    initialConfig.premierExigirDecklist === "true" || initialConfig.premierExigirDecklist === true
  );
  const [premierPix, setPremierPix] = useState(
    initialConfig.premierPix || ""
  );
  const [premierTitular, setPremierTitular] = useState(
    initialConfig.premierTitular || "Liga Atlântica TCG (Felipe Damasceno)"
  );
  const [premierWaContato, setPremierWaContato] = useState(
    initialConfig.premierWaContato || ""
  );
  const [premierBanner, setPremierBanner] = useState(initialConfig.premierBanner || "");
  const [premierTema, setPremierTema] = useState(initialConfig.premierTema || "lightning");
  const [premierBannerIcone, setPremierBannerIcone] = useState(initialConfig.premierBannerIcone || "pumpkin");
  const [premierCtaTexto, setPremierCtaTexto] = useState(initialConfig.premierCtaTexto || "");
  const [premierCtaSubtexto, setPremierCtaSubtexto] = useState(initialConfig.premierCtaSubtexto || "");
  const [premierCtaBotao, setPremierCtaBotao] = useState(initialConfig.premierCtaBotao || "");
  const [premierBannerBg, setPremierBannerBg] = useState(initialConfig.premierBannerBg || "");
  const [premierOcultarDecksPadrao, setPremierOcultarDecksPadrao] = useState(
    initialConfig.premierOcultarDecksPadrao === "true" || initialConfig.premierOcultarDecksPadrao === true
  );
  const [premierPlaceholderDeck, setPremierPlaceholderDeck] = useState(
    initialConfig.premierPlaceholderDeck || ""
  );
  const [premierGratuito, setPremierGratuito] = useState(
    initialConfig.premierGratuito === "true" || initialConfig.premierGratuito === true
  );
  const [premierObs, setPremierObs] = useState(
    initialConfig.premierObs ||
      "Traga sua decklist impressa ou envie diretamente pelo formulário online até as 13:45. Formato Standard (Padrão)."
  );

  // Múltiplos Horários / Turnos (ex: Pré-Release em 2 sessões)
  const [premierMultiTurno, setPremierMultiTurno] = useState(
    initialConfig.premierMultiTurno === "true" || initialConfig.premierMultiTurno === true
  );
  const [premierTurno1Nome, setPremierTurno1Nome] = useState(
    initialConfig.premierTurno1Nome || "1º Horário (14h00)"
  );
  const [premierTurno2Nome, setPremierTurno2Nome] = useState(
    initialConfig.premierTurno2Nome || "2º Horário (17h00)"
  );
  const [premierPermitirAmbosTurnos, setPremierPermitirAmbosTurnos] = useState(
    initialConfig.premierPermitirAmbosTurnos === "true" || initialConfig.premierPermitirAmbosTurnos === true
  );
  const [selectedTurnoFilter, setSelectedTurnoFilter] = useState("all");

  // Estados de Inscrições / Decklists
  const [decklists, setDecklists] = useState<any[]>(initialDecklists);
  const [subtab, setSubtab] = useState<"online" | "archived">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedArchivedStage, setSelectedArchivedStage] = useState("all");

  // Central de Formulários & Status dos Eventos
  const [formEventsFilter, setFormEventsFilter] = useState<"all" | "active" | "upcoming" | "concluded">("all");
  const [isEditorExpanded, setIsEditorExpanded] = useState(true);
  const [activeEditingEventTitle, setActiveEditingEventTitle] = useState<string>(initialConfig.premierNome || "");

  // Modais e Feedback
  const [isNewRegistrationModalOpen, setIsNewRegistrationModalOpen] = useState(false);
  const [viewingDecklist, setViewingDecklist] = useState<any | null>(null);
  const [viewingEditLog, setViewingEditLog] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isUpdatingFromSheets, setIsUpdatingFromSheets] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Formulário de Nova Inscrição Manual
  const [manualForm, setManualForm] = useState({
    jogadorNome: "",
    jogadorId: "",
    categoria: "Master",
    turno: "",
    deckNome: "",
    tipoEnergia: "colorless",
    statusPix: "Confirmado",
    decklistRaw: "",
  });

  const directLink = typeof window !== "undefined" ? `${window.location.origin}/#inscricao` : "https://pokefsanext.vercel.app/#inscricao";

  // Preenchimento automático ao selecionar evento do calendário
  const handleSelectCalendarEvent = (calKey: string) => {
    if (!calKey) return;
    const cal = initialCalendar.find((c, idx) => String(c.id ?? idx) === calKey || `${c.data}_${c.evento}` === calKey);
    if (!cal) return;

    setActiveEditingEventTitle(cal.evento || "");
    setPremierNome(cal.evento || "");
    const isoDate = normalizeDateToISO(cal.data);
    setPremierData(isoDate);
    setPremierLocal(cal.local || "Livraria Atlântica +");
    
    if (cal.horario) {
      const hClean = cal.horario.trim();
      setPremierHorario(hClean.toLowerCase().includes("check-in") ? hClean : `Check-in às ${hClean}`);

      // Sugestão de data limite inteligente: 15 minutos antes do início
      const match = hClean.match(/(\d{1,2}):(\d{2})/);
      if (match && isoDate) {
        let hr = parseInt(match[1], 10);
        let mn = parseInt(match[2], 10);
        mn -= 15;
        if (mn < 0) {
          mn += 60;
          hr = Math.max(0, hr - 1);
        }
        setPremierDataLimite(`${isoDate}T${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`);
      } else if (isoDate) {
        setPremierDataLimite(`${isoDate}T13:45`);
      }
    } else if (isoDate) {
      setPremierDataLimite(`${isoDate}T23:59`);
    }

    if (cal.descricao) {
      setPremierSubtitulo(cal.descricao);
    }

    if (cal.evento?.toLowerCase().includes("release")) {
      setPremierTipo("Pre-Release");
      setPremierMultiplicador("1.0");
      setPremierExigirDecklist(false);
      setPremierMultiTurno(true);
      setPremierTurno1Nome("1º Horário (14h00)");
      setPremierTurno2Nome("2º Horário (17h00)");
      setPremierHorario("1º Horário às 14h00 • 2º Horário às 17h00");
      setPremierValor("180,00");
      if (!premierObs || premierObs.includes("Traga sua decklist")) {
        setPremierObs("Torneio de Pré-Release Oficial no Formato Selado com Build & Battle Box (40 cartas montadas na hora). Escolha seu horário de participação no formulário.");
      }
    } else if (cal.evento?.toLowerCase().includes("challenge")) {
      setPremierTipo("Challenge");
      setPremierMultiplicador("1.5");
      setPremierExigirDecklist(true);
      setPremierMultiTurno(false);
      setPremierValor("35,00");
    } else if (cal.evento?.toLowerCase().includes("cup")) {
      setPremierTipo("Cup");
      setPremierMultiplicador("1.5");
      setPremierExigirDecklist(true);
      setPremierMultiTurno(false);
      setPremierValor("45,00");
    } else {
      setPremierTipo("Especial");
      if (
        cal.evento?.toLowerCase().includes("halloween") ||
        cal.evento?.toLowerCase().includes("fantasma") ||
        cal.evento?.toLowerCase().includes("noturno")
      ) {
        setPremierTema("halloween");
        setPremierBannerIcone("pumpkin");
        setPremierOcultarDecksPadrao(true);
      }
    }
  };

  // Presets Rápidos de Configuração
  const handleApplyPreset = (preset: "prerelease" | "challenge" | "cup") => {
    if (preset === "prerelease") {
      setPremierTipo("Pre-Release");
      setPremierMultiplicador("1.0");
      setPremierExigirDecklist(false);
      setPremierMultiTurno(true);
      setPremierTurno1Nome("1º Horário (14h00)");
      setPremierTurno2Nome("2º Horário (17h00)");
      setPremierPermitirAmbosTurnos(true);
      setPremierHorario("1º Horário às 14h00 • 2º Horário às 17h00");
      setPremierValor("180,00");
      setPremierObs("Torneio de Pré-Release Oficial no Formato Selado com Build & Battle Box (40 cartas montadas na hora). Escolha seu horário de participação no formulário.");
    } else if (preset === "challenge") {
      setPremierTipo("Challenge");
      setPremierMultiplicador("1.5");
      setPremierExigirDecklist(true);
      setPremierMultiTurno(false);
      setPremierHorario("Check-in às 13:30 • Início da Rodada 1 às 14:00");
      setPremierValor("35,00");
      setPremierObs("Torneio Premier Oficial valendo 15 Championship Points (CP) + Boosters. Envie sua lista de 60 cartas pelo formulário online ou traga impressa.");
    } else if (preset === "cup") {
      setPremierTipo("Cup");
      setPremierMultiplicador("1.5");
      setPremierExigirDecklist(true);
      setPremierMultiTurno(false);
      setPremierHorario("Check-in às 13:30 • Início da Rodada 1 às 14:00");
      setPremierValor("45,00");
      setPremierObs("Torneio Premier Oficial valendo 50 Championship Points (CP) + Troféu Oficial + Boosters. Decklist obrigatória de 60 cartas no formato Standard.");
    }
    setFeedback({ text: `Preset "${preset.toUpperCase()}" aplicado nos campos do formulário! Clique em Salvar para publicar.`, type: "success" });
  };

  // Helper para calcular estatísticas de inscritos por evento
  const getEventRegistrationStats = useCallback((evName: string, evDate: string) => {
    const normDate = normalizeDateToISO(evDate);
    const nameLow = (evName || "").toLowerCase().trim();
    const matched = decklists.filter((d) => {
      const dDate = normalizeDateToISO(d.etapaData || d.etapa_data);
      const dName = (d.eventoNome || d.evento_nome || "").toLowerCase().trim();
      if (normDate && dDate && normDate === dDate) return true;
      if (nameLow && dName && (dName === nameLow || dName.includes(nameLow) || nameLow.includes(dName))) return true;
      return false;
    });
    const confirmed = matched.filter((d) => d.statusPix === "Confirmado").length;
    const pending = matched.length - confirmed;
    return { total: matched.length, confirmed, pending };
  }, [decklists]);

  // Helper para verificar se o evento do calendário corresponde ao formulário Premier ativo no site
  const isEventMatchingActivePremier = useCallback((evName: string, evDate: string) => {
    const normDate = normalizeDateToISO(evDate);
    const nameLow = (evName || "").toLowerCase().trim();
    const currentPremierDate = normalizeDateToISO(premierData);
    const currentPremierName = (premierNome || "").toLowerCase().trim();

    if (currentPremierDate && normDate && currentPremierDate === normDate) return true;
    if (currentPremierName && nameLow && (nameLow === currentPremierName || nameLow.includes(currentPremierName) || currentPremierName.includes(nameLow))) return true;
    return false;
  }, [premierData, premierNome]);

  // Ação rápida: Ativar evento diretamente como o formulário oficial do site
  const handleQuickActivateEvent = async (cal: any) => {
    handleSelectCalendarEvent(String(cal.id ?? `${cal.data}_${cal.evento}`));
    setPremierAbertas(true);
    setIsEditorExpanded(true);
    setFeedback({ text: `Evento "${cal.evento}" selecionado para ativação! Revise os valores abaixo e clique em Salvar para publicar no site.`, type: "success" });
    setTimeout(() => {
      document.getElementById("premier-form-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // Ação rápida: Filtrar tabela de inscrições para um evento específico
  const handleFilterRegistrationsByEvent = (evName: string) => {
    setSelectedEventFilter(evName);
    setTimeout(() => {
      document.getElementById("registrations-table-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // Lista enriquecida dos eventos do calendário
  const enrichedCalendarEvents = useMemo(() => {
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];

    return initialCalendar.map((ev, idx) => {
      const isoDate = normalizeDateToISO(ev.data);
      const isPast = Boolean(isoDate && isoDate < todayISO);
      const isConcluded = ev.status?.toLowerCase() === "concluido" || ev.status?.toLowerCase() === "concluído" || isPast;
      const isPremierActive = isEventMatchingActivePremier(ev.evento, ev.data);
      const stats = getEventRegistrationStats(ev.evento, ev.data);
      const hasCustomLink = Boolean(ev.linkInscricao && ev.linkInscricao.trim());

      const isRelease = Boolean(
        (ev.evento && ev.evento.toLowerCase().includes("release")) ||
        (ev.descricao && ev.descricao.toLowerCase().includes("release"))
      );
      const isCup = Boolean(ev.evento && ev.evento.toLowerCase().includes("cup"));
      const isChallenge = Boolean(ev.evento && ev.evento.toLowerCase().includes("challenge"));
      const isSpecial = Boolean(ev.evento && (ev.evento.toLowerCase().includes("especial") || ev.evento.toLowerCase().includes("tbt")));

      let detectedTipo = "Liga";
      if (isRelease) detectedTipo = "Pre-Release";
      else if (isCup) detectedTipo = "Cup";
      else if (isChallenge) detectedTipo = "Challenge";
      else if (isSpecial) detectedTipo = "Especial";

      return {
        ...ev,
        rawIndex: idx,
        isoDate,
        isPast,
        isConcluded,
        isPremierActive,
        isFormOpen: isPremierActive ? premierAbertas && currentRegStatus.isOpen : false,
        stats,
        hasCustomLink,
        detectedTipo,
      };
    });
  }, [initialCalendar, isEventMatchingActivePremier, getEventRegistrationStats, premierAbertas, currentRegStatus.isOpen]);

  // Lista filtrada para exibição nos cards da central
  const filteredCalendarEvents = useMemo(() => {
    return enrichedCalendarEvents.filter((ev) => {
      if (formEventsFilter === "active") {
        return ev.isPremierActive && ev.isFormOpen;
      }
      if (formEventsFilter === "upcoming") {
        return !ev.isConcluded;
      }
      if (formEventsFilter === "concluded") {
        return ev.isConcluded;
      }
      return true;
    });
  }, [enrichedCalendarEvents, formEventsFilter]);

  // Salvar Configurações do Premier
  const handleSavePremierConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setFeedback(null);

    const payload = {
      premierAbertas: String(premierAbertas),
      premierTipo,
      premierMultiplicador: String(premierMultiplicador),
      premierNome,
      premierSubtitulo,
      premierData,
      premierDataLimite,
      premierHorario,
      premierLocal,
      premierValor,
      premierVagas,
      premierMultiTurno: String(premierMultiTurno),
      premierTurno1Nome,
      premierTurno2Nome,
      premierPermitirAmbosTurnos: String(premierPermitirAmbosTurnos),
      premierExigirDecklist: String(premierExigirDecklist),
      premierPix,
      premierTitular,
      premierWaContato,
      premierBanner,
      premierTema,
      premierBannerIcone,
      premierCtaTexto,
      premierCtaSubtexto,
      premierCtaBotao,
      premierBannerBg,
      premierOcultarDecksPadrao: String(premierOcultarDecksPadrao),
      premierPlaceholderDeck,
      premierGratuito: String(premierGratuito),
      premierObs,
      premierWebhook: "",
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: payload }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao salvar configurações");

      setFeedback({ text: "Configurações de Inscrição salvas com sucesso!", type: "success" });
      onConfigUpdated?.(payload);
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao salvar", type: "error" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Copiar link de divulgação
  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Recarregar inscrições diretamente do banco de dados (Turso SQLite)
  const handleRefreshDecklists = async () => {
    setIsUpdatingFromSheets(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/decklists");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDecklists(data);
        setFeedback({ text: `${data.length} inscrições atualizadas do banco de dados com sucesso!`, type: "success" });
      }
    } catch (err: any) {
      setFeedback({ text: "Erro ao consultar banco de dados de inscrições.", type: "error" });
    } finally {
      setIsUpdatingFromSheets(false);
    }
  };

  // Exportar Roster CSV
  const handleExportCSV = () => {
    const headers = "Protocolo,Jogador,POP_ID,Categoria,Horario_Turno,Deck,Status_PIX,Data_Envio\n";
    const rows = filteredList
      .map(
        (d) =>
          `"${d.protocolo || ""}","${d.jogadorNome}","${d.jogadorId || ""}","${d.categoria || "Master"}","${d.turno || "Único"}","${d.deckNome || ""}","${d.statusPix || "Pendente"}","${d.enviadoEm || d.createdAt || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${premierNome.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Alternar Status de Pagamento
  const handleTogglePayment = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Confirmado" ? "Pendente" : "Confirmado";
    try {
      const res = await fetch("/api/admin/decklists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statusPix: nextStatus }),
      });
      if (res.ok) {
        setDecklists((prev) =>
          prev.map((d) => (d.id === id ? { ...d, statusPix: nextStatus } : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir inscrição
  const handleDeleteRegistration = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta inscrição?")) return;
    try {
      const res = await fetch(`/api/admin/decklists?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDecklists((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cadastrar inscrição manual
  const handleSaveManualRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/decklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          turno: manualForm.turno || (premierMultiTurno ? premierTurno1Nome : null),
          eventoNome: premierNome,
          etapaData: premierData,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao registrar");

      setDecklists((prev) => [data.item, ...prev]);
      setIsNewRegistrationModalOpen(false);
      setFeedback({ text: "Inscrição cadastrada com sucesso!", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao registrar", type: "error" });
    }
  };

  // Eventos disponíveis a partir das inscrições salvas no banco (apenas os que realmente possuem inscrições ou estão ativos)
  const availableEvents = useMemo(() => {
    const events = new Set<string>();
    decklists.forEach((d) => {
      if (d.eventoNome && d.eventoNome.trim()) {
        events.add(d.eventoNome.trim());
      }
    });
    if (premierNome && premierNome.trim() && premierAbertas) {
      events.add(premierNome.trim());
    }
    return Array.from(events);
  }, [decklists, premierNome, premierAbertas]);

  // Contagem de inscritos por turno / horário
  const turnoCounts = useMemo(() => {
    let t1 = 0;
    let t2 = 0;
    let ambos = 0;
    decklists.forEach((item) => {
      const t = item.turno || "";
      if (isBothTurnosSelected(t)) {
        ambos++;
      } else if (isTurno1Only(t)) {
        t1++;
      } else if (isTurno2Only(t)) {
        t2++;
      }
    });
    return { t1, t2, ambos };
  }, [decklists]);

  // Filtragem da lista
  const filteredList = useMemo(() => {
    return decklists.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.jogadorNome.toLowerCase().includes(q) ||
        (item.jogadorId && item.jogadorId.toLowerCase().includes(q)) ||
        (item.deckNome && item.deckNome.toLowerCase().includes(q)) ||
        (item.protocolo && item.protocolo.toLowerCase().includes(q));

      const matchCategory = !categoryFilter || item.categoria === categoryFilter;
      const matchPayment = !paymentFilter || item.statusPix === paymentFilter;
      const matchEvent =
        selectedEventFilter === "all" ||
        (item.eventoNome && item.eventoNome.trim().toLowerCase() === selectedEventFilter.trim().toLowerCase());

      const matchTurno =
        selectedTurnoFilter === "all" ||
        !selectedTurnoFilter ||
        (selectedTurnoFilter === "ambos"
          ? isBothTurnosSelected(item.turno)
          : selectedTurnoFilter === "1"
          ? isTurno1Only(item.turno)
          : selectedTurnoFilter === "2"
          ? isTurno2Only(item.turno)
          : item.turno === selectedTurnoFilter);

      return matchSearch && matchCategory && matchPayment && matchEvent && matchTurno;
    });
  }, [decklists, searchQuery, categoryFilter, paymentFilter, selectedEventFilter, selectedTurnoFilter]);

  const confirmedCount = filteredList.filter((d) => d.statusPix === "Confirmado").length;
  const pendingCount = filteredList.filter((d) => d.statusPix !== "Confirmado").length;

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              <span>Gestão de Inscrições & Decklists</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie, personalize o formulário online e valide o envio de listas de 60 cartas dos torneios oficiais.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsNewRegistrationModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Inscrição Manual</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Roster (CSV)</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTRAL DE FORMULÁRIOS & STATUS DOS EVENTOS DA LIGA      */}
        {/* ======================================================== */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/10 mb-6 space-y-5 bg-slate-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  <Layers className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Central de Formulários & Status dos Eventos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visualize os formulários ativos no site, acompanhe os atletas inscritos por etapa e configure novas inscrições com 1 clique.
                  </p>
                </div>
              </div>
            </div>

            {/* Filtro de Visualização */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-white/10 rounded-xl overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormEventsFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  formEventsFilter === "all"
                    ? "bg-amber-400 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todos ({enrichedCalendarEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setFormEventsFilter("active")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  formEventsFilter === "active"
                    ? "bg-emerald-500 text-white font-bold shadow shadow-emerald-500/20"
                    : "text-emerald-400 hover:text-emerald-300"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Ativos no Site
              </button>
              <button
                type="button"
                onClick={() => setFormEventsFilter("upcoming")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  formEventsFilter === "upcoming"
                    ? "bg-blue-500 text-white font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📅 Próximos
              </button>
              <button
                type="button"
                onClick={() => setFormEventsFilter("concluded")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  formEventsFilter === "concluded"
                    ? "bg-slate-700 text-white font-bold shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                🏁 Concluídos
              </button>
            </div>
          </div>

          {/* Resumo Rápido de Canais Ativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Status Canal Global (/#inscricao) */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              premierAbertas && currentRegStatus.isOpen
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-slate-950/40 border-white/5"
            }`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Formulário Principal (Site)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  premierAbertas && currentRegStatus.isOpen
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                }`}>
                  {premierAbertas && currentRegStatus.isOpen ? "🟢 Aberto em /#inscricao" : "🔴 Fechado / Oculto"}
                </span>
              </div>
              <div className="font-bold text-sm text-white truncate">
                {premierNome || "Nenhum torneio configurado"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Data: {formatDateToBR(premierData)}</span>
                <span className="text-amber-400 font-semibold">{premierValor ? `R$ ${premierValor}` : "Grátis"}</span>
              </div>
            </div>

            {/* Total Geral de Inscrições Recebidas */}
            <div className="p-3.5 rounded-xl border border-white/10 bg-slate-950/40">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Atletas no Banco de Dados</span>
                <span className="text-[10px] text-slate-400">Turso SQLite</span>
              </div>
              <div className="font-bold text-base text-amber-300 flex items-baseline gap-2">
                <span>{decklists.length} Registros</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({decklists.filter((d) => d.statusPix === "Confirmado").length} confirmados)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Distribuídos entre as etapas do calendário oficial
              </div>
            </div>
          </div>

          {/* Grade de Cards de Eventos & Formulários */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                Eventos da Temporada ({filteredCalendarEvents.length})
              </span>
              <span className="hidden sm:inline">
                Clique em <strong>Configurar Form</strong> para editar ou <strong>Ativar no Site</strong> para abrir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cards dos Eventos do Calendário */}
              {filteredCalendarEvents.map((ev) => {
                const isActiveOnSite = ev.isPremierActive;
                const isOpenOnSite = ev.isFormOpen;
                const stats = ev.stats;

                // Borda e tema conforme status
                let cardStyle = "border-white/10 bg-slate-900/40";
                if (isOpenOnSite) {
                  cardStyle = "border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40";
                } else if (isActiveOnSite && !premierAbertas) {
                  cardStyle = "border-amber-500/40 bg-amber-950/20";
                } else if (ev.isConcluded) {
                  cardStyle = "border-white/5 bg-slate-950/40 opacity-70";
                }

                return (
                  <div
                    key={ev.id ?? ev.rawIndex}
                    className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 transition-all relative overflow-hidden group ${cardStyle}`}
                  >
                    {isOpenOnSite && (
                      <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div>
                      {/* Badges de Topo */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                          ev.detectedTipo === "Pre-Release"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : ev.detectedTipo === "Cup"
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : ev.detectedTipo === "Challenge"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-slate-800 text-slate-300 border-white/10"
                        }`}>
                          {ev.detectedTipo}
                        </span>

                        {/* Status do formulário */}
                        {isOpenOnSite ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            🟢 ATIVO NO SITE
                          </span>
                        ) : isActiveOnSite && !premierAbertas ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            🟡 VINCULADO (PAUSADO)
                          </span>
                        ) : ev.isConcluded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                            🏁 CONCLUÍDO
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            📅 AGENDADO
                          </span>
                        )}
                      </div>

                      {/* Título e Data */}
                      <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {ev.evento}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-semibold">{formatDateToBR(ev.data)}</span>
                        {ev.horario && (
                          <>
                            <span>•</span>
                            <span className="truncate">{ev.horario}</span>
                          </>
                        )}
                      </div>

                      {/* Local & Info */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-300 border-t border-white/5 pt-2.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{ev.local || "Livraria Atlântica +"}</span>
                        </div>
                        {ev.descricao && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                            "{ev.descricao}"
                          </p>
                        )}
                      </div>

                      {/* Contador de Inscritos em Tempo Real */}
                      <div
                        onClick={() => handleFilterRegistrationsByEvent(ev.evento)}
                        className="mt-3 p-2 rounded-lg bg-slate-950/60 border border-white/5 hover:border-amber-400/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                        title="Clique para filtrar a tabela de inscrições para este evento"
                      >
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-semibold text-slate-300">
                            {stats.total} {stats.total === 1 ? "Inscrito" : "Inscritos"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-emerald-400 font-semibold">{stats.confirmed} confirmados</span>
                          {stats.pending > 0 && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-amber-400">{stats.pending} pendentes</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectCalendarEvent(String(ev.id ?? ev.rawIndex));
                          setIsEditorExpanded(true);
                          setFeedback({ text: `Carregado: "${ev.evento}" no configurador abaixo. Ajuste os detalhes e salve.`, type: "success" });
                          setTimeout(() => {
                            document.getElementById("premier-form-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 150);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5 text-amber-400" />
                        <span>Configurar Form</span>
                      </button>

                      {isOpenOnSite ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPremierAbertas(false);
                            setFeedback({ text: `Inscrições para "${ev.evento}" pausadas temporariamente.`, type: "success" });
                          }}
                          className="py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Pausar / Ocultar botão de inscrição no site"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          <span>Pausar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickActivateEvent(ev)}
                          className="py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Carregar evento e abrir formulário no site"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>Ativar no Site</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card: Personalização & Controle de Inscrições (Premier) */}
        <div id="premier-form-editor" className="glass-card rounded-xl p-5 border border-amber-400/20 bg-slate-900/50 mb-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Configurador do Formulário de Inscrição</span>
                </h3>
                {activeEditingEventTitle && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    Editando: {activeEditingEventTitle}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize o banner, regras, taxa PIX, vagas, formato, horários e requisitos de decklist exibidos no site.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/#inscricao"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Visualizar como os jogadores veem o formulário no site"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>Ver no Site</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  currentRegStatus.isOpen
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : currentRegStatus.statusBadge === "deadline_passed"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : currentRegStatus.statusBadge === "date_passed"
                    ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                    : "bg-red-500/15 text-red-400 border-red-500/30"
                }`}
              >
                {currentRegStatus.isOpen
                  ? "🟢 Inscrições Abertas no Site"
                  : currentRegStatus.statusBadge === "deadline_passed"
                  ? `🟡 Prazo Encerrado (${currentRegStatus.deadlineFormatted})`
                  : currentRegStatus.statusBadge === "date_passed"
                  ? `🟠 Evento Encerrado (${currentRegStatus.eventDateFormatted})`
                  : "🔴 Inscrições Fechadas / Ocultas"}
              </div>
            </div>
          </div>

          {/* Barra de Presets Rápidos de Torneio (1 Clique) */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Presets Rápidos de Torneio (Configuração em 1 Clique):</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleApplyPreset("prerelease")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🎉 Pré-Release Selado</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("challenge")}
                className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🏆 League Challenge</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("cup")}
                className="px-2.5 py-1 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>🥇 League Cup</span>
              </button>
            </div>
          </div>

          {/* Vincular a um evento do calendário */}
          <div className="p-3.5 rounded-xl bg-amber-400/[0.06] border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                ⚡ Vincular a um Evento do Calendário Oficial:
              </label>
              <select
                onChange={(e) => handleSelectCalendarEvent(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <option value="">-- Selecione um evento do calendário para vincular --</option>
                {initialCalendar.map((cal, idx) => (
                  <option key={cal.id ?? idx} value={String(cal.id ?? idx)}>
                    {cal.data} • {cal.evento} ({cal.local})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-400 max-w-xs leading-tight">
              Ao selecionar, o sistema preenche automaticamente o <strong>Nome</strong>, <strong>Data</strong>, <strong>Tipo</strong>, <strong>Local</strong> e <strong>Horário</strong> do torneio.
            </div>
          </div>

          <form onSubmit={handleSavePremierConfig} className="space-y-4 text-xs">
            {/* Linha 1: Status, Tipo e Multiplicador */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status das Inscrições</label>
                <select
                  value={String(premierAbertas)}
                  onChange={(e) => setPremierAbertas(e.target.value === "true")}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="true">🟢 Abertas (Exibir botão e aceitar inscrições)</option>
                  <option value="false">🔴 Fechadas / Ocultas (Ocultar botão no site)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Torneio</label>
                <select
                  value={premierTipo}
                  onChange={(e) => {
                    const nextTipo = e.target.value;
                    setPremierTipo(nextTipo);
                    if (nextTipo === "Liga") setPremierMultiplicador("1.0");
                    else if (nextTipo === "Challenge" || nextTipo === "Cup") setPremierMultiplicador("1.5");
                    else if (nextTipo === "Especial" && premierMultiplicador === "1.5") setPremierMultiplicador("1.0");
                    else if (nextTipo === "Pre-Release") {
                      setPremierMultiplicador("1.0");
                      setPremierExigirDecklist(false);
                      setPremierMultiTurno(true);
                      setPremierTurno1Nome("1º Horário (14h00)");
                      setPremierTurno2Nome("2º Horário (17h00)");
                      setPremierHorario("1º Horário às 14h00 • 2º Horário às 17h00");
                      if (!premierObs || premierObs.includes("Traga sua decklist")) {
                        setPremierObs("Torneio de Pré-Release Oficial no Formato Selado com Build & Battle Box (40 cartas montadas na hora). Escolha 1 dos horários (14h ou 17h) no formulário.");
                      }
                    }
                  }}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Challenge">League Challenge (1.5x)</option>
                  <option value="Cup">League Cup (1.5x)</option>
                  <option value="Pre-Release">🎉 Pré-Release / Selado (2 Horários)</option>
                  <option value="Especial">Torneio Especial / Comemorativo (Livre)</option>
                  <option value="Liga">Sessão Regular de Liga (1.0x)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Multiplicador de Pontos</label>
                  {premierTipo === "Especial" && (
                    <span className="text-[10px] text-purple-300 font-bold bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Livre
                    </span>
                  )}
                </div>
                {premierTipo === "Especial" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="10.0"
                        value={premierMultiplicador}
                        onChange={(e) => setPremierMultiplicador(e.target.value)}
                        className="w-full bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-2 text-amber-300 font-bold text-center"
                      />
                      <span className="text-xs font-bold text-slate-400">x</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["1.0", "1.25", "1.5", "1.75", "2.0"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPremierMultiplicador(p)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            premierMultiplicador === p
                              ? "bg-purple-600 text-white border border-purple-400"
                              : "bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700"
                          }`}
                        >
                          {p}x
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-amber-400 font-bold text-sm flex items-center justify-between h-[42px]">
                    <span>{premierTipo}</span>
                    <span className="text-xs bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded text-amber-300">
                      {premierMultiplicador}x
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Linha 2: Nome e Subtítulo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Oficial do Evento</label>
                <input
                  type="text"
                  required
                  value={premierNome}
                  onChange={(e) => setPremierNome(e.target.value)}
                  placeholder="Ex: League Challenge #2 — Temporada 5"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtítulo / Destaques / Premiação Resumida</label>
                <input
                  type="text"
                  value={premierSubtitulo}
                  onChange={(e) => setPremierSubtitulo(e.target.value)}
                  placeholder="Ex: Valendo 15 Championship Points (CP) + Premiação em Boosters"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Linha 3: Data, Horário e Local */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Data do Evento</label>
                <input
                  type="date"
                  required
                  value={premierData}
                  onChange={(e) => setPremierData(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Horários / Cronograma</label>
                <input
                  type="text"
                  value={premierHorario}
                  onChange={(e) => setPremierHorario(e.target.value)}
                  placeholder="Ex: Check-in às 13:30 • Rodada 1 às 14:00"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Local do Evento</label>
                <input
                  type="text"
                  value={premierLocal}
                  onChange={(e) => setPremierLocal(e.target.value)}
                  placeholder="Ex: Livraria Atlântica +"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Linha 3.5: Data & Horário Limite das Inscrições (Deadline Automático) */}
            <div className="p-3.5 rounded-2xl border border-white/10 bg-slate-950/70 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>Data e Horário Limite das Inscrições (Prazo Automático)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Após esta data e horário, o formulário de inscrições fecha automaticamente no site, impedindo novos envios para eventos passados.
                  </p>
                </div>
                {premierDataLimite && (
                  <button
                    type="button"
                    onClick={() => setPremierDataLimite("")}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer self-start sm:self-auto"
                  >
                    Remover Prazo (Deixar até o fim do dia do evento)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    type="datetime-local"
                    value={premierDataLimite}
                    onChange={(e) => setPremierDataLimite(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>

                {/* Atalhos rápidos para preencher a data limite baseada na data do evento */}
                {premierData && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Atalhos:</span>
                    <button
                      type="button"
                      onClick={() => setPremierDataLimite(`${premierData}T13:30`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    >
                      13:30
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremierDataLimite(`${premierData}T13:45`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    >
                      13:45
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremierDataLimite(`${premierData}T14:00`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    >
                      14:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremierDataLimite(`${premierData}T23:59`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    >
                      23:59
                    </button>
                  </div>
                )}
              </div>

              {/* Status do Prazo em Tempo Real */}
              <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold">
                <span className="text-slate-400">Diagnóstico do Prazo:</span>
                {currentRegStatus.isOpen ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {currentRegStatus.statusText}
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {currentRegStatus.statusText}
                  </span>
                )}
              </div>
            </div>

            {/* Linha 3.8: Múltiplos Horários / Turnos (Pré-Release / Múltiplas Sessões) */}
            <div className="p-4 rounded-2xl border border-indigo-500/30 bg-slate-950/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none mt-0.5">⏰</span>
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Múltiplos Horários / Turnos de Inscrição (Pré-Release)</span>
                      {premierMultiTurno && (
                        <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                          Ativo no formulário
                        </span>
                      )}
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Permite que os jogadores escolham entre 2 horários distintos (ex: Manhã ou Tarde) ou ambos em um único link de inscrição.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPremierMultiTurno(!premierMultiTurno)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    premierMultiTurno ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                  role="switch"
                  aria-checked={premierMultiTurno}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      premierMultiTurno ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {premierMultiTurno && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      🌅 Nome do 1º Horário / Turno
                    </label>
                    <input
                      type="text"
                      value={premierTurno1Nome}
                      onChange={(e) => setPremierTurno1Nome(e.target.value)}
                      placeholder="Ex: 1º Horário (14h00)"
                      className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-white text-xs font-medium focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      🌇 Nome do 2º Horário / Turno
                    </label>
                    <input
                      type="text"
                      value={premierTurno2Nome}
                      onChange={(e) => setPremierTurno2Nome(e.target.value)}
                      placeholder="Ex: 2º Horário (17h00)"
                      className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-white text-xs font-medium focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 p-2.5 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white transition-colors h-[38px]">
                      <input
                        type="checkbox"
                        checked={premierPermitirAmbosTurnos}
                        onChange={(e) => setPremierPermitirAmbosTurnos(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="font-semibold text-xs">Permitir "Ambos os Horários" (Kit Duplo)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Linha 4: Taxa, Vagas e Exigência de Decklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold text-xs sm:text-sm">Taxa de Inscrição (R$)</label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={premierGratuito}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPremierGratuito(checked);
                        if (checked) setPremierValor("0,00");
                      }}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 h-3.5 w-3.5"
                    />
                    <span>🎟️ Gratuito / Grátis</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={premierGratuito}
                  value={premierGratuito ? "0,00 (Gratuito)" : premierValor}
                  onChange={(e) => setPremierValor(e.target.value)}
                  placeholder="Ex: 35,00"
                  className={`w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white ${premierGratuito ? "opacity-60 cursor-not-allowed text-emerald-300 font-bold" : ""}`}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Capacidade Máxima (Vagas)</label>
                <input
                  type="number"
                  min="4"
                  max="128"
                  value={premierVagas}
                  onChange={(e) => setPremierVagas(e.target.value)}
                  placeholder="Ex: 32"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Exigência de Decklist (60 Cartas)
                  {premierTipo === "Pre-Release" && (
                    <span className="ml-2 text-[10px] text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Desativada (Pré-Release / Selado)
                    </span>
                  )}
                </label>
                <select
                  value={premierTipo === "Pre-Release" ? "false" : String(premierExigirDecklist)}
                  onChange={(e) => setPremierExigirDecklist(e.target.value === "true")}
                  disabled={premierTipo === "Pre-Release"}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="false">
                    📝 Desativada / Opcional {premierTipo === "Pre-Release" ? "(Padrão Pré-Release - cartas montadas no evento)" : "(pode entregar até a Rodada 1)"}
                  </option>
                  <option value="true">📜 Obrigatória no formulário (60 cartas)</option>
                </select>
              </div>
            </div>

            {/* Linha 4.5: Sessão Especial & Seleção de Decks */}
            <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    Sessão Especial & Opções de Baralho
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Formulário Flexível
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <label className="flex items-start gap-3 cursor-pointer bg-slate-900/90 p-3 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={premierOcultarDecksPadrao}
                    onChange={(e) => setPremierOcultarDecksPadrao(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-white block">
                      Ocultar Decks Padrão da Lista (Digitação Livre)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-relaxed">
                      Ative para sessões especiais (Halloween, torneios temáticos ou selados). O competidor digita o nome do seu deck em vez de selecionar na lista de 50 decks meta.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    Dica / Placeholder do Baralho Especial
                  </label>
                  <input
                    type="text"
                    value={premierPlaceholderDeck}
                    onChange={(e) => setPremierPlaceholderDeck(e.target.value)}
                    placeholder="Ex: Deck Temático Halloween, Gengar ex, Noturno..."
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Texto de exemplo exibido no campo para guiar os jogadores.
                  </span>
                </div>
              </div>
            </div>

            {/* Linha 5: Chave PIX, Titular e WhatsApp (ou Aviso de Gratuito) */}
            {premierGratuito ? (
              <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-300 tracking-wider block">
                      🎟️ Torneio Gratuito (Entrada Franca)
                    </span>
                    <span className="text-xs text-slate-300 block mt-0.5 leading-relaxed">
                      Chave PIX, QR Code, titular bancário e escolha de pagamento foram <strong>removidos do formulário público</strong>. O atleta preenche apenas seus dados de identificação e baralho.
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0 min-w-[240px]">
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    WhatsApp do Organizador (Opcional)
                  </label>
                  <input
                    type="text"
                    value={premierWaContato}
                    onChange={(e) => setPremierWaContato(e.target.value)}
                    placeholder="Ex: 5575999999999"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chave PIX para Pagamento</label>
                  <input
                    type="text"
                    value={premierPix}
                    onChange={(e) => setPremierPix(e.target.value)}
                    placeholder="CPF, CNPJ, E-mail, Celular ou Chave Aleatória"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Favorecido / Titular do PIX</label>
                  <input
                    type="text"
                    value={premierTitular}
                    onChange={(e) => setPremierTitular(e.target.value)}
                    placeholder="Ex: Liga Atlântica TCG (Felipe Damasceno)"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp do Organizador (Envio Direto)</label>
                  <input
                    type="text"
                    value={premierWaContato}
                    onChange={(e) => setPremierWaContato(e.target.value)}
                    placeholder="Ex: 5575999999999 (Vazio = padrão)"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>
            )}

            {/* Linha 6: Banner, Tema, Ícone e Cores Personalizadas */}
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <span className="text-xs font-black uppercase text-orange-300 tracking-wider">
                    Personalização Visual do Banner & Botão de Inscrição
                  </span>
                </div>
                <span className="text-[10px] text-orange-300 font-bold bg-orange-500/15 px-2.5 py-0.5 rounded-full border border-orange-500/30">
                  Home (Acima do Top 15) & Menu das Outras Páginas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    🎨 Tema de Cor & Estilo
                  </label>
                  <select
                    value={premierTema}
                    onChange={(e) => setPremierTema(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                  >
                    <option value="halloween">🎃 Halloween Especial (Laranja & Roxo Espectral)</option>
                    <option value="darkness">👻 Darkness / Noturno & Fantasma</option>
                    <option value="lightning">⚡ Lightning / Amarelo (Padrão)</option>
                    <option value="fire">🔥 Fire / Vermelho</option>
                    <option value="psychic">🔮 Psychic / Roxo</option>
                    <option value="water">💧 Water / Azul Turquesa</option>
                    <option value="grass">🌿 Grass / Verde Esmeralda</option>
                    <option value="dragon">🐉 Dragon / Dourado</option>
                    <option value="metal">⚙️ Metal / Prateado</option>
                    <option value="custom">🎨 Personalizado (Cor/Imagem Livre)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    🏷️ Ícone em Destaque
                  </label>
                  <select
                    value={premierBannerIcone}
                    onChange={(e) => setPremierBannerIcone(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.value} value={ic.value}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    🖼️ Imagem de Fundo (URL Opcional)
                  </label>
                  <input
                    type="url"
                    value={premierBannerBg}
                    onChange={(e) => setPremierBannerBg(e.target.value)}
                    placeholder="https://exemplo.com/arte-halloween.jpg"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    💬 Chamada Principal no Banner
                  </label>
                  <input
                    type="text"
                    value={premierCtaTexto}
                    onChange={(e) => setPremierCtaTexto(e.target.value)}
                    placeholder="Ex: 🎃 Torneio Especial de Halloween — Vagas Limitadas!"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    📝 Subtexto / Frase de Convite
                  </label>
                  <input
                    type="text"
                    value={premierCtaSubtexto}
                    onChange={(e) => setPremierCtaSubtexto(e.target.value)}
                    placeholder="Ex: Vista sua fantasia ou traga seu deck temático mais assustador!"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">
                    🔘 Texto do Botão de Ação
                  </label>
                  <input
                    type="text"
                    value={premierCtaBotao}
                    onChange={(e) => setPremierCtaBotao(e.target.value)}
                    placeholder="Ex: Garantir Vaga no Halloween ➜"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Preview em Tempo Real das Duas Posições Solicitadas */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Pré-visualização em Tempo Real:
                </div>

                {/* 1. Preview na Home (Acima do Top 15) */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    📍 Como aparecerá na Home (Acima do Top 15):
                  </span>
                  {(() => {
                    const previewTheme = resolvePremierTheme(premierTema);
                    const previewIcon = resolveIconEmoji(premierBannerIcone || previewTheme.iconDefault);
                    return (
                      <div
                        className={`relative overflow-hidden rounded-2xl border ${previewTheme.borderClass} ${previewTheme.glowClass} p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center`}
                      >
                        {premierBannerBg && (
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
                            style={{ backgroundImage: `url(${premierBannerBg})` }}
                          />
                        )}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${previewTheme.gradientClass} opacity-95 pointer-events-none`}
                        />
                        <div className="relative z-10 md:col-span-8 flex items-center gap-3.5 min-w-0">
                          <div
                            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white/15 to-black/60 border border-white/20 flex items-center justify-center text-3xl shrink-0 shadow-xl"
                            style={{ boxShadow: `0 0 20px ${previewTheme.accentColorHex}40` }}
                          >
                            {previewIcon}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${previewTheme.badgeClass}`}
                              >
                                {previewTheme.badgeText} • INSCRIÇÕES ABERTAS
                              </span>
                              {premierGratuito && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Entrada Franca
                                </span>
                              )}
                            </div>
                            <div className="text-base sm:text-lg font-black text-white truncate">
                              {premierCtaTexto || premierNome || previewTheme.defaultTitle}
                            </div>
                            <div className="text-xs text-slate-300 truncate">
                              {premierCtaSubtexto || premierSubtitulo || previewTheme.defaultSubtitle}
                            </div>
                          </div>
                        </div>
                        <div className="relative z-10 md:col-span-4 w-full flex flex-col items-stretch">
                          <button
                            type="button"
                            className={`w-full py-3 px-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-default ${previewTheme.buttonClass} border border-white/20 shadow-lg`}
                          >
                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black">
                              <span className="text-base leading-none">{previewIcon}</span>
                              <span>{premierCtaBotao || (premierGratuito ? "Garantir Vaga Gratuita ➜" : previewTheme.buttonTextDefault)}</span>
                            </div>
                            <span className="text-[10px] font-semibold opacity-90 inline-flex items-center gap-1 mt-1">
                              ⚡ Preenchimento rápido em 1 clique
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Preview nas Outras Páginas (Colado ao Menu) */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    📍 Como aparecerá nas outras páginas (Colado embaixo do menu):
                  </span>
                  {(() => {
                    const previewTheme = resolvePremierTheme(premierTema);
                    const previewIcon = resolveIconEmoji(premierBannerIcone || previewTheme.iconDefault);
                    return (
                      <div
                        className={`relative overflow-hidden rounded-xl border-b ${previewTheme.borderClass} ${previewTheme.glowClass} p-2.5 sm:p-3 flex items-center justify-between gap-3`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${previewTheme.gradientClass} opacity-95 pointer-events-none`}
                        />
                        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">{previewIcon}</span>
                          <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                            {premierCtaTexto || premierNome || previewTheme.defaultTitle}
                          </span>
                        </div>
                        <div className="relative z-10 shrink-0">
                          <button
                            type="button"
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-default ${previewTheme.buttonClass}`}
                          >
                            {(premierCtaBotao || previewTheme.buttonTextDefault).replace("➜", "").trim()} ➜
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Linha 7: Instruções e Regras */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Instruções, Regras & Premiação no Modal de Inscrição</label>
              <textarea
                rows={3}
                value={premierObs}
                onChange={(e) => setPremierObs(e.target.value)}
                placeholder="Orientações aos jogadores, estrutura de premiação, regras de check-in..."
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {/* Link Direto Compartilhável */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  🔗 Link Direto para Divulgação (WhatsApp / Instagram)
                </div>
                <input
                  type="text"
                  readOnly
                  value={directLink}
                  className="w-full mt-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono select-all"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 self-end sm:self-center cursor-pointer shadow-md"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-50"
              >
                {isSavingConfig ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>💾 Salvar Configurações de Inscrição</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Sub-navegação: Inscrições Ao Vivo vs Decklists Arquivadas */}
        <div id="registrations-table-section" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubtab("online")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subtab === "online"
                  ? "bg-amber-400 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              📥 Inscrições Recebidas Online (Ao Vivo)
            </button>
            <button
              type="button"
              onClick={() => setSubtab("archived")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subtab === "archived"
                  ? "bg-amber-400 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              📁 Decklists Arquivadas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshDecklists}
              disabled={isUpdatingFromSheets}
              className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingFromSheets ? "animate-spin" : ""}`} />
              <span>{isUpdatingFromSheets ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>
        </div>

        {/* Filtros da Tabela com Seletor de Evento e Turno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="bg-slate-900 border border-amber-400/40 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="all">Todos os Eventos ({decklists.length})</option>
            {availableEvents.map((evt) => {
              const count = decklists.filter((d) => d.eventoNome?.trim() === evt.trim()).length;
              return (
                <option key={evt} value={evt}>
                  {evt} ({count})
                </option>
              );
            })}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por jogador, POP ID ou protocolo..."
              className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Todas as Categorias</option>
            <option value="Master">Master</option>
            <option value="Senior">Senior</option>
            <option value="Junior">Junior</option>
          </select>

          <select
            value={selectedTurnoFilter}
            onChange={(e) => setSelectedTurnoFilter(e.target.value)}
            className="bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-indigo-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">Todos os Horários / Turnos</option>
            <option value="1">🌅 1º Horário ({turnoCounts.t1})</option>
            <option value="2">🌇 2º Horário ({turnoCounts.t2})</option>
            {turnoCounts.ambos > 0 && <option value="ambos">⚡ Ambos os Horários ({turnoCounts.ambos})</option>}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Todos os Status de Pagamento</option>
            <option value="Confirmado">Confirmado / Pago ✅</option>
            <option value="Pendente">PIX Pendente ⏳</option>
            <option value="Pagar no Local">Pagar no Local 🏢</option>
          </select>
        </div>

        {/* Badges de Resumo */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10 font-bold">
              Total Inscritos: {filteredList.length}
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              Confirmados: {confirmedCount}
            </span>
            <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              PIX Pendente: {filteredList.filter((d) => d.statusPix === "Pendente").length}
            </span>
            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
              No Local (Balcão): {filteredList.filter((d) => d.statusPix === "Pagar no Local" || d.statusPix === "Presencial").length}
            </span>
          </div>

          {(premierMultiTurno || turnoCounts.t1 + turnoCounts.t2 + turnoCounts.ambos > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                <span>🌅 1º Turno:</span>
                <span className="font-mono text-white">{turnoCounts.t1}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <span>🌇 2º Turno:</span>
                <span className="font-mono text-white">{turnoCounts.t2}</span>
              </span>
              {turnoCounts.ambos > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <span>⚡ Ambos:</span>
                  <span className="font-mono text-white">{turnoCounts.ambos}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabela de Inscrições */}
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-white/5 rounded-xl bg-slate-950/40">
            <p className="text-sm font-semibold">Nenhuma inscrição encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">
              Cadastre uma nova inscrição pelo botão acima ou aguarde os envios dos jogadores pelo site.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase font-bold bg-slate-900/60">
                  <th className="py-3 px-3 w-24">Protocolo</th>
                  <th className="py-3 px-4">Treinador / POP ID</th>
                  <th className="py-3 px-3">Evento / Turno</th>
                  <th className="py-3 px-3 text-center w-20">Categoria</th>
                  <th className="py-3 px-4">Baralho / Arquétipo</th>
                  <th className="py-3 px-3 text-center w-24">Lista</th>
                  <th className="py-3 px-3 text-center w-32">Pagamento</th>
                  <th className="py-3 px-3 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((item) => {
                  const isPaid = item.statusPix === "Confirmado";
                  const isPresencial = item.statusPix === "Pagar no Local" || item.statusPix === "Presencial";
                  const hasList = Boolean(item.decklistRaw);

                  return (
                    <tr key={item.id || item.protocolo} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {item.protocolo || `--`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{item.jogadorNome}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.jogadorId && (
                            <span className="text-[11px] text-slate-400 font-mono">ID: {item.jogadorId}</span>
                          )}
                          {((item.historicoEdicoes && item.historicoEdicoes !== "[]") ||
                            (item.historico_edicoes && item.historico_edicoes !== "[]") ||
                            item.updatedAt ||
                            item.updated_at) && (
                            <button
                              type="button"
                              onClick={() => setViewingEditLog(item)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all cursor-pointer shadow-sm"
                              title="Ver histórico de edições desta inscrição"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                              <span>Editado ✏️</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-amber-300 text-xs truncate max-w-[140px]">
                          {item.eventoNome || premierNome}
                        </div>
                        {item.turno && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              ⏰ {item.turno}
                            </span>
                          </div>
                        )}
                        {item.etapaData && !item.turno && (
                          <div className="text-[10px] text-slate-400">{item.etapaData}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-bold">
                          {item.categoria || "Master"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{item.deckNome || "Sem deck"}</span>
                          {item.tipoEnergia && <EnergyBadge energyRaw={item.tipoEnergia} />}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {hasList ? (
                          <button
                            type="button"
                            onClick={() => setViewingDecklist(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>60 Cartas</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(item.id, item.statusPix)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
                            isPaid
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : isPresencial
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                          }`}
                          title="Clique para alternar status do pagamento"
                        >
                          {isPaid ? "Pago ✅" : isPresencial ? "No Local 🏢" : "PIX Pendente ⏳"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRegistration(item.id)}
                          className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                          title="Excluir Inscrição"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Visualização de Decklist Oficial (60 Cartas + Artes) */}
      {viewingDecklist && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="glass-card max-w-3xl w-full p-4 sm:p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Decklist de {viewingDecklist.jogadorNome}
                </h3>
                <p className="text-xs text-amber-300 font-semibold">
                  {viewingDecklist.deckNome} • POP ID: {viewingDecklist.jogadorId || "N/D"} ({viewingDecklist.categoria || "Master"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDecklist(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DecklistVisualGallery
                parsedData={parsePTCGDecklist(viewingDecklist.decklistRaw || "")}
                deckName={viewingDecklist.deckNome}
                rawText={viewingDecklist.decklistRaw}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400 font-mono">
                Protocolo: #{viewingDecklist.protocolo || "N/A"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingDecklist.decklistRaw || "");
                    alert("Lista copiada para a área de transferência!");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  Copiar Texto
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDecklist(null)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Manual de Inscrição */}
      {isNewRegistrationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                <span>Cadastrar / Importar Inscrição</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewRegistrationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRegistration} className="space-y-3 text-xs">
              {/* Seletor Rápido de Atleta do Banco */}
              {initialPlayers.length > 0 && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <label className="block text-blue-300 font-bold mb-1">
                    👤 Vincular a um Atleta Cadastrado no Banco (Opcional):
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const p = initialPlayers.find((pl) => String(pl.id || pl.ID) === selectedId);
                      if (p) {
                        setManualForm({
                          ...manualForm,
                          jogadorNome: p.nome || p.jogador || p.Jogador || "",
                          jogadorId: String(p.id || p.ID || ""),
                          categoria: p.categoria || p.Categoria || "Master",
                        });
                      }
                    }}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white"
                  >
                    <option value="">-- Selecione para preencher Nome, ID e Categoria --</option>
                    {initialPlayers.map((p) => {
                      const id = String(p.id || p.ID || "");
                      const nome = p.nome || p.jogador || p.Jogador || "";
                      return (
                        <option key={id || nome} value={id}>
                          {nome} {id ? `(ID: ${id})` : ""} • {p.categoria || "Master"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Jogador</label>
                  <input
                    type="text"
                    required
                    value={manualForm.jogadorNome}
                    onChange={(e) => setManualForm({ ...manualForm, jogadorNome: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">POP ID (Opcional)</label>
                  <input
                    type="text"
                    value={manualForm.jogadorId}
                    onChange={(e) => setManualForm({ ...manualForm, jogadorId: e.target.value })}
                    placeholder="Ex: 1234567"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={manualForm.categoria}
                    onChange={(e) => setManualForm({ ...manualForm, categoria: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Master">Master</option>
                    <option value="Senior">Senior</option>
                    <option value="Junior">Junior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status PIX</label>
                  <select
                    value={manualForm.statusPix}
                    onChange={(e) => setManualForm({ ...manualForm, statusPix: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Confirmado">Confirmado / Pago ✅</option>
                    <option value="Pendente">Pendente ⏳</option>
                  </select>
                </div>
              </div>

              {premierMultiTurno && (
                <div>
                  <label className="block text-indigo-300 font-semibold mb-1">⏰ Horário / Turno da Inscrição</label>
                  <select
                    value={manualForm.turno || premierTurno1Nome}
                    onChange={(e) => setManualForm({ ...manualForm, turno: e.target.value })}
                    className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-3 py-2 text-white font-medium"
                  >
                    <option value={premierTurno1Nome}>🌅 {premierTurno1Nome}</option>
                    <option value={premierTurno2Nome}>🌇 {premierTurno2Nome}</option>
                    {premierPermitirAmbosTurnos && (
                      <option value="Ambos os Horários (Kit Duplo)">⚡ Ambos os Horários (Kit Duplo)</option>
                    )}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Deck / Arquétipo</label>
                  <input
                    type="text"
                    required
                    value={manualForm.deckNome}
                    onChange={(e) => setManualForm({ ...manualForm, deckNome: e.target.value })}
                    placeholder="Ex: Charizard ex"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Energia</label>
                  <select
                    value={manualForm.tipoEnergia}
                    onChange={(e) => setManualForm({ ...manualForm, tipoEnergia: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="fire">🔥 Fire</option>
                    <option value="water">💧 Water</option>
                    <option value="grass">🌿 Grass</option>
                    <option value="lightning">⚡ Lightning</option>
                    <option value="psychic">🔮 Psychic</option>
                    <option value="fighting">🥊 Fighting</option>
                    <option value="darkness">🌑 Darkness</option>
                    <option value="metal">⚙️ Metal</option>
                    <option value="dragon">🐉 Dragon</option>
                    <option value="colorless">⚪ Colorless</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decklist (60 Cartas em Texto - Opcional)</label>
                <textarea
                  rows={4}
                  value={manualForm.decklistRaw}
                  onChange={(e) => setManualForm({ ...manualForm, decklistRaw: e.target.value })}
                  placeholder="Cole a lista de cartas exportada do Pokémon TCG Live..."
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewRegistrationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Cadastrar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Histórico de Edições / Auditoria */}
      {viewingEditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Histórico de Edições da Inscrição
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {viewingEditLog.jogadorNome} (POP ID: {viewingEditLog.jogadorId || "N/A"}) • #{viewingEditLog.protocolo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingEditLog(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {(() => {
                let history: any[] = [];
                try {
                  const raw = viewingEditLog.historicoEdicoes || viewingEditLog.historico_edicoes || "[]";
                  history = typeof raw === "string" ? JSON.parse(raw) : raw;
                  if (!Array.isArray(history)) history = [];
                } catch {
                  history = [];
                }

                if (history.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 text-center text-xs text-slate-400">
                      Inscrição atualizada em{" "}
                      {viewingEditLog.updatedAt || viewingEditLog.updated_at
                        ? new Date(viewingEditLog.updatedAt || viewingEditLog.updated_at).toLocaleString("pt-BR")
                        : "data recente"}
                      , sem histórico detalhado anterior.
                    </div>
                  );
                }

                return history.map((entry, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-purple-300">
                        Alteração #{history.length - idx} •{" "}
                        {entry.dataHora ? new Date(entry.dataHora).toLocaleString("pt-BR") : "Data N/A"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                        {entry.editadoPor === "jogador" ? "Pelo Atleta" : "Admin"}
                      </span>
                    </div>

                    {entry.alteracoes && entry.alteracoes.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-300">
                        {entry.alteracoes.map((alt: string, aIdx: number) => (
                          <li key={aIdx} className="flex items-start gap-1.5">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{alt}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingEditLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
