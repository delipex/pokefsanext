"use client";

import { useState, useMemo, useEffect } from "react";
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
  Database,
  BarChart3,
  Search,
  ChevronRight,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";
import { parseTDFContent, ParsedPlayerRow } from "@/lib/tdf-parser";
import { AdminEtapasManager } from "./AdminEtapasManager";
import { AdminInscricoesPremier } from "./AdminInscricoesPremier";
import { AdminTemporadasManager } from "./AdminTemporadasManager";
import { AdminAuditoria } from "./AdminAuditoria";
import { AdminRegrasManager } from "./AdminRegrasManager";

interface AdminDashboardProps {
  initialPlayers: any[];
  initialDecks: any[];
  initialConfig: Record<string, any>;
  initialCalendar?: any[];
  initialDecklists?: any[];
  initialEtapas?: any[];
  initialChampions?: any[];
  initialScoresAntigos?: any[];
}

export function AdminDashboard({
  initialPlayers,
  initialDecks,
  initialConfig,
  initialCalendar = [],
  initialDecklists = [],
  initialEtapas = [],
  initialChampions = [],
  initialScoresAntigos = [],
}: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "tdf" | "etapas" | "jogadores" | "decks" | "metagame" | "inscricoes" | "temporadas" | "calendario" | "config"
  >("tdf");

  // Estado de Metagame por Etapa
  const [adminEtapas, setAdminEtapas] = useState<any[]>(initialEtapas);
  const [selectedMetaStageDate, setSelectedMetaStageDate] = useState<string>(
    initialEtapas[0]?.data || ""
  );
  const [metaPlayerSearch, setMetaPlayerSearch] = useState<string>("");
  const [stageDecksMap, setStageDecksMap] = useState<Record<string, string>>({});
  const [isSavingMeta, setIsSavingMeta] = useState<boolean>(false);
  const [metaSaveMessage, setMetaSaveMessage] = useState<string>("");
  const [metaSaveSuccess, setMetaSaveSuccess] = useState<boolean>(false);

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
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);
  const [editingDeckOriginalName, setEditingDeckOriginalName] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckEnergy, setNewDeckEnergy] = useState("colorless");
  const [selectedEnergies, setSelectedEnergies] = useState<string[]>(["colorless"]);
  const [newDeckImage, setNewDeckImage] = useState("");
  const [newDeckIcone, setNewDeckIcone] = useState("");
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
  const [exibirBannerAvisoTopo, setExibirBannerAvisoTopo] = useState(
    initialConfig.exibirBannerAvisoTopo !== "false" && !!initialConfig.avisoTopo
  );
  const [linkWhatsApp, setLinkWhatsApp] = useState(initialConfig.linkWhatsApp || "");
  const [linkInstagram, setLinkInstagram] = useState(initialConfig.linkInstagram || "");
  const [linkTwitch, setLinkTwitch] = useState(initialConfig.linkTwitch || "");
  const [linkYouTube, setLinkYouTube] = useState(initialConfig.linkYouTube || "");
  const [chavePix, setChavePix] = useState(initialConfig.chavePix || "");
  const [adminPin, setAdminPin] = useState(initialConfig.adminPin || "1234");
  const [statusTemporada, setStatusTemporada] = useState(initialConfig.statusTemporada || "ativa");

  // Controles dos Módulos da Home
  const [exibirCarrosselDecksHome, setExibirCarrosselDecksHome] = useState(
    initialConfig.exibirCarrosselDecksHome !== "false"
  );
  const [velocidadeCarrossel, setVelocidadeCarrossel] = useState(
    initialConfig.velocidadeCarrossel || "-28"
  );
  const [exibirPodioHome, setExibirPodioHome] = useState(
    initialConfig.exibirPodioHome !== "false"
  );
  const [exibirProximoEventoHome, setExibirProximoEventoHome] = useState(
    initialConfig.exibirProximoEventoHome !== "false"
  );
  const [exibirPremiacoesHome, setExibirPremiacoesHome] = useState(
    initialConfig.exibirPremiacoesHome !== "false"
  );

  // Controles Globais
  const [exibirPortalAtleta, setExibirPortalAtleta] = useState(
    initialConfig.exibirPortalAtleta !== "false"
  );

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
    const pId = String(p.id || p.ID || "");
    const pName = String(p.nome || p.jogador || p.Jogador || "");
    const pCat = p.categoria || p.Categoria || "Master";
    setEditingPlayerId(pId);
    setNewPlayerId(pId);
    setNewPlayerName(pName);
    setNewPlayerCategory(pCat);
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
  const ENERGY_OPTIONS = [
    { id: "grass", label: "Planta", hex: "#78C850", glow: "rgba(120, 200, 80, 0.5)" },
    { id: "fire", label: "Fogo", hex: "#FF4216", glow: "rgba(255, 66, 22, 0.5)" },
    { id: "water", label: "Água", hex: "#00B4D8", glow: "rgba(0, 180, 216, 0.5)" },
    { id: "lightning", label: "Elétrico", hex: "#EBC816", glow: "rgba(235, 200, 22, 0.5)" },
    { id: "psychic", label: "Psíquico", hex: "#D94293", glow: "rgba(217, 66, 147, 0.5)" },
    { id: "fighting", label: "Lutador", hex: "#C55E13", glow: "rgba(197, 94, 19, 0.5)" },
    { id: "darkness", label: "Escuridão", hex: "#1B4958", glow: "rgba(27, 73, 88, 0.6)" },
    { id: "metal", label: "Metal", hex: "#7E8E9E", glow: "rgba(126, 142, 158, 0.5)" },
    { id: "dragon", label: "Dragão", hex: "#C99B22", glow: "rgba(201, 155, 34, 0.5)" },
    { id: "colorless", label: "Incolor", hex: "#94A3B8", glow: "rgba(148, 163, 184, 0.4)" },
    {
      id: "multi",
      label: "Multi",
      hex: "#FF4216",
      isRainbow: true,
      bgGradient:
        "conic-gradient(from 180deg at 50% 50%, #FF4216 0deg, #EBC816 60deg, #78C850 120deg, #00B4D8 180deg, #1B4958 240deg, #D94293 300deg, #FF4216 360deg)",
      glow: "rgba(255, 203, 5, 0.6)",
    },
  ];

  const handleToggleEnergy = (energyId: string) => {
    if (energyId === "multi") {
      setSelectedEnergies(["multi"]);
      setNewDeckEnergy("multi");
      return;
    }
    if (energyId === "colorless") {
      setSelectedEnergies(["colorless"]);
      setNewDeckEnergy("colorless");
      return;
    }

    let current = selectedEnergies.filter((e) => e !== "multi" && e !== "colorless");

    if (current.includes(energyId)) {
      current = current.filter((e) => e !== energyId);
      if (current.length === 0) current = ["colorless"];
    } else {
      if (current.length >= 2) {
        current = [current[1], energyId];
      } else {
        current.push(energyId);
      }
    }

    setSelectedEnergies(current);
    setNewDeckEnergy(current.join("+"));
  };

  const handleClearEnergy = () => {
    setSelectedEnergies(["colorless"]);
    setNewDeckEnergy("colorless");
  };

  const handleSelectDeckToEdit = (d: any) => {
    setEditingDeckId(d.id);
    setEditingDeckOriginalName(d.nome);
    setNewDeckName(d.nome);
    const energy = d.tipoEnergia || "colorless";
    setNewDeckEnergy(energy);
    if (energy === "multi" || energy === "rainbow") {
      setSelectedEnergies(["multi"]);
    } else if (energy === "colorless") {
      setSelectedEnergies(["colorless"]);
    } else {
      const parts = energy.replace(/[\/,]/g, "+").split("+").map((p: string) => p.trim()).filter(Boolean);
      setSelectedEnergies(parts.length > 0 ? parts : ["colorless"]);
    }
    setNewDeckImage(d.imagem || "");
    setNewDeckIcone(d.icone || "");
    setNewDeckLimitless(d.limitless || "");
    setDeckMessage("");
    setIsDeckModalOpen(true);
  };

  const handleOpenNewDeckModal = () => {
    handleCancelEditDeck();
    setIsDeckModalOpen(true);
  };

  const handleCloseDeckModal = () => {
    handleCancelEditDeck();
    setIsDeckModalOpen(false);
  };

  const handleCancelEditDeck = () => {
    setEditingDeckId(null);
    setEditingDeckOriginalName(null);
    setNewDeckName("");
    setNewDeckEnergy("colorless");
    setSelectedEnergies(["colorless"]);
    setNewDeckImage("");
    setNewDeckIcone("");
    setNewDeckLimitless("");
    setDeckMessage("");
    setIsDeckModalOpen(false);
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
          tipoEnergia: newDeckEnergy || "colorless",
          imagem: newDeckImage || null,
          icone: newDeckIcone || null,
          limitless: newDeckLimitless || null,
        }),
      });

      if (res.ok) {
        setDecks((prev) => [
          ...prev.filter((d) => d.id !== editingDeckId && d.nome.toLowerCase() !== newDeckName.toLowerCase()),
          {
            id: editingDeckId || Date.now(),
            nome: newDeckName,
            tipoEnergia: newDeckEnergy || "colorless",
            imagem: newDeckImage,
            icone: newDeckIcone,
            limitless: newDeckLimitless,
          },
        ]);
        setDeckMessage(isEditing ? "✅ Deck atualizado com sucesso!" : "✅ Deck cadastrado com sucesso!");
        setTimeout(() => {
          handleCloseDeckModal();
        }, 700);
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

  // Sincronizar mapa de decks ao trocar a etapa selecionada no metagame
  useEffect(() => {
    if (!selectedMetaStageDate && adminEtapas.length > 0) {
      setSelectedMetaStageDate(adminEtapas[0].data);
    }
    const currentEtapa = adminEtapas.find((e) => e.data === selectedMetaStageDate);
    if (currentEtapa && currentEtapa.resultados) {
      const map: Record<string, string> = {};
      currentEtapa.resultados.forEach((r: any) => {
        map[r.jogadorNome] = r.deckNome || "Sem deck registrado";
      });
      setStageDecksMap(map);
      setMetaSaveMessage("");
    }
  }, [selectedMetaStageDate, adminEtapas]);

  // Salvar alterações de decks na etapa
  const handleSaveStageMetagame = async () => {
    if (!selectedMetaStageDate) return;
    setIsSavingMeta(true);
    setMetaSaveMessage("");

    try {
      const res = await fetch("/api/admin/metagame", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapaData: selectedMetaStageDate,
          decksMap: stageDecksMap,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMetaSaveSuccess(true);
        setMetaSaveMessage("✅ " + data.message);

        // Atualizar estado local de adminEtapas
        setAdminEtapas((prev) =>
          prev.map((e) => {
            if (e.data === selectedMetaStageDate) {
              const updatedResults = (e.resultados || []).map((r: any) => ({
                ...r,
                deckNome: stageDecksMap[r.jogadorNome] || r.deckNome,
              }));
              return {
                ...e,
                resultados: updatedResults,
                campeaoDeck: stageDecksMap[e.campeaoNome] || e.campeaoDeck,
              };
            }
            return e;
          })
        );
      } else {
        setMetaSaveSuccess(false);
        setMetaSaveMessage(`❌ Erro: ${data.error}`);
      }
    } catch (err: any) {
      setMetaSaveSuccess(false);
      setMetaSaveMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsSavingMeta(false);
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
            exibirBannerAvisoTopo: String(exibirBannerAvisoTopo),
            linkWhatsApp,
            linkInstagram,
            linkTwitch,
            linkYouTube,
            chavePix,
            adminPin,
            statusTemporada,
            exibirCarrosselDecksHome: String(exibirCarrosselDecksHome),
            velocidadeCarrossel: String(velocidadeCarrossel),
            exibirPodioHome: String(exibirPodioHome),
            exibirProximoEventoHome: String(exibirProximoEventoHome),
            exibirPremiacoesHome: String(exibirPremiacoesHome),
            exibirPortalAtleta: String(exibirPortalAtleta),
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

  // Sincronizar / Restaurar Banco de Dados Online
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncDbMessage, setSyncDbMessage] = useState("");

  const handleSyncDatabase = async () => {
    if (!confirm("Deseja sincronizar e migrar todos os dados históricos, jogadores, ranking, decks e calendário para o banco de dados online?")) return;
    setIsSyncingDb(true);
    setSyncDbMessage("");
    try {
      const res = await fetch("/api/admin/sync-db", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncDbMessage("✅ Banco de dados online sincronizado e 100% populado com sucesso!");
      } else {
        setSyncDbMessage(`❌ Erro: ${data.error || "Falha na sincronização"}`);
      }
    } catch (err: any) {
      setSyncDbMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsSyncingDb(false);
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

      {/* Navegação por Abas Segmentada & Responsiva (Design System) */}
      <div className="w-full overflow-x-auto pb-1 no-scrollbar">
        <div className="inline-flex min-w-full sm:min-w-0 items-center justify-between sm:justify-start gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("tdf")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "tdf"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Publicar TDF</span>
          </button>

          <button
            onClick={() => setActiveTab("etapas")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "etapas"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Etapas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {adminEtapas.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("jogadores")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "jogadores"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Jogadores</span>
          </button>

          <button
            onClick={() => setActiveTab("decks")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "decks"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Decks</span>
          </button>

          <button
            onClick={() => setActiveTab("metagame")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "metagame"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Metagame</span>
          </button>

          <button
            onClick={() => setActiveTab("inscricoes")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "inscricoes"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Inscrições</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "inscricoes" ? "bg-slate-900 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {decklists.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("temporadas")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "temporadas"
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30"
                : "text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Temporadas & Hall</span>
          </button>


          <button
            onClick={() => setActiveTab("calendario")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "calendario"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendário</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "config"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Config & Regras</span>
          </button>
        </div>
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

      {/* ABA GERENCIADOR DE ETAPAS */}
      {activeTab === "etapas" && (
        <AdminEtapasManager
          etapas={adminEtapas}
          onEtapasUpdated={() => {
            router.refresh();
          }}
        />
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
                    .filter((p) => {
                      const pName = String(p.nome || p.jogador || p.Jogador || "").toLowerCase();
                      const pId = String(p.id || p.ID || "").toLowerCase();
                      const q = (playerSearch || "").toLowerCase().trim();
                      return pName.includes(q) || pId.includes(q);
                    })
                    .map((p, idx) => {
                      const pId = String(p.id || p.ID || `anon-${idx + 1}`);
                      const pName = String(p.nome || p.jogador || p.Jogador || "Desconhecido");
                      const pCat = p.categoria || p.Categoria || "Master";
                      const isBeingEdited = editingPlayerId === pId;

                      return (
                        <tr
                          key={pId}
                          onClick={() => handleSelectPlayerToEdit(p)}
                          className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            isBeingEdited ? "bg-amber-500/10 border-l-2 border-amber-400" : ""
                          }`}
                        >
                          <td className="py-2 pl-3 font-bold text-white flex items-center gap-2">
                            <span>{pName}</span>
                            {isBeingEdited && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                                Editando
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 tabular-nums font-semibold text-slate-400">{pId}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                              {pCat}
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
                                onClick={() => handleDeletePlayer(pId, pName)}
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
        <div className="space-y-6">
          {/* Header com Botão de Novo Deck */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                Catálogo de Decks & Arquétipos ({decks.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cadastre e gerencie arquétipos oficiais, energias, fotos das cartas e listas do Limitless TCG.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Buscar arquétipo..."
                value={deckSearch}
                onChange={(e) => setDeckSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/80 py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-400 min-w-[200px]"
              />
              <button
                type="button"
                onClick={handleOpenNewDeckModal}
                className="flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-black text-slate-950 transition-all shadow-md shadow-amber-400/20 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar Novo Deck</span>
              </button>
            </div>
          </div>

          {/* Tabela de Decks */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
            <div className="overflow-y-auto max-h-[520px] rounded-2xl border border-white/10 bg-slate-950/80">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 z-10">
                  <tr>
                    <th className="py-3 pl-4">Deck</th>
                    <th className="px-4 py-3">Energia</th>
                    <th className="px-4 py-3 text-center">Ícone</th>
                    <th className="px-4 py-3 text-right">Limitless</th>
                    <th className="py-3 pr-4 text-right">Ações</th>
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
                          <td className="py-2.5 pl-4 font-bold text-white">
                            <div className="flex items-center gap-3">
                              {d.imagem ? (
                                <img src={d.imagem} alt={d.nome} className="h-7 w-7 object-contain rounded shrink-0 shadow-sm" />
                              ) : (
                                <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 text-xs shrink-0">🎴</span>
                              )}
                              <span className="text-sm font-bold text-white">{d.nome}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <EnergyBadge energyRaw={d.tipoEnergia} size="sm" />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {d.icone ? (
                              <img src={d.icone} alt="" className="h-6 w-6 object-contain inline-block rounded" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {d.limitless && d.limitless !== "#" ? (
                              <a
                                href={d.limitless}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 text-xs"
                              >
                                <span>Lista</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSelectDeckToEdit(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Editar Arquétipo"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDeck(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Excluir Arquétipo"
                              >
                                <Trash2 className="h-4 w-4" />
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

          {/* MODAL PERSONALIZADO DE CADASTRO / EDIÇÃO DE DECK */}
          {isDeckModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
              <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Topo / Header Fixo do Modal */}
                <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-4.5 border-b border-white/10 bg-slate-900/60 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🎴</span>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {editingDeckId ? "Editar Deck" : "Cadastrar Novo Deck"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseDeckModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Corpo do Formulário com Scroll Suave */}
                <form onSubmit={handleSaveDeck} className="flex flex-col flex-1 overflow-hidden min-h-0">
                  <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    {/* Nome Oficial do Deck */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Nome Oficial do Deck
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Charizard ex, Gardevoir ex..."
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                        required
                      />
                    </div>

                    {/* Tipo de Energia Pokémon */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Tipo de Energia Pokémon
                        </label>
                        <span className="text-[11px] text-slate-400">
                          Selecione até 2 energias (ou Multi)
                        </span>
                      </div>

                      {/* Preview Box */}
                      <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 sm:p-3.5 flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {selectedEnergies.map((eid, idx) => {
                              const opt = ENERGY_OPTIONS.find((o) => o.id === eid) || ENERGY_OPTIONS[9];
                              return (
                                <span
                                  key={idx}
                                  className="h-7 w-7 rounded-full border border-black/40 shadow-sm shrink-0"
                                  style={{
                                    background: opt.bgGradient || opt.hex,
                                    boxShadow: `0 0 10px ${opt.glow}`,
                                  }}
                                />
                              );
                            })}
                          </div>
                          <div className="min-w-0 truncate">
                            <strong className="block text-xs font-bold text-white truncate">
                              {selectedEnergies
                                .map((eid) => ENERGY_OPTIONS.find((o) => o.id === eid)?.label || eid)
                                .join(" / ")}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {newDeckEnergy || "colorless"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearEnergy}
                          className="text-[11px] font-medium text-slate-400 hover:text-white underline cursor-pointer shrink-0 ml-2"
                        >
                          Limpar
                        </button>
                      </div>

                      {/* Grid de Energias (11 botões com responsividade equilibrada) */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {ENERGY_OPTIONS.map((opt) => {
                          const isSelected = selectedEnergies.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleToggleEnergy(opt.id)}
                              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl py-2 px-2 sm:px-2.5 text-xs font-semibold transition-all border cursor-pointer ${
                                isSelected
                                  ? "border-amber-400/80 bg-amber-500/15 text-white ring-1 ring-amber-400/50 shadow-sm shadow-amber-400/10"
                                  : "border-white/5 bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:border-white/10"
                              }`}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                  background: opt.bgGradient || opt.hex,
                                  boxShadow: isSelected ? `0 0 8px ${opt.glow}` : "none",
                                }}
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* URL da Imagem da Carta Principal */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        URL da Imagem da Carta Principal (Opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/..."
                        value={newDeckImage}
                        onChange={(e) => setNewDeckImage(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                      />
                    </div>

                    {/* URL do Ícone Pokémon / Pokedex */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        URL do Ícone Pokémon / Pokedex (Opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.pokemon.com/static-assets/.../006.png"
                        value={newDeckIcone}
                        onChange={(e) => setNewDeckIcone(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                      />
                    </div>

                    {/* Link da Lista no Limitless TCG */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Link da Lista no Limitless TCG (Opcional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://limitlesstcg.com/decks/..."
                        value={newDeckLimitless}
                        onChange={(e) => setNewDeckLimitless(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                      />
                    </div>

                    {deckMessage && (
                      <p className="text-xs font-bold text-emerald-400 py-1">{deckMessage}</p>
                    )}
                  </div>

                  {/* Rodapé Fixo / Sticky com Botões Cancelar e Salvar */}
                  <div className="flex items-center justify-end gap-3 px-5 py-3.5 sm:px-6 sm:py-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0">
                    <button
                      type="button"
                      onClick={handleCloseDeckModal}
                      className="rounded-xl bg-slate-800/90 border border-white/10 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                    >
                      <span>💾</span>
                      <span>Salvar no Catálogo</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ABA METAGAME POR ETAPA & AUDITORIA */}
      {activeTab === "metagame" && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            {/* Topo / Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Metagame e Decks por Etapa
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Consulte e edite os decks utilizados pelos jogadores em cada torneio
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveStageMetagame}
                disabled={isSavingMeta || !selectedMetaStageDate}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isSavingMeta ? "Salvando..." : "Salvar Alterações na Etapa"}</span>
              </button>
            </div>

            {metaSaveMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                  metaSaveSuccess
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                {metaSaveMessage}
              </div>
            )}

            {/* Filtros: Seletor de Etapa + Busca de Jogador */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Selecione a Etapa para Visualizar/Editar
                </label>
                <div className="relative">
                  <select
                    value={selectedMetaStageDate}
                    onChange={(e) => setSelectedMetaStageDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-2.5 pl-4 pr-10 text-xs font-bold text-white focus:outline-none focus:border-blue-400 cursor-pointer appearance-none shadow-inner"
                  >
                    {adminEtapas.map((etapa) => {
                      const [y, m, d] = etapa.data.split("-");
                      const dateBR = `${d}/${m}/${y}`;
                      const stageTitle = etapa.tipo === "Liga" ? `Etapa #${etapa.numeroEtapa || ""}` : etapa.tipo;
                      return (
                        <option key={etapa.data} value={etapa.data} className="bg-slate-900 text-white">
                          {stageTitle} - Temporada {etapa.temporada || 5} ({dateBR}) ({etapa.multiplicador}x)
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Filtrar Jogador
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Digite um nome..."
                    value={metaPlayerSearch}
                    onChange={(e) => setMetaPlayerSearch(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Badges de Status / Contadores */}
            {(() => {
              const currentEtapa = adminEtapas.find((e) => e.data === selectedMetaStageDate);
              const results = currentEtapa?.resultados || [];
              const filledCount = results.filter((r: any) => {
                const d = stageDecksMap[r.jogadorNome];
                return d && d !== "Sem deck registrado" && d !== "Não registrado";
              }).length;
              const pct = results.length > 0 ? Math.round((filledCount / results.length) * 100) : 0;

              return (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-xs font-bold text-purple-300">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    Total de Jogadores: <strong className="text-white">{results.length}</strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
                    <span>🎴</span>
                    Decks Preenchidos: <strong className="text-emerald-400">{filledCount}/{results.length} ({pct}%)</strong>
                  </span>
                </div>
              );
            })()}

            {/* Tabela de Jogadores e Decks */}
            {(() => {
              const currentEtapa = adminEtapas.find((e) => e.data === selectedMetaStageDate);
              const results = (currentEtapa?.resultados || []).filter((r: any) =>
                r.jogadorNome.toLowerCase().includes(metaPlayerSearch.toLowerCase())
              );

              if (!currentEtapa || results.length === 0) {
                return (
                  <div className="py-12 text-center rounded-2xl border border-white/5 bg-slate-950/50">
                    <p className="text-xs text-slate-400">
                      {metaPlayerSearch
                        ? `Nenhum jogador encontrado com "${metaPlayerSearch}".`
                        : "Nenhum participante registrado para esta etapa."}
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-inner">
                  <div className="overflow-y-auto max-h-[500px]">
                    <table className="w-full text-left text-xs text-slate-200">
                      <thead className="sticky top-0 bg-slate-950/95 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 z-10 backdrop-blur-md">
                        <tr>
                          <th className="py-3 pl-4 w-16">POS</th>
                          <th className="px-4 py-3">JOGADOR</th>
                          <th className="px-4 py-3">CATEGORIA</th>
                          <th className="px-4 py-3">DECK UTILIZADO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.map((res: any, rIdx: number) => {
                          const currentDeckName = stageDecksMap[res.jogadorNome] || res.deckNome || "Sem deck registrado";
                          const deckObj = decks.find((d) => d.nome.toLowerCase() === currentDeckName.toLowerCase());
                          const energyConfig = deckObj ? getMultiEnergyConfig(deckObj.tipoEnergia) : null;

                          return (
                            <tr key={res.id || rIdx} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-3 pl-4 font-black text-amber-400 text-sm">
                                {res.colocacao}º
                              </td>
                              <td className="px-4 py-3 font-bold text-white text-sm">
                                {res.jogadorNome}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">
                                {res.categoria || "MASTER"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="relative max-w-sm flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                      {energyConfig ? (
                                        <span
                                          className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                                          style={{
                                            background: energyConfig.types[0]?.bgGradient || energyConfig.types[0]?.hex,
                                            boxShadow: `0 0 6px ${energyConfig.glowColor}`,
                                          }}
                                        />
                                      ) : (
                                        <span className="h-3 w-3 rounded-full bg-slate-600 shrink-0" />
                                      )}
                                    </div>
                                    <select
                                      value={currentDeckName}
                                      onChange={(e) =>
                                        setStageDecksMap((prev) => ({
                                          ...prev,
                                          [res.jogadorNome]: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2 pl-8 pr-8 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none shadow-sm"
                                    >
                                      <option value="Sem deck registrado" className="bg-slate-900 text-slate-400 font-normal">
                                        ⚪ Sem deck registrado
                                      </option>
                                      {decks.map((d) => (
                                        <option key={d.id} value={d.nome} className="bg-slate-900 text-white font-bold">
                                          {d.nome}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                                      <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* AUDITORIA E DIAGNÓSTICO DO METAGAME & SISTEMA */}
          <AdminAuditoria />
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

      {/* ABA INSCRIÇÕES & DECKLISTS PREMIER */}
      {activeTab === "inscricoes" && (
        <AdminInscricoesPremier
          initialConfig={initialConfig}
          initialCalendar={calendarEvents}
          initialDecklists={decklists}
        />
      )}

      {/* 5. ABA CONFIGURAÇÕES GLOBAIS & REGULAMENTO */}
      {activeTab === "config" && (
        <div className="space-y-8 max-w-5xl">
          {/* Gerenciador de Regulamento & Regras da Liga */}
          <AdminRegrasManager
            initialRegras={initialConfig.regras}
            onSaved={() => router.refresh()}
          />

          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="text-xl font-black text-white flex items-center gap-2.5">
                <Settings className="h-5 w-5 text-indigo-400" /> Parâmetros Globais do Site
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
                Edite as identidades visuais, mensagens de aviso, canais de comunicação e credenciais administrativas.
              </p>
            </div>

          <form onSubmit={handleSaveAllConfig} className="space-y-7">
            {/* Bloco 1: Controles e Módulos da Página Inicial (Home) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/[0.06] pb-2">
                <Sparkles className="h-4 w-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                  1. Módulos & Exibições da Página Inicial (Home)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Toggle: Carrossel de Decks */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Carrossel 3D de Decks</span>
                    <span className="text-[11px] text-slate-400 font-normal">Esteira contínua com os arquétipos</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExibirCarrosselDecksHome(!exibirCarrosselDecksHome)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      exibirCarrosselDecksHome ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        exibirCarrosselDecksHome ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Seletor: Velocidade do Carrossel */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Velocidade da Esteira</span>
                    <span className="text-[11px] text-slate-400 font-normal">Ritmo do deslizamento contínuo</span>
                  </div>
                  <select
                    value={velocidadeCarrossel}
                    onChange={(e) => setVelocidadeCarrossel(e.target.value)}
                    className="rounded-xl border border-white/10 bg-slate-800 py-1.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="-20">Super Lenta (20 px/s)</option>
                    <option value="-28">Baixa / Suave (28 px/s)</option>
                    <option value="-45">Média (45 px/s)</option>
                    <option value="-70">Rápida (70 px/s)</option>
                  </select>
                </div>

                {/* Toggle: Pódio da Temporada */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Pódio da Temporada</span>
                    <span className="text-[11px] text-slate-400 font-normal">Exibe o Top 4 atual na Home</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExibirPodioHome(!exibirPodioHome)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      exibirPodioHome ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        exibirPodioHome ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle: Próximo Evento / Countdown */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Card do Próximo Evento</span>
                    <span className="text-[11px] text-slate-400 font-normal">Contagem regressiva e inscrições</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExibirProximoEventoHome(!exibirProximoEventoHome)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      exibirProximoEventoHome ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        exibirProximoEventoHome ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle: Premiações Projetadas */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 sm:col-span-2">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Premiações Projetadas da Temporada</span>
                    <span className="text-[11px] text-slate-400 font-normal">Pokébola de Ouro, Líder do Ginásio, Mestre Ditto e Troféu Murcha</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExibirPremiacoesHome(!exibirPremiacoesHome)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      exibirPremiacoesHome ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        exibirPremiacoesHome ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco 2: Módulos Globais e Navegação */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/[0.06] pb-2">
                <Sliders className="h-4 w-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                  2. Módulos Globais & Navegação
                </h4>
              </div>

              <div className="space-y-3">
                {/* Banner de Aviso do Topo */}
                <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-white">Barra de Aviso no Topo (Banner)</span>
                      <span className="text-[11px] text-slate-400 font-normal">Exibido acima do cabeçalho em todas as páginas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExibirBannerAvisoTopo(!exibirBannerAvisoTopo)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        exibirBannerAvisoTopo ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          exibirBannerAvisoTopo ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {exibirBannerAvisoTopo && (
                    <input
                      type="text"
                      placeholder="Ex: ⚡ Inscrições abertas para o League Challenge deste sábado!"
                      value={avisoTopo}
                      onChange={(e) => setAvisoTopo(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  )}
                </div>

                {/* Botão de Login / Portal do Atleta */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-slate-950/60">
                  <div className="space-y-0.5 pr-2">
                    <span className="block text-xs font-bold text-white">Portal do Treinador / Botão de Login</span>
                    <span className="text-[11px] text-slate-400 font-normal">Exibe o botão de login e acesso ao portal do atleta</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExibirPortalAtleta(!exibirPortalAtleta)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      exibirPortalAtleta ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        exibirPortalAtleta ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco 3: Links & Redes Sociais no Rodapé */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/[0.06] pb-2">
                <LinkIcon className="h-4 w-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                  3. Redes Sociais & Canais no Rodapé
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    WhatsApp (Grupo Oficial)
                  </label>
                  <input
                    type="text"
                    placeholder="https://chat.whatsapp.com/..."
                    value={linkWhatsApp}
                    onChange={(e) => setLinkWhatsApp(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Instagram Oficial
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/ligaatlantica"
                    value={linkInstagram}
                    onChange={(e) => setLinkInstagram(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Twitch (Transmissões)
                  </label>
                  <input
                    type="text"
                    placeholder="https://twitch.tv/atlanticamais"
                    value={linkTwitch}
                    onChange={(e) => setLinkTwitch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    YouTube (Canal de Vídeos)
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/@ligaatlantica"
                    value={linkYouTube}
                    onChange={(e) => setLinkYouTube(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 4: Parâmetros Gerais e Segurança da Liga */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/[0.06] pb-2">
                <Shield className="h-4 w-4" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
                  4. Parâmetros Gerais & Segurança
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Nome Oficial da Liga
                  </label>
                  <input
                    type="text"
                    value={nomeLiga}
                    onChange={(e) => setNomeLiga(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Temporada Ativa
                  </label>
                  <input
                    type="text"
                    value={temporadaAtual}
                    onChange={(e) => setTemporadaAtual(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm font-bold text-white tabular-nums placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    Chave PIX Oficial
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: liga@pix.com.br ou CNPJ"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-200">
                    PIN de Acesso Admin
                  </label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm tabular-nums font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Status Operacional da Temporada
                  </label>
                  <select
                    value={statusTemporada}
                    onChange={(e) => setStatusTemporada(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="ativa">Ativa (Online e pontuando em tempo real)</option>
                    <option value="congelada">Congelada (Pódio final fixado para premiações)</option>
                    <option value="playoffs">Playoffs / Top Cut em Andamento</option>
                    <option value="offseason">Off-Season (Fora de Temporada / Em preparação)</option>
                  </select>
                </div>
              </div>
            </div>

            {configMessage && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{configMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-7 py-3 text-xs sm:text-sm font-bold text-white hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>
          </form>

          {/* Sincronização & Migração do Banco de Dados */}
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-blue-400">
              <Database className="h-5 w-5 shrink-0" />
              <h4 className="text-base font-bold text-white">Sincronização & Migração de Dados</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clique no botão abaixo para criar automaticamente as tabelas e sincronizar 100% dos dados históricos, jogadores, ranking oficial da Temporada 5, decks e calendário para o banco de dados online.
            </p>

            {syncDbMessage && (
              <div
                className={`p-4 rounded-xl border text-xs font-bold ${
                  syncDbMessage.startsWith("✅")
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                {syncDbMessage}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={handleSyncDatabase}
                disabled={isSyncingDb}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingDb ? "animate-spin" : ""}`} />
                <span>{isSyncingDb ? "Sincronizando Banco..." : "Sincronizar Banco de Dados Agora"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* 6. ABA TEMPORADAS & HALL DA FAMA */}
      {activeTab === "temporadas" && (
        <AdminTemporadasManager
          initialChampions={initialChampions}
          initialScoresAntigos={initialScoresAntigos}
          currentSeasonNumber={Number(initialConfig.temporadaAtual) || 5}
          onChampionsUpdated={() => router.refresh()}
          onScoresUpdated={() => router.refresh()}
        />
      )}
    </div>
  );
}
