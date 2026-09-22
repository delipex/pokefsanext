"use client";

import { useState, useMemo } from "react";
import {
  Lock,
  Unlock,
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
  Swords,
  Medal,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { parseTDFContent, ParsedPlayerRow } from "@/lib/tdf-parser";

interface AdminDashboardProps {
  initialPlayers: any[];
  initialDecks: any[];
  initialConfig: Record<string, any>;
}

export function AdminDashboard({ initialPlayers, initialDecks, initialConfig }: AdminDashboardProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"tdf" | "jogadores" | "decks" | "config">("tdf");

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
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCategory, setNewPlayerCategory] = useState("Master");
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerMessage, setPlayerMessage] = useState("");

  // Estado de Decks
  const [decks, setDecks] = useState(initialDecks);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckEnergy, setNewDeckEnergy] = useState("fire");
  const [newDeckImage, setNewDeckImage] = useState("");
  const [newDeckLimitless, setNewDeckLimitless] = useState("");
  const [deckSearch, setDeckSearch] = useState("");
  const [deckMessage, setDeckMessage] = useState("");

  // Estado de Configurações
  const [avisoTopo, setAvisoTopo] = useState(initialConfig.avisoTopo || "");
  const [linkWhatsApp, setLinkWhatsApp] = useState(initialConfig.linkWhatsApp || "");
  const [statusTemporada, setStatusTemporada] = useState(initialConfig.statusTemporada || "ativa");
  const [configMessage, setConfigMessage] = useState("");

  // Normalizador de nomes
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Autenticação por PIN
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234" || pin === "liga2026" || pin === (initialConfig.adminPin || "1234")) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("PIN incorreto. Tente novamente.");
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
        // Se ainda não foi resolvido manualmente
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

  // Adicionar Jogador
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerId || !newPlayerName) return;
    setPlayerMessage("");

    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
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
        setNewPlayerId("");
        setNewPlayerName("");
        setPlayerMessage("✅ Jogador cadastrado com sucesso!");
      }
    } catch (err: any) {
      setPlayerMessage(`❌ Erro: ${err.message}`);
    }
  };

  // Adicionar Deck
  const handleAddDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName) return;
    setDeckMessage("");

    try {
      const res = await fetch("/api/admin/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newDeckName,
          tipoEnergia: newDeckEnergy,
          imagem: newDeckImage || null,
          limitless: newDeckLimitless || null,
        }),
      });

      if (res.ok) {
        setDecks((prev) => [
          ...prev.filter((d) => d.nome.toLowerCase() !== newDeckName.toLowerCase()),
          {
            id: Date.now(),
            nome: newDeckName,
            tipoEnergia: newDeckEnergy,
            imagem: newDeckImage,
            limitless: newDeckLimitless,
          },
        ]);
        setNewDeckName("");
        setNewDeckImage("");
        setNewDeckLimitless("");
        setDeckMessage("✅ Deck cadastrado com sucesso!");
      }
    } catch (err: any) {
      setDeckMessage(`❌ Erro: ${err.message}`);
    }
  };

  // Salvar Configurações
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMessage("");

    try {
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "avisoTopo", valor: avisoTopo }),
      });

      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "linkWhatsApp", valor: linkWhatsApp }),
      });

      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "statusTemporada", valor: statusTemporada }),
      });

      setConfigMessage("✅ Configurações salvas com sucesso!");
    } catch (err: any) {
      setConfigMessage(`❌ Erro ao salvar: ${err.message}`);
    }
  };

  // Tela de Login com PIN
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 backdrop-blur-2xl shadow-2xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Painel do Organizador</h2>
            <p className="text-xs text-slate-400 mt-1">
              Digite seu PIN de acesso para gerenciar etapas, jogadores, decks e configurações
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="PIN de Acesso (padrão: 1234)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-800/90 py-3 text-center text-lg font-bold tracking-widest text-white focus:border-blue-500 focus:outline-none"
              autoFocus
            />

            {authError && <p className="text-xs font-semibold text-rose-400">{authError}</p>}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all"
            >
              Acessar Painel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Topo do Painel */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Unlock className="h-4 w-4" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Painel Administrativo</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão oficial de etapas TOM, cálculo de ranking, metagame, jogadores e decks
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("tdf")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "tdf"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Upload className="h-4 w-4" /> Publicar TDF
          </button>
          <button
            onClick={() => setActiveTab("jogadores")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "jogadores"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="h-4 w-4" /> Jogadores
          </button>
          <button
            onClick={() => setActiveTab("decks")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "decks"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="h-4 w-4" /> Metagame
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "config"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>
      </div>

      {/* 1. ABA TDF / UPLOAD */}
      {activeTab === "tdf" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-400" />
              Upload & Processamento de Arquivos TDF (TOM XML / TSV)
            </h3>

            {/* Grid de Seleção de Tipo de Evento */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tipo de Torneio / Sessão:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Liga")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    stageType === "Liga"
                      ? "border-blue-500 bg-blue-600/20 text-white shadow-lg shadow-blue-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Swords className="h-5 w-5 mb-1 text-blue-400" />
                  <span className="text-xs font-black text-white">Sessão de Liga</span>
                  <span className="text-[10px] text-blue-300 font-semibold">1.0x (Fixo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Challenge")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    stageType === "Challenge"
                      ? "border-amber-500 bg-amber-600/20 text-white shadow-lg shadow-amber-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Medal className="h-5 w-5 mb-1 text-amber-400" />
                  <span className="text-xs font-black text-white">Challenge</span>
                  <span className="text-[10px] text-amber-300 font-semibold">1.5x (Fixo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Cup")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
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
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    stageType === "Especial"
                      ? "border-purple-500 bg-purple-600/20 text-white shadow-lg shadow-purple-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Sparkles className="h-5 w-5 mb-1 text-purple-400" />
                  <span className="text-xs font-black text-white">Sessão Especial</span>
                  <span className="text-[10px] text-purple-300 font-semibold">1.0x (Ajustável)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEventTypeSelect("Personalizado")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    stageType === "Personalizado"
                      ? "border-emerald-500 bg-emerald-600/20 text-white shadow-lg shadow-emerald-500/20"
                      : "border-white/10 bg-slate-800/60 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Sliders className="h-5 w-5 mb-1 text-emerald-400" />
                  <span className="text-xs font-black text-white">Personalizado</span>
                  <span className="text-[10px] text-emerald-300 font-semibold">Livre</span>
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

              {stageType === "Personalizado" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Título do Evento:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Torneio de Férias #1"
                    value={customStageTitle}
                    onChange={(e) => setCustomStageTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Multiplicador Oficial:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Number(e.target.value))}
                    disabled={stageType === "Liga" || stageType === "Challenge" || stageType === "Cup"}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

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

            {/* Dropzone com suporte a múltiplos arquivos */}
            <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-950/40">
              <input
                type="file"
                multiple
                accept=".tdf,.txt,.tsv,.xml"
                onChange={handleFileInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="mx-auto h-10 w-10 text-slate-500 mb-2" />
              <p className="text-sm font-bold text-white">
                Arraste o arquivo oficial .TDF (ou múltiplos arquivos) aqui ou clique para selecionar
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Suporte automático a XML nativo do TOM, cálculo de Byes, OMW% e ordenação oficial Play! Pokémon
              </p>
            </div>

            {/* Painel de Resolução de Jogadores Não Encontrados */}
            {unresolvedPlayers.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{unresolvedPlayers.length} Jogadores Não Cadastrados no Banco:</span>
                </div>
                <p className="text-xs text-slate-300">
                  Esses jogadores foram encontrados no TDF mas ainda não possuem registro oficial no banco de jogadores.
                  Você pode cadastrá-los com 1 clique abaixo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                  {unresolvedPlayers.map((unr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-white/10 bg-slate-900 text-xs"
                    >
                      <div>
                        <div className="font-black text-white">{unr.jogador}</div>
                        <div className="text-[10px] text-slate-400">ID: {unr.id || "Sem ID"} • {unr.categoria}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickRegisterPlayer(unr)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 font-bold text-white text-[11px] whitespace-nowrap shadow"
                      >
                        ⚡ Cadastrar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview da Tabela com Gestão de Decks */}
            {parsedRows.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> {parsedRows.length} competidores carregados e ordenados
                  </span>
                  <button
                    onClick={handlePublishStage}
                    disabled={isPublishing}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Publicando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Confirmar e Publicar Etapa
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96 rounded-xl border border-white/10 bg-slate-950/80">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2 text-center w-10">#</th>
                        <th className="px-3 py-2.5">Jogador</th>
                        <th className="px-3 py-2.5">POP ID</th>
                        <th className="px-2 py-2.5 text-center">Cat</th>
                        <th className="px-3 py-2.5 text-center font-bold text-yellow-400">Pontos ({multiplier}x)</th>
                        <th className="px-3 py-2.5 text-center">V / E / D</th>
                        <th className="px-3 py-2.5 min-w-[200px]">Deck Usado na Etapa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((r, idx) => {
                        const multipliedPts = Math.round(r.pontos * multiplier);
                        return (
                          <tr key={idx} className="hover:bg-blue-600/10 transition-colors">
                            <td className="py-2 pl-3 pr-2 text-center font-mono font-bold">{r.colocacao}º</td>
                            <td className="px-3 py-2 font-bold text-white">
                              {resolvedNamesMap[r.jogador] || r.jogador}
                              {r.isDnf && (
                                <span className="ml-1.5 rounded bg-rose-500/20 px-1 py-0.2 text-[9px] text-rose-400 border border-rose-500/30">
                                  DNF
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-400">{r.id || "—"}</td>
                            <td className="px-2 py-2 text-center">{r.categoria}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="font-black text-yellow-400 text-sm">{multipliedPts} PTS</span>
                              {multiplier !== 1.0 && (
                                <div className="text-[10px] text-slate-400">
                                  ({r.pontos} × {multiplier}x)
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-slate-300">
                              <span className="text-emerald-400 font-bold">{r.vitorias}V</span>{" "}
                              <span className="text-amber-400 font-bold">{r.empates}E</span>{" "}
                              <span className="text-rose-400 font-bold">{r.derrotas}D</span>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={r.deckNome || "Não registrado"}
                                onChange={(e) => handlePlayerDeckChange(idx, e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-slate-900 py-1.5 px-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="Não registrado">Não registrado</option>
                                {decks
                                  .slice()
                                  .sort((a, b) => a.nome.localeCompare(b.nome))
                                  .map((d) => (
                                    <option key={d.id || d.nome} value={d.nome}>
                                      {d.nome} ({d.tipoEnergia})
                                    </option>
                                  ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {publishMessage && (
              <div className="p-4 rounded-xl border border-white/10 bg-slate-950/80 text-xs font-bold text-slate-200">
                {publishMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ABA JOGADORES */}
      {activeTab === "jogadores" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" /> Cadastrar Jogador
            </h3>
            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  POP ID (Play! ID):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 5685779"
                  value={newPlayerId}
                  onChange={(e) => setNewPlayerId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
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
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Master">Master</option>
                  <option value="Senior">Senior</option>
                  <option value="Junior">Junior</option>
                </select>
              </div>

              {playerMessage && <p className="text-xs font-bold text-emerald-400">{playerMessage}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30"
              >
                Salvar Jogador
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                Jogadores Cadastrados ({players.length})
              </h3>
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-slate-800 py-1.5 px-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto max-h-80 rounded-xl border border-white/10 bg-slate-950/80">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-2.5 pl-3">Nome</th>
                    <th className="px-3 py-2.5">POP ID</th>
                    <th className="px-3 py-2.5 text-center">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {players
                    .filter(
                      (p) =>
                        p.nome.toLowerCase().includes(playerSearch.toLowerCase()) ||
                        p.id.includes(playerSearch)
                    )
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-2 pl-3 font-bold text-white">{p.nome}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{p.id}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {p.categoria}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ABA DECKS & META */}
      {activeTab === "decks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Novo Deck */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-400" /> Cadastrar Arquétipo
            </h3>
            <form onSubmit={handleAddDeck} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Nome do Deck:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mega Rayquaza Ex"
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

              {deckMessage && (
                <p className="text-xs font-bold text-emerald-400">{deckMessage}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-black text-white hover:bg-amber-500 transition-colors shadow-md shadow-amber-600/30"
              >
                Salvar Arquétipo
              </button>
            </form>
          </div>

          {/* Grid/Lista de Decks Cadastrados */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                Catálogo de Decks Cadastrados ({decks.length})
              </h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {decks
                    .filter((d) => d.nome.toLowerCase().includes(deckSearch.toLowerCase()))
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
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
                              className="text-blue-400 hover:text-blue-300 font-bold"
                            >
                              Link
                            </a>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA CONFIGURAÇÕES */}
      {activeTab === "config" && (
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-5">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" /> Parâmetros da Liga
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Aviso do Topo (Banner):
              </label>
              <input
                type="text"
                placeholder="Texto que aparece na faixa superior do site..."
                value={avisoTopo}
                onChange={(e) => setAvisoTopo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status da Temporada:
              </label>
              <select
                value={statusTemporada}
                onChange={(e) => setStatusTemporada(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value="ativa">Ativa (Online)</option>
                <option value="congelada">Congelada (Pódio Fixo)</option>
                <option value="offseason">Off-Season (Fora de Temporada)</option>
              </select>
            </div>

            {configMessage && (
              <p className="text-xs font-bold text-emerald-400">{configMessage}</p>
            )}

            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-black text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
            >
              Salvar Alterações
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
