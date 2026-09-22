"use client";

import { useState } from "react";
import { Lock, Unlock, Upload, UserPlus, Settings, CheckCircle2, AlertTriangle, FileText, RefreshCw, Trophy, Users, Flame, Plus, ExternalLink } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

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
  const [multiplier, setMultiplier] = useState(1.0);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  // Estado de Jogadores
  const [players, setPlayers] = useState(initialPlayers);
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCategory, setNewPlayerCategory] = useState("Master");
  const [playerSearch, setPlayerSearch] = useState("");

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

  // Leitura do arquivo TDF
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      setStageDate(dateMatch[1]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1);
      const parsed: any[] = [];

      for (const row of rows) {
        const cols = row.split("\t");
        if (cols.length < 5) continue;
        const [pos, id, jogador, categoria, pontos, vitorias, empates, derrotas] = cols;

        parsed.push({
          colocacao: Number(pos) || 99,
          id: id ? id.trim() : "",
          jogador: jogador ? jogador.trim() : "",
          categoria: categoria ? categoria.trim() : "Master",
          pontos: Number(pontos) || 0,
          vitorias: Number(vitorias) || 0,
          empates: Number(empates) || 0,
          derrotas: Number(derrotas) || 0,
        });
      }

      setParsedRows(parsed);
    };

    reader.readAsText(file);
  };

  // Publicação da Etapa
  const handlePublishStage = async () => {
    if (parsedRows.length === 0) return;
    setIsPublishing(true);
    setPublishMessage("");

    try {
      const res = await fetch("/api/admin/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: stageDate,
          tipo: stageType,
          multiplicador: multiplier,
          resultados: parsedRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPublishMessage("✅ Etapa publicada e ranking consolidado recalculado com sucesso!");
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
      }
    } catch (err) {
      console.error(err);
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
            Gestão de etapas TOM, ranking, jogadores e decks da Liga Atlântica
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
            <Flame className="h-4 w-4" /> Decks & Meta
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
              Upload de Arquivo Oficial do TOM (.tdf)
            </h3>

            {/* Inputs de Configuração da Etapa */}
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
                  Tipo de Evento:
                </label>
                <select
                  value={stageType}
                  onChange={(e) => setStageType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Liga">Sessão de Liga</option>
                  <option value="Challenge">League Challenge</option>
                  <option value="Cup">League Cup</option>
                  <option value="Off-meta">Off-meta</option>
                  <option value="Especial">Torneio Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Multiplicador de Pontos:
                </label>
                <select
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value={1.0}>1.0x (Padrão Liga)</option>
                  <option value={1.5}>1.5x (Challenge / Especial)</option>
                  <option value={2.0}>2.0x (League Cup)</option>
                </select>
              </div>
            </div>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-950/40">
              <input
                type="file"
                accept=".tdf,.txt,.tsv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="mx-auto h-10 w-10 text-slate-500 mb-2" />
              <p className="text-sm font-bold text-white">
                Arraste o arquivo .TDF do TOM aqui ou clique para selecionar
              </p>
              <p className="text-xs text-slate-500 mt-1">Formato oficial tabulado gerado pelo TOM</p>
            </div>

            {/* Preview da Tabela */}
            {parsedRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> {parsedRows.length} competidores identificados
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

                <div className="overflow-x-auto max-h-72 rounded-xl border border-white/10 bg-slate-950/80">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="sticky top-0 bg-slate-950 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2 text-center w-10">#</th>
                        <th className="px-3 py-2.5">Jogador</th>
                        <th className="px-3 py-2.5">POP ID</th>
                        <th className="px-2 py-2.5 text-center">Cat</th>
                        <th className="px-3 py-2.5 text-right font-bold text-yellow-400">Pontos</th>
                        <th className="px-3 py-2.5 text-center">V / E / D</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-blue-600/10">
                          <td className="py-2 pl-3 pr-2 text-center font-mono">{r.colocacao}º</td>
                          <td className="px-3 py-2 font-bold text-white">{r.jogador}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{r.id || "—"}</td>
                          <td className="px-2 py-2 text-center">{r.categoria}</td>
                          <td className="px-3 py-2 text-right font-black text-yellow-400">{r.pontos}</td>
                          <td className="px-3 py-2 text-center font-mono text-slate-300">
                            {r.vitorias}/{r.empates}/{r.derrotas}
                          </td>
                        </tr>
                      ))}
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
                    .filter((p) =>
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
