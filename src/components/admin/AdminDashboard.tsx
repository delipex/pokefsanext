"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  UserPlus,
  Settings,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Trophy,
  Users,
  Flame,
  Plus,
  ExternalLink,
  Sparkles,
  Sliders,
  Calendar,
  LogOut,
  Trash2,
  MapPin,
  Clock,
  Link as LinkIcon,
  Shield,
  Save,
  Pencil,
  X,
  Copy,
  Check,
  Eye,
  ClipboardList,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { parseTDFContent, ParsedPlayerRow } from "@/lib/tdf-parser";

interface AdminDashboardProps {
  initialPlayers: any[];
  initialDecks: any[];
  initialConfig: Record<string, any>;
  initialCalendar?: any[];
  initialDecklists?: any[];
}

export function AdminDashboard({
  initialPlayers,
  initialDecks,
  initialConfig,
  initialCalendar = [],
  initialDecklists = [],
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tdf" | "jogadores" | "decks" | "calendario" | "inscricoes" | "config" | "fechamento">("tdf");

  // Estado de Decklists Submetidas
  const [decklists, setDecklists] = useState<any[]>(initialDecklists);
  const [decklistSearch, setDecklistSearch] = useState("");
  const [previewDecklist, setPreviewDecklist] = useState<any | null>(null);
  const [copiedDecklistId, setCopiedDecklistId] = useState<number | null>(null);

  // Estado do Fechamento de Temporada
  const [closureCurrentSeason, setClosureCurrentSeason] = useState(Number(initialConfig.temporadaAtual) || 5);
  const [closureNextSeason, setClosureNextSeason] = useState((Number(initialConfig.temporadaAtual) || 5) + 1);
  const [closureDate, setClosureDate] = useState(new Date().toISOString().split("T")[0]);
  const [closureCampeao, setClosureCampeao] = useState("");
  const [closureVice, setClosureVice] = useState("");
  const [closureDeck, setClosureDeck] = useState("");
  const [closureConfirmText, setClosureConfirmText] = useState("");
  const [closureResetRanking, setClosureResetRanking] = useState(true);
  const [closureLoading, setClosureLoading] = useState(false);
  const [closureMessage, setClosureMessage] = useState("");
  const [closureSuccess, setClosureSuccess] = useState(false);

  // Estado da aba TDF
  const [stageDate, setStageDate] = useState(new Date().toISOString().split("T")[0]);
  const [stageType, setStageType] = useState("Liga");
  const [customStageTitle, setCustomStageTitle] = useState("");
  const [multiplier, setMultiplier] = useState(1.0);
  const [parsedRows, setParsedRows] = useState<(ParsedPlayerRow & { deckNome?: string })[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [resolvedNamesMap, setResolvedNamesMap] = useState<Record<string, string>>({});

  // Estado de Jogadores
  const [players, setPlayers] = useState(initialPlayers);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCategory, setNewPlayerCategory] = useState("Master");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerMessage, setPlayerMessage] = useState("");

  // Estado de Decks
  const [decks, setDecks] = useState(initialDecks);
  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
  const [editingDeckOriginalName, setEditingDeckOriginalName] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckEnergy, setNewDeckEnergy] = useState("fire");
  const [newDeckImage, setNewDeckImage] = useState("");
  const [newDeckLimitless, setNewDeckLimitless] = useState("");
  const [deckSearch, setDeckSearch] = useState("");
  const [deckMessage, setDeckMessage] = useState("");

  // Estado de Calendário
  const [calendarEvents, setCalendarEvents] = useState(initialCalendar);
  const [editingCalId, setEditingCalId] = useState<number | null>(null);
  const [newCalDate, setNewCalDate] = useState(new Date().toISOString().split("T")[0]);
  const [newCalEvento, setNewCalEvento] = useState("");
  const [newCalLocal, setNewCalLocal] = useState("Livraria Atlântica +");
  const [newCalHorario, setNewCalHorario] = useState("14:00");
  const [newCalStatus, setNewCalStatus] = useState("confirmado");
  const [newCalLinkMaps, setNewCalLinkMaps] = useState("https://maps.google.com");
  const [newCalLinkInscricao, setNewCalLinkInscricao] = useState("");
  const [calendarMessage, setCalendarMessage] = useState("");

  // Estado de Configurações Globais
  const [nomeLiga, setNomeLiga] = useState(initialConfig.nomeLiga || "Liga Atlântica TCG");
  const [temporadaAtual, setTemporadaAtual] = useState(initialConfig.temporadaAtual || "5");
  const [avisoTopo, setAvisoTopo] = useState(initialConfig.avisoTopo || "");
  const [linkWhatsApp, setLinkWhatsApp] = useState(initialConfig.linkWhatsApp || "");
  const [linkInstagram, setLinkInstagram] = useState(initialConfig.linkInstagram || "");
  const [chavePix, setChavePix] = useState(initialConfig.chavePix || "");
  const [adminPin, setAdminPin] = useState(initialConfig.adminPin || "1234");
  const [statusTemporada, setStatusTemporada] = useState(initialConfig.statusTemporada || "ativa");
  const [configMessage, setConfigMessage] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Normalizador de nomes
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  // Mudança do tipo de evento com multiplicador automático
  const handleEventTypeSelect = (type: string) => {
    setStageType(type);
    if (type === "Liga") {
      setMultiplier(1.0);
    } else if (type === "Challenge") {
      setMultiplier(1.5);
    } else if (type === "Cup") {
      setMultiplier(1.5);
    } else if (type === "Especial") {
      setMultiplier(1.0);
    }
  };

  // Leitura de um ou múltiplos arquivos TDF (XML TOM e TSV)
  const handleFilesProcess = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    let combinedPlayers: (ParsedPlayerRow & { deckNome?: string })[] = [];
    let detectedDate: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const parsed = parseTDFContent(text, file.name);

      if (parsed.dataTorneio && !detectedDate) {
        detectedDate = parsed.dataTorneio;
      }

      combinedPlayers = combinedPlayers.concat(
        parsed.jogadores.map((j) => ({
          ...j,
          deckNome: "Não registrado",
        }))
      );
    }

    if (detectedDate) {
      setStageDate(detectedDate);
    }

    // Ordenação Estrita Oficial:
    // 1. Pontos DESC -> 2. Vitórias DESC -> 3. OMW DESC -> 4. Colocação ASC -> 5. Nome ASC
    combinedPlayers.sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (Math.abs((b.omw || 0) - (a.omw || 0)) > 0.0001) return (b.omw || 0) - (a.omw || 0);
      if (a.colocacao !== b.colocacao) return a.colocacao - b.colocacao;
      return a.jogador.localeCompare(b.jogador, "pt-BR");
    });

    // Reatribuir colocação sequencial
    combinedPlayers.forEach((p, idx) => {
      p.colocacao = idx + 1;
    });

    setParsedRows(combinedPlayers);
    setPublishMessage("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesProcess(e.target.files);
    }
  };

  // Identificar jogadores não cadastrados no banco
  const unresolvedPlayers = useMemo(() => {
    if (parsedRows.length === 0) return [];

    const dbNamesNormalized = new Set(players.map((p) => normalizeName(p.nome)));
    const dbIds = new Set(players.map((p) => String(p.id).trim()).filter(Boolean));

    const unresolved: (ParsedPlayerRow & { deckNome?: string })[] = [];

    parsedRows.forEach((row) => {
      const rowId = row.id ? String(row.id).trim() : "";
      const isMatchedById = rowId && dbIds.has(rowId);
      const isMatchedByName = dbNamesNormalized.has(normalizeName(row.jogador));

      if (!isMatchedById && !isMatchedByName) {
        if (!resolvedNamesMap[row.jogador]) {
          unresolved.push(row);
        }
      }
    });

    return unresolved;
  }, [parsedRows, players, resolvedNamesMap]);

  // Ação rápida: Cadastrar jogador não resolvido
  const handleQuickRegisterPlayer = async (p: ParsedPlayerRow) => {
    const idToRegister = p.id || String(Date.now()).slice(-7);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: idToRegister,
          nome: p.jogador,
          categoria: p.categoria || "Master",
        }),
      });

      if (res.ok) {
        const newEntry = { id: idToRegister, nome: p.jogador, categoria: p.categoria || "Master" };
        setPlayers((prev) => [...prev.filter((item) => item.id !== idToRegister), newEntry]);
        setResolvedNamesMap((prev) => ({ ...prev, [p.jogador]: p.jogador }));
      }
    } catch (err) {
      console.error("Erro ao cadastrar jogador rapidamente:", err);
    }
  };

  // Atualizar deck de um jogador na pré-visualização
  const handlePlayerDeckChange = (index: number, deckName: string) => {
    setParsedRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], deckNome: deckName };
      return updated;
    });
  };

  // Publicação da Etapa
  const handlePublishStage = async () => {
    if (parsedRows.length === 0) return;
    setIsPublishing(true);
    setPublishMessage("");

    try {
      const finalEventName = stageType === "Personalizado" && customStageTitle ? customStageTitle : stageType;

      const res = await fetch("/api/admin/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: stageDate,
          tipo: finalEventName,
          multiplicador: multiplier,
          resultados: parsedRows.map((r) => ({
            ...r,
            jogador: resolvedNamesMap[r.jogador] || r.jogador,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPublishMessage("✅ Etapa publicada, metagame atualizado e ranking consolidado recalculado com sucesso!");
        setParsedRows([]);
      } else {
        setPublishMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setPublishMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Selecionar Jogador para Edição
  const handleSelectPlayerToEdit = (p: any) => {
    setEditingPlayerId(p.id);
    setNewPlayerId(p.id);
    setNewPlayerName(p.nome);
    setNewPlayerCategory(p.categoria || "Master");
    setPlayerMessage("");
  };

  const handleCancelEditPlayer = () => {
    setEditingPlayerId(null);
    setNewPlayerId("");
    setNewPlayerName("");
    setNewPlayerCategory("Master");
    setPlayerMessage("");
  };

  // Salvar/Atualizar Jogador
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerId || !newPlayerName) return;
    setPlayerMessage("");

    try {
      const isEditing = Boolean(editingPlayerId);
      const url = "/api/admin/players";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newPlayerId,
          nome: newPlayerName,
          categoria: newPlayerCategory,
        }),
      });

      if (res.ok) {
        setPlayers((prev) => [
          ...prev.filter((p) => p.id !== newPlayerId),
          { id: newPlayerId, nome: newPlayerName, categoria: newPlayerCategory },
        ]);
        setPlayerMessage(isEditing ? "✅ Jogador atualizado com sucesso!" : "✅ Jogador cadastrado com sucesso!");
        if (isEditing) {
          setEditingPlayerId(null);
        }
        setNewPlayerId("");
        setNewPlayerName("");
      } else {
        const data = await res.json();
        setPlayerMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setPlayerMessage(`❌ Erro: ${err.message}`);
    }
  };

  // Excluir Jogador
  const handleDeletePlayer = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o jogador "${nome}" (ID: ${id})?`)) return;
    try {
      const res = await fetch(`/api/admin/players?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        if (editingPlayerId === id) {
          handleCancelEditPlayer();
        }
        setPlayerMessage("✅ Jogador excluído com sucesso!");
      }
    } catch (err: any) {
      setPlayerMessage(`❌ Erro ao excluir: ${err.message}`);
    }
  };

  // Selecionar Deck para Edição
  const handleSelectDeckToEdit = (d: any) => {
    setEditingDeckId(d.id);
    setEditingDeckOriginalName(d.nome);
    setNewDeckName(d.nome);
    setNewDeckEnergy(d.tipoEnergia || "fire");
    setNewDeckImage(d.imagem || "");
    setNewDeckLimitless(d.limitless || "");
    setDeckMessage("");
  };

  const handleCancelEditDeck = () => {
    setEditingDeckId(null);
    setEditingDeckOriginalName(null);
    setNewDeckName("");
    setNewDeckEnergy("fire");
    setNewDeckImage("");
    setNewDeckLimitless("");
    setDeckMessage("");
  };

  // Salvar/Atualizar Deck
  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName) return;
    setDeckMessage("");

    try {
      const isEditing = Boolean(editingDeckId);
      const url = "/api/admin/decks";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDeckId,
          nome: newDeckName,
          tipoEnergia: newDeckEnergy,
          imagem: newDeckImage || null,
          limitless: newDeckLimitless || null,
        }),
      });

      if (res.ok) {
        setDecks((prev) => [
          ...prev.filter((d) => d.id !== editingDeckId && d.nome.toLowerCase() !== newDeckName.toLowerCase()),
          {
            id: editingDeckId || Date.now(),
            nome: newDeckName,
            tipoEnergia: newDeckEnergy,
            imagem: newDeckImage,
            limitless: newDeckLimitless,
          },
        ]);
        setDeckMessage(isEditing ? "✅ Deck atualizado com sucesso!" : "✅ Deck cadastrado com sucesso!");
        if (isEditing) {
          handleCancelEditDeck();
        } else {
          setNewDeckName("");
          setNewDeckImage("");
          setNewDeckLimitless("");
        }
      } else {
        const data = await res.json();
        setDeckMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setDeckMessage(`❌ Erro: ${err.message}`);
    }
  };

  // Excluir Deck
  const handleDeleteDeck = async (d: any) => {
    if (!confirm(`Tem certeza que deseja excluir o arquétipo "${d.nome}"?`)) return;
    try {
      const res = await fetch(`/api/admin/decks?id=${d.id}&nome=${encodeURIComponent(d.nome)}`, { method: "DELETE" });
      if (res.ok) {
        setDecks((prev) => prev.filter((item) => item.id !== d.id));
        if (editingDeckId === d.id) {
          handleCancelEditDeck();
        }
        setDeckMessage("✅ Deck excluído com sucesso!");
      }
    } catch (err: any) {
      setDeckMessage(`❌ Erro ao excluir: ${err.message}`);
    }
  };

  // Selecionar Evento para Edição
  const handleSelectCalToEdit = (ev: any) => {
    setEditingCalId(ev.id);
    setNewCalDate(ev.data);
    setNewCalEvento(ev.evento);
    setNewCalLocal(ev.local || "Livraria Atlântica +");
    setNewCalHorario(ev.horario || "14:00");
    setNewCalStatus(ev.status || "confirmado");
    setNewCalLinkMaps(ev.linkMaps || "https://maps.google.com");
    setNewCalLinkInscricao(ev.linkInscricao || "");
    setCalendarMessage("");
  };

  const handleCancelEditCal = () => {
    setEditingCalId(null);
    setNewCalDate(new Date().toISOString().split("T")[0]);
    setNewCalEvento("");
    setNewCalLinkInscricao("");
    setCalendarMessage("");
  };

  // Salvar/Atualizar Evento no Calendário
  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalDate || !newCalEvento) return;
    setCalendarMessage("");

    try {
      const isEditing = Boolean(editingCalId);
      const res = await fetch("/api/admin/calendar", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCalId,
          data: newCalDate,
          evento: newCalEvento,
          local: newCalLocal,
          horario: newCalHorario,
          status: newCalStatus,
          linkMaps: newCalLinkMaps,
          linkInscricao: newCalLinkInscricao,
        }),
      });

      const data = await res.json();
      if (res.ok && data.event) {
        setCalendarEvents((prev) => [
          ...prev.filter((ev) => ev.id !== (editingCalId || data.event.id)),
          data.event,
        ]);
        setCalendarMessage(isEditing ? "✅ Evento atualizado!" : "✅ Evento adicionado!");
        handleCancelEditCal();
      } else {
        setCalendarMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setCalendarMessage(`❌ Erro: ${err.message}`);
    }
  };

  // Excluir Evento do Calendário
  const handleDeleteCalendarEvent = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este evento do calendário?")) return;
    try {
      const res = await fetch(`/api/admin/calendar?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCalendarEvents((prev) => prev.filter((ev) => ev.id !== id));
        if (editingCalId === id) {
          handleCancelEditCal();
        }
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
    }
  };

  // Salvar Todas as Configurações Globais
  const handleSaveAllConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigMessage("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: {
            nomeLiga,
            temporadaAtual,
            avisoTopo,
            linkWhatsApp,
            linkInstagram,
            chavePix,
            adminPin,
            statusTemporada,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setConfigMessage("✅ Configurações salvas e aplicadas com sucesso!");
      } else {
        setConfigMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setConfigMessage(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Executar Fechamento de Temporada
  const handleExecuteSeasonClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (closureConfirmText.trim().toUpperCase() !== `ENCERRAR TEMPORADA ${closureCurrentSeason}`) {
      setClosureMessage(`❌ Para confirmar com segurança, digite exatamente "ENCERRAR TEMPORADA ${closureCurrentSeason}".`);
      return;
    }
    setClosureLoading(true);
    setClosureMessage("");

    try {
      const res = await fetch("/api/admin/season-closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSeason: closureCurrentSeason,
          nextSeason: closureNextSeason,
          campeaoNome: closureCampeao,
          viceNome: closureVice,
          deckCampeao: closureDeck,
          dataFechamento: closureDate,
          resetCurrentRankings: closureResetRanking,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setClosureSuccess(true);
        setClosureMessage(`✅ ${data.message}`);
        setTemporadaAtual(String(closureNextSeason));
        setNomeLiga(initialConfig.nomeLiga || "Liga Atlântica TCG");
      } else {
        setClosureMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setClosureMessage(`❌ Erro ao encerrar temporada: ${err.message}`);
    } finally {
      setClosureLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Topo do Painel com Botão de Logout */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Shield className="h-4 w-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Painel do Organizador</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão oficial de etapas TOM, ranking consolidado, metagame, calendário e configurações globais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-900/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
        <button
          onClick={() => setActiveTab("tdf")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tdf"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Publicar TDF</span>
        </button>
        <button
          onClick={() => setActiveTab("jogadores")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "jogadores"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Jogadores</span>
        </button>
        <button
          onClick={() => setActiveTab("decks")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "decks"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Metagame</span>
        </button>
        <button
          onClick={() => setActiveTab("calendario")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "calendario"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Calendário & Eventos</span>
        </button>
        <button
          onClick={() => setActiveTab("inscricoes")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "inscricoes"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Inscrições & Decklists ({decklists.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "config"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Configurações Globais</span>
        </button>
        <button
          onClick={() => setActiveTab("fechamento")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === "fechamento"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "text-amber-400 hover:text-white hover:bg-amber-500/10 border border-amber-500/20"
          }`}
        >
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span>Fechador de Temporada</span>
        </button>
      </div>

      {/* 1. ABA TDF / ETAPAS */}
      {activeTab === "tdf" && (
        <div className="space-y-6">
          {/* Box de Upload */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Importar Arquivo Oficial TOM (.tdf)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suporta arquivos TOM XML (`.tdf`) e TSV exportados pelo Tournament Operations Manager
                </p>
              </div>

              <label className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Selecionar TDF</span>
                <input
                  type="file"
                  accept=".tdf,.txt,.tsv"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Seleção do Tipo de Evento */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tipo do Evento & Multiplicador de Pontuação:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Liga")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    stageType === "Liga"
                      ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Flame className="h-5 w-5 mb-1 text-blue-400" />
                  <span className="text-xs font-black text-white">Etapa Regular</span>
                  <span className="text-[10px] text-blue-300 font-semibold">1.0x (Padrão)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Challenge")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    stageType === "Challenge"
                      ? "border-amber-500 bg-amber-600/20 text-white shadow-lg shadow-amber-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Trophy className="h-5 w-5 mb-1 text-amber-400" />
                  <span className="text-xs font-black text-white">League Challenge</span>
                  <span className="text-[10px] text-amber-300 font-semibold">1.5x (Fixo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Cup")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    stageType === "Cup"
                      ? "border-yellow-500 bg-yellow-600/20 text-white shadow-lg shadow-yellow-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Trophy className="h-5 w-5 mb-1 text-yellow-400" />
                  <span className="text-xs font-black text-white">League Cup</span>
                  <span className="text-[10px] text-yellow-300 font-semibold">1.5x (Fixo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Especial")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    stageType === "Especial"
                      ? "border-purple-500 bg-purple-600/20 text-white shadow-lg shadow-purple-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Sparkles className="h-5 w-5 mb-1 text-purple-400" />
                  <span className="text-xs font-black text-white">Sessão Especial</span>
                  <span className="text-[10px] text-purple-300 font-semibold">1.0x (Ajustável)</span>
                </button>
              </div>
            </div>

            {/* Configurações da Etapa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Data da Etapa:
                </label>
                <input
                  type="date"
                  value={stageDate}
                  onChange={(e) => setStageDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Multiplicador Aplicado:
                </label>
                <div className="flex h-10 items-center justify-between rounded-xl border border-white/10 bg-slate-800/80 px-3 text-xs font-black text-amber-400">
                  <span>{stageType}</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 border border-amber-500/30">
                    {multiplier}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Jogadores Não Reconhecidos / Alerta */}
          {unresolvedPlayers.length > 0 && (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h4 className="font-bold text-sm">
                  {unresolvedPlayers.length} jogador(es) no arquivo TDF não cadastrados no banco:
                </h4>
              </div>
              <p className="text-xs text-slate-300">
                Cadastre-os rapidamente abaixo para vinculá-los ao histórico da Liga e garantir a pontuação correta:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {unresolvedPlayers.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{p.jogador}</p>
                      <p className="text-[10px] text-slate-400 tabular-nums">ID: {p.id || "Gerar auto"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickRegisterPlayer(p)}
                      className="rounded-xl bg-amber-500 px-3 py-1.5 text-[10px] font-black text-slate-950 hover:bg-amber-400 transition-colors shadow"
                    >
                      Cadastrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prévia da Tabela de Resultados TDF */}
          {parsedRows.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    Resultados Processados ({parsedRows.length} Atletas)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Defina o deck utilizado por cada jogador antes de publicar a etapa
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishStage}
                  disabled={isPublishing}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isPublishing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Publicar Etapa & Atualizar Ranking</span>
                </button>
              </div>

              {publishMessage && (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  {publishMessage}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-white/10 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-3 pl-4 text-center w-12">Pos</th>
                      <th className="py-3 px-3">Jogador</th>
                      <th className="py-3 px-3">POP ID</th>
                      <th className="py-3 px-3 text-center">Score (V-D-E)</th>
                      <th className="py-3 px-3 text-center">Pontos</th>
                      <th className="py-3 pr-4">Deck Utilizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 pl-4 text-center font-bold text-white tabular-nums">{row.colocacao}º</td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {resolvedNamesMap[row.jogador] || row.jogador}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums font-semibold text-slate-400">{row.id || "—"}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-300">
                          {row.vitorias}-{row.derrotas}-{row.empates}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-amber-400">
                          {Math.round(row.pontos * multiplier)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <select
                            value={row.deckNome || "Não registrado"}
                            onChange={(e) => handlePlayerDeckChange(idx, e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-slate-800 py-1.5 px-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="Não registrado">Não registrado</option>
                            {decks.map((d) => (
                              <option key={d.id} value={d.nome}>
                                {d.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. ABA JOGADORES */}
      {activeTab === "jogadores" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`rounded-3xl border ${editingPlayerId ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-slate-900/60"} p-6 backdrop-blur-xl shadow-xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {editingPlayerId ? (
                  <>
                    <Pencil className="h-4 w-4 text-amber-400" /> Editar Jogador
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-emerald-400" /> Cadastrar Jogador
                  </>
                )}
              </h3>
              {editingPlayerId && (
                <button
                  type="button"
                  onClick={handleCancelEditPlayer}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg cursor-pointer"
                >
                  <X className="h-3 w-3" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSavePlayer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  POP ID / TOM ID:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5685779"
                  value={newPlayerId}
                  onChange={(e) => setNewPlayerId(e.target.value)}
                  disabled={Boolean(editingPlayerId)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs tabular-nums font-semibold text-white focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Henrique"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Categoria:
                </label>
                <select
                  value={newPlayerCategory}
                  onChange={(e) => setNewPlayerCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Master">Master</option>
                  <option value="Senior">Senior</option>
                  <option value="Junior">Junior</option>
                </select>
              </div>

              {playerMessage && <p className="text-xs font-bold text-emerald-400">{playerMessage}</p>}

              <button
                type="submit"
                className={`w-full rounded-xl py-2.5 text-xs font-black text-white transition-colors shadow-md cursor-pointer ${
                  editingPlayerId
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
                }`}
              >
                {editingPlayerId ? "Salvar Alterações" : "Cadastrar Jogador"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Jogadores Cadastrados ({players.length})
                </h3>
                <p className="text-[11px] text-slate-400">Clique em qualquer jogador ou no botão para editar</p>
              </div>
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-800 py-1.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto max-h-96 rounded-xl border border-white/10 bg-slate-950/80">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-2.5 pl-3">Nome</th>
                    <th className="px-3 py-2.5">POP ID</th>
                    <th className="px-3 py-2.5 text-center">Categoria</th>
                    <th className="py-2.5 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {players
                    .filter(
                      (p) =>
                        p.nome.toLowerCase().includes(playerSearch.toLowerCase()) ||
                        p.id.includes(playerSearch)
                    )
                    .map((p) => {
                      const isBeingEdited = editingPlayerId === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => handleSelectPlayerToEdit(p)}
                          className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isBeingEdited ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                          }`}
                        >
                          <td className="py-2 pl-3 font-bold text-white flex items-center gap-2">
                            <span>{p.nome}</span>
                            {isBeingEdited && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                Editando
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 tabular-nums font-semibold text-slate-400">{p.id}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {p.categoria}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSelectPlayerToEdit(p)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Editar Jogador"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePlayer(p.id, p.nome)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Excluir Jogador"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ABA DECKS & META */}
      {activeTab === "decks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`rounded-3xl border ${editingDeckId ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-slate-900/60"} p-6 backdrop-blur-xl shadow-xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {editingDeckId ? (
                  <>
                    <Pencil className="h-4 w-4 text-amber-400" /> Editar Arquétipo
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-amber-400" /> Cadastrar Arquétipo
                  </>
                )}
              </h3>
              {editingDeckId && (
                <button
                  type="button"
                  onClick={handleCancelEditDeck}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg cursor-pointer"
                >
                  <X className="h-3 w-3" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveDeck} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nome do Deck:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dragapult Ex"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Tipo de Energia:
                </label>
                <select
                  value={newDeckEnergy}
                  onChange={(e) => setNewDeckEnergy(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 capitalize"
                >
                  <option value="grass">Planta (Grass)</option>
                  <option value="fire">Fogo (Fire)</option>
                  <option value="water">Água (Water)</option>
                  <option value="lightning">Elétrico (Lightning)</option>
                  <option value="psychic">Psíquico (Psychic)</option>
                  <option value="fighting">Lutador (Fighting)</option>
                  <option value="darkness">Noturno (Darkness)</option>
                  <option value="metal">Metálico (Metal)</option>
                  <option value="dragon">Dragão (Dragon)</option>
                  <option value="colorless">Incolor (Colorless)</option>
                  <option value="fire+psychic">Fogo + Psíquico (Dual)</option>
                  <option value="darkness+fire">Noturno + Fogo (Dual)</option>
                  <option value="lightning+colorless">Elétrico + Incolor (Dual)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  URL da Imagem da Carta:
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newDeckImage}
                  onChange={(e) => setNewDeckImage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Link Limitless TCG:
                </label>
                <input
                  type="url"
                  placeholder="https://limitlesstcg.com/decks/..."
                  value={newDeckLimitless}
                  onChange={(e) => setNewDeckLimitless(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              {deckMessage && <p className="text-xs font-bold text-emerald-400">{deckMessage}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-500 transition-colors shadow-md shadow-amber-600/30 cursor-pointer"
              >
                {editingDeckId ? "Salvar Alterações" : "Salvar Arquétipo"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  Catálogo de Decks Cadastrados ({decks.length})
                </h3>
                <p className="text-[11px] text-slate-400">Clique em qualquer arquétipo ou no botão para editar</p>
              </div>
              <input
                type="text"
                placeholder="Buscar deck..."
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-800 py-1.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto max-h-96 rounded-xl border border-white/10 bg-slate-950/80">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-2.5 pl-3">Deck</th>
                    <th className="px-3 py-2.5">Energia</th>
                    <th className="px-3 py-2.5 text-right">Limitless</th>
                    <th className="py-2.5 pr-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {decks
                    .filter((d) => d.nome.toLowerCase().includes(deckSearch.toLowerCase()))
                    .map((d) => {
                      const isBeingEdited = editingDeckId === d.id;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => handleSelectDeckToEdit(d)}
                          className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isBeingEdited ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                          }`}
                        >
                          <td className="py-2 pl-3 font-bold text-white flex items-center gap-2">
                            {d.imagem && (
                              <img src={d.imagem} alt={d.nome} className="h-6 w-6 object-contain rounded" />
                            )}
                            <span>{d.nome}</span>
                          </td>
                          <td className="px-3 py-2">
                            <EnergyBadge energyRaw={d.tipoEnergia} size="sm" />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {d.limitless && d.limitless !== "#" ? (
                              <a
                                href={d.limitless}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1"
                              >
                                <span>Ver</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSelectDeckToEdit(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Editar Arquétipo"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDeck(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Excluir Arquétipo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA CALENDÁRIO & EVENTOS */}
      {activeTab === "calendario" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`rounded-3xl border ${editingCalId ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-slate-900/60"} p-6 backdrop-blur-xl shadow-xl space-y-4`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                {editingCalId ? (
                  <>
                    <Pencil className="h-4 w-4 text-amber-400" /> Editar Evento
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 text-blue-400" /> Adicionar Evento Futuro
                  </>
                )}
              </h3>
              {editingCalId && (
                <button
                  type="button"
                  onClick={handleCancelEditCal}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg cursor-pointer"
                >
                  <X className="h-3 w-3" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Data do Evento:
                </label>
                <input
                  type="date"
                  value={newCalDate}
                  onChange={(e) => setNewCalDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nome do Torneio:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Etapa #4 - Liga Regular"
                  value={newCalEvento}
                  onChange={(e) => setNewCalEvento(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Horário:
                  </label>
                  <input
                    type="text"
                    placeholder="14:00"
                    value={newCalHorario}
                    onChange={(e) => setNewCalHorario(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Status:
                  </label>
                  <select
                    value={newCalStatus}
                    onChange={(e) => setNewCalStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Local:
                </label>
                <input
                  type="text"
                  placeholder="Livraria Atlântica +"
                  value={newCalLocal}
                  onChange={(e) => setNewCalLocal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Link Google Maps:
                </label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={newCalLinkMaps}
                  onChange={(e) => setNewCalLinkMaps(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Link de Inscrição / WhatsApp:
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={newCalLinkInscricao}
                  onChange={(e) => setNewCalLinkInscricao(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {calendarMessage && (
                <p className="text-xs font-bold text-emerald-400">{calendarMessage}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30 cursor-pointer"
              >
                {editingCalId ? "Salvar Alterações" : "Salvar Evento"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Eventos no Calendário ({calendarEvents.length})
            </h3>

            <div className="overflow-y-auto max-h-96 space-y-3">
              {calendarEvents.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">Nenhum evento agendado no calendário.</p>
              ) : (
                calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-slate-950/80 hover:bg-slate-800/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase">
                          {ev.data}
                        </span>
                        <h4 className="text-xs font-black text-white">{ev.evento}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ev.horario || "14:00"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ev.local || "Livraria Atlântica +"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectCalToEdit(ev)}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Editar Evento"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCalendarEvent(ev.id)}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        title="Excluir Evento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA INSCRIÇÕES & DECKLISTS SUBMETIDAS */}
      {activeTab === "inscricoes" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-400" /> Decklists Oficiais Submetidas ({decklists.length})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Decklists de 60 cartas enviadas pelos jogadores no Portal do Treinador para check-in no TOM
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar jogador, ID ou deck..."
                  value={decklistSearch}
                  onChange={(e) => setDecklistSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Lista de Decklists */}
            {decklists.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma decklist foi submetida pelos jogadores até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-white/10 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-3 pl-4">Jogador / POP ID</th>
                      <th className="py-3 px-3">Deck & Arquétipo</th>
                      <th className="py-3 px-3">Evento / Data</th>
                      <th className="py-3 px-3 text-center">Cartas</th>
                      <th className="py-3 pr-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {decklists
                      .filter((dl) => {
                        if (!decklistSearch.trim()) return true;
                        const query = decklistSearch.toLowerCase();
                        return (
                          dl.jogadorNome?.toLowerCase().includes(query) ||
                          dl.jogadorId?.toLowerCase().includes(query) ||
                          dl.deckNome?.toLowerCase().includes(query)
                        );
                      })
                      .map((dl) => (
                        <tr key={dl.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pl-4">
                            <div className="font-bold text-white">{dl.jogadorNome}</div>
                            <div className="text-[11px] tabular-nums font-semibold text-slate-400">POP ID: {dl.jogadorId}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <EnergyBadge energyRaw={dl.tipoEnergia || "colorless"} size="sm" />
                              <span className="font-medium text-slate-200">{dl.deckNome}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-400">
                            <div>{dl.eventoNome || "Etapa Oficial"}</div>
                            <div className="tabular-nums text-[11px] text-slate-500">{dl.etapaData}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-400 tabular-nums">
                            {dl.totalCartas || 60} / 60
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewDecklist(dl)}
                                className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-all cursor-pointer"
                                title="Ver lista completa"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(dl.decklistRaw);
                                  setCopiedDecklistId(dl.id);
                                  setTimeout(() => setCopiedDecklistId(null), 2000);
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
                                title="Copiar formato TCG Live / Limitless"
                              >
                                {copiedDecklistId === dl.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de Pré-visualização de Decklist */}
          {previewDecklist && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-base font-black text-white">{previewDecklist.jogadorNome}</h4>
                    <p className="text-xs text-slate-400">
                      {previewDecklist.deckNome} • POP ID: <strong className="tabular-nums font-bold text-slate-200">{previewDecklist.jogadorId}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewDecklist(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <pre className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {previewDecklist.decklistRaw}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-slate-400">
                    Total: <strong className="text-white">{previewDecklist.totalCartas || 60} cartas</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(previewDecklist.decklistRaw);
                        setCopiedDecklistId(previewDecklist.id);
                        setTimeout(() => setCopiedDecklistId(null), 2000);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                    >
                      {copiedDecklistId === previewDecklist.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Decklist Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Decklist Completa</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setPreviewDecklist(null)}
                      className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ABA CONFIGURAÇÕES GLOBAIS */}
      {activeTab === "config" && (
        <div className="max-w-3xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" /> Parâmetros Globais do Site
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Edite as identidades visuais, mensagens de aviso, redes sociais e senhas administrativas
            </p>
          </div>

          <form onSubmit={handleSaveAllConfig} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome Oficial da Liga:
                </label>
                <input
                  type="text"
                  value={nomeLiga}
                  onChange={(e) => setNomeLiga(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Número da Temporada Ativa:
                </label>
                <input
                  type="text"
                  value={temporadaAtual}
                  onChange={(e) => setTemporadaAtual(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Faixa de Aviso do Topo (Marquee/Banner):
              </label>
              <input
                type="text"
                placeholder="Ex: ⚡ Inscrições abertas para o League Challenge deste sábado!"
                value={avisoTopo}
                onChange={(e) => setAvisoTopo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Link do Grupo do WhatsApp:
                </label>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/..."
                  value={linkWhatsApp}
                  onChange={(e) => setLinkWhatsApp(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Link do Instagram Oficial:
                </label>
                <input
                  type="text"
                  placeholder="https://instagram.com/ligaatlantica"
                  value={linkInstagram}
                  onChange={(e) => setLinkInstagram(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Chave PIX / Instruções:
                </label>
                <input
                  type="text"
                  placeholder="Ex: liga@pix.com.br ou CNPJ"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  PIN de Acesso Admin:
                </label>
                <input
                  type="text"
                  placeholder="1234"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs tabular-nums font-semibold text-white focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status da Temporada:
              </label>
              <select
                value={statusTemporada}
                onChange={(e) => setStatusTemporada(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ativa">Ativa (Online e pontuando)</option>
                <option value="congelada">Congelada (Pódio final fixado)</option>
                <option value="offseason">Off-Season (Fora de Temporada)</option>
              </select>
            </div>

            {configMessage && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                {configMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingConfig}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-black text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSavingConfig ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Salvar Todas as Configurações</span>
            </button>
          </form>
        </div>
      )}

      {/* 6. ABA FECHADOR DE TEMPORADA */}
      {activeTab === "fechamento" && (
        <div className="max-w-3xl rounded-3xl border border-amber-500/30 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Trophy className="h-6 w-6" />
              <h3 className="text-xl font-black text-white">Fechador de Temporadas & Virada Oficial</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Transponha o ranking final da <strong>Temporada {closureCurrentSeason}</strong> para a memória histórica de <em>Scores Antigos</em>, coroe o Campeão no <em>Hall da Fama</em> e abra a nova <strong>Temporada {closureNextSeason}</strong> mantendo 100% dos Decks e Jogadores salvos.
            </p>
          </div>

          {closureMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                closureSuccess
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {closureMessage}
            </div>
          )}

          <form onSubmit={handleExecuteSeasonClosure} className="space-y-5">
            {/* Linha das Temporadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-400">
                  Temporada Atual a Encerrar:
                </label>
                <input
                  type="number"
                  value={closureCurrentSeason}
                  onChange={(e) => setClosureCurrentSeason(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  O ranking consolidado desta temporada será arquivado com a colocação final de cada participante.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-emerald-400">
                  Nova Temporada a Iniciar:
                </label>
                <input
                  type="number"
                  value={closureNextSeason}
                  onChange={(e) => setClosureNextSeason(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  A temporada do site passará a ser a #{closureNextSeason} em todas as telas e cabeçalhos.
                </p>
              </div>
            </div>

            {/* Dados do Campeão a Coroar */}
            <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Dados do Campeão & Vice para o Hall da Fama:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Nome do Campeão (1º Lugar):
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (detecta do ranking)"
                    value={closureCampeao}
                    onChange={(e) => setClosureCampeao(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Nome do Vice-Campeão (2º Lugar):
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (detecta do ranking)"
                    value={closureVice}
                    onChange={(e) => setClosureVice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Deck do Campeão:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dragapult Ex"
                    value={closureDeck}
                    onChange={(e) => setClosureDeck(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Data Oficial do Fechamento:
                </label>
                <input
                  type="date"
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Checkbox de Reset */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
              <input
                type="checkbox"
                id="resetRank"
                checked={closureResetRanking}
                onChange={(e) => setClosureResetRanking(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="resetRank" className="text-xs text-slate-300 select-none cursor-pointer">
                <strong>Zerar ranking consolidado ativo</strong> para a Temporada {closureNextSeason} (os dados históricos ficam salvos com segurança em <em>Scores Antigos</em>).
              </label>
            </div>

            {/* Campo de Segurança com Texto de Confirmação */}
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-rose-300">
                Confirmação de Segurança (Obrigatório):
              </label>
              <p className="text-[11px] text-slate-300">
                Para evitar cliques acidentais, digite exatamente <code className="text-rose-400 font-black bg-slate-900 px-1.5 py-0.5 rounded">ENCERRAR TEMPORADA {closureCurrentSeason}</code> no campo abaixo:
              </p>
              <input
                type="text"
                placeholder={`Digite "ENCERRAR TEMPORADA ${closureCurrentSeason}"`}
                value={closureConfirmText}
                onChange={(e) => setClosureConfirmText(e.target.value)}
                className="w-full rounded-xl border border-rose-500/40 bg-slate-950 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-rose-400 font-sans"
                required
              />
            </div>

            <button
              type="submit"
              disabled={closureLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:from-amber-500 hover:to-rose-500 transition-all shadow-xl shadow-amber-600/30 disabled:opacity-50 cursor-pointer"
            >
              {closureLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
              <span>Encerrar Temporada {closureCurrentSeason} & Abrir Temporada {closureNextSeason}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
