"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Calendar,
  X,
  RefreshCw,
  Award,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

interface AdminTemporadasManagerProps {
  initialChampions: any[];
  initialScoresAntigos: any[];
  currentSeasonNumber: number;
  onChampionsUpdated?: () => void;
  onScoresUpdated?: () => void;
}

export function AdminTemporadasManager({
  initialChampions = [],
  initialScoresAntigos = [],
  currentSeasonNumber = 5,
  onChampionsUpdated,
  onScoresUpdated,
}: AdminTemporadasManagerProps) {
  // Estado dos Campeões
  const [champions, setChampions] = useState<any[]>(initialChampions);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const [editingChampion, setEditingChampion] = useState<any | null>(null);
  const [championForm, setChampionForm] = useState({
    temporada: `Temporada #${currentSeasonNumber - 1}`,
    campeao: "",
    vice: "",
    deckCampeao: "",
    data: new Date().toISOString().split("T")[0],
    fotoCampeao: "",
    urlDeck: "",
    imagemDeck: "",
    observacaoDeck: "",
  });

  // Estado dos Scores Antigos
  const [scoresAntigos, setScoresAntigos] = useState<any[]>(initialScoresAntigos);
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [scoreSearch, setScoreSearch] = useState<string>("");
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<any | null>(null);
  const [scoreForm, setScoreForm] = useState({
    temporada: "Temporada #4",
    pos: 1,
    jogador: "",
    categoria: "Master",
    pontos: "0",
    deck: "",
    dataFechamento: "",
  });

  // Estado do Fechamento de Temporada
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [closureConfirmText, setClosureConfirmText] = useState("");
  const [closureCampeao, setClosureCampeao] = useState("");
  const [closureVice, setClosureVice] = useState("");
  const [closureDeck, setClosureDeck] = useState("");
  const [closureLoading, setClosureLoading] = useState(false);

  // Mensagens de Feedback
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Lista única de temporadas presentes nos scores antigos
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    scoresAntigos.forEach((s) => {
      if (s.temporada) set.add(s.temporada);
    });
    return Array.from(set).sort();
  }, [scoresAntigos]);

  // Scores filtrados
  const filteredScores = useMemo(() => {
    return scoresAntigos.filter((s) => {
      const matchSeason = seasonFilter === "all" || s.temporada === seasonFilter;
      const q = scoreSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (s.jogador && s.jogador.toLowerCase().includes(q)) ||
        (s.deck && s.deck.toLowerCase().includes(q)) ||
        (s.temporada && s.temporada.toLowerCase().includes(q));
      return matchSeason && matchSearch;
    });
  }, [scoresAntigos, seasonFilter, scoreSearch]);

  // ==========================================
  // HANDLERS DE CAMPEÕES (HALL DA FAMA)
  // ==========================================
  const handleOpenNewChampion = () => {
    setEditingChampion(null);
    setChampionForm({
      temporada: `Temporada #${currentSeasonNumber - 1}`,
      campeao: "",
      vice: "",
      deckCampeao: "",
      data: new Date().toISOString().split("T")[0],
      fotoCampeao: "",
      urlDeck: "",
      imagemDeck: "",
      observacaoDeck: "",
    });
    setIsChampionModalOpen(true);
  };

  const handleEditChampion = (champ: any) => {
    setEditingChampion(champ);
    setChampionForm({
      temporada: champ.temporada || "",
      campeao: champ.campeao || "",
      vice: champ.vice || "",
      deckCampeao: champ.deckCampeao || "",
      data: champ.data || "",
      fotoCampeao: champ.fotoCampeao || "",
      urlDeck: champ.urlDeck || "",
      imagemDeck: champ.imagemDeck || "",
      observacaoDeck: champ.observacaoDeck || "",
    });
    setIsChampionModalOpen(true);
  };

  const handleSaveChampion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const isEdit = Boolean(editingChampion?.id);
      const url = "/api/admin/champions";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...championForm, id: editingChampion.id } : championForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao salvar campeão");

      setFeedback({ text: data.message || "Campeão salvo com sucesso!", type: "success" });
      setIsChampionModalOpen(false);

      // Recarrega campeões
      const champRes = await fetch("/api/admin/champions");
      if (champRes.ok) {
        const updated = await champRes.json();
        setChampions(updated);
      }
      onChampionsUpdated?.();
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao salvar", type: "error" });
    }
  };

  const handleDeleteChampion = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este campeão do Hall da Fama?")) return;
    try {
      const res = await fetch(`/api/admin/champions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao excluir");

      setFeedback({ text: "Campeão removido do Hall da Fama.", type: "success" });
      setChampions((prev) => prev.filter((c) => c.id !== id));
      onChampionsUpdated?.();
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao excluir", type: "error" });
    }
  };

  // ==========================================
  // HANDLERS DE SCORES ANTIGOS
  // ==========================================
  const handleOpenNewScore = () => {
    setEditingScore(null);
    setScoreForm({
      temporada: seasonFilter !== "all" ? seasonFilter : "Temporada #4",
      pos: (filteredScores.length || 0) + 1,
      jogador: "",
      categoria: "Master",
      pontos: "0",
      deck: "",
      dataFechamento: "",
    });
    setIsScoreModalOpen(true);
  };

  const handleEditScore = (score: any) => {
    setEditingScore(score);
    setScoreForm({
      temporada: score.temporada || "Temporada #1",
      pos: score.pos || 1,
      jogador: score.jogador || "",
      categoria: score.categoria || "Master",
      pontos: String(score.pontos || "0"),
      deck: score.deck || "",
      dataFechamento: score.dataFechamento || "",
    });
    setIsScoreModalOpen(true);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const isEdit = Boolean(editingScore?.id);
      const url = "/api/admin/scores-antigos";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...scoreForm, id: editingScore.id } : scoreForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao salvar score");

      setFeedback({ text: data.message || "Score histórico salvo com sucesso!", type: "success" });
      setIsScoreModalOpen(false);

      // Recarrega scores
      const scRes = await fetch("/api/admin/scores-antigos");
      if (scRes.ok) {
        const updated = await scRes.json();
        setScoresAntigos(updated);
      }
      onScoresUpdated?.();
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao salvar", type: "error" });
    }
  };

  const handleDeleteScore = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este registro histórico?")) return;
    try {
      const res = await fetch(`/api/admin/scores-antigos?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao excluir");

      setFeedback({ text: "Registro histórico excluído.", type: "success" });
      setScoresAntigos((prev) => prev.filter((s) => s.id !== id));
      onScoresUpdated?.();
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao excluir", type: "error" });
    }
  };

  // ==========================================
  // HANDLERS DE FECHAMENTO DE TEMPORADA
  // ==========================================
  const handleSeasonClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (closureConfirmText !== `ENCERRAR TEMPORADA ${currentSeasonNumber}`) {
      setFeedback({
        text: `Digite exatamente 'ENCERRAR TEMPORADA ${currentSeasonNumber}' para confirmar.`,
        type: "error",
      });
      return;
    }

    setClosureLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/season-closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSeason: currentSeasonNumber,
          nextSeason: currentSeasonNumber + 1,
          closureDate: new Date().toISOString().split("T")[0],
          campeao: closureCampeao,
          vice: closureVice,
          deckCampeao: closureDeck,
          resetRanking: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao encerrar temporada");

      setFeedback({
        text: `Temporada #${currentSeasonNumber} encerrada com sucesso! O ranking foi arquivado e coroado.`,
        type: "success",
      });
      setIsClosureModalOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha no encerramento", type: "error" });
    } finally {
      setClosureLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Alerta Global de Feedback */}
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

      {/* ========================================================== */}
      {/* SEÇÃO 1: HALL DA FAMA DE CAMPEÕES                         */}
      {/* ========================================================== */}
      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span>Hall da Fama de Campeões</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre e edite os campeões históricos, decks vitoriosos, fotos e títulos de todas as temporadas da Liga Atlântica.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewChampion}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Campeão</span>
          </button>
        </div>

        {champions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Nenhum campeão registrado no Hall da Fama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {champions.map((champ) => (
              <div
                key={champ.id || champ.temporada}
                className="glass-card rounded-xl p-4 border border-white/10 bg-slate-900/60 flex flex-col justify-between relative group hover:border-amber-400/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {champ.temporada}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEditChampion(champ)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                        title="Editar Campeão"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChampion(champ.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                        title="Excluir Campeão"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {champ.fotoCampeao ? (
                      <img
                        src={champ.fotoCampeao}
                        alt={champ.campeao}
                        className="h-12 w-12 rounded-xl object-cover border border-white/20 bg-slate-950"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 text-xl font-bold">
                        🏆
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-black text-white">{champ.campeao}</h4>
                      <p className="text-xs text-slate-400">
                        Vice: <span className="text-slate-300 font-semibold">{champ.vice || "A definir"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Deck Campeão:</span>
                      <span className="font-bold text-amber-300">{champ.deckCampeao}</span>
                    </div>
                    {champ.data && (
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Data do Título:</span>
                        <span>{champ.data}</span>
                      </div>
                    )}
                  </div>
                </div>

                {champ.urlDeck && (
                  <a
                    href={champ.urlDeck}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-2 border-t border-white/5"
                  >
                    <span>Ver Lista de Cartas</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================== */}
      {/* SEÇÃO 2: SCORES E DECKS DE TEMPORADAS ANTIGAS             */}
      {/* ========================================================== */}
      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-400" />
              <span>Scores e Decks de Temporadas Antigas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulte e edite as pontuações consolidadas e decks utilizados nas temporadas passadas da Liga Atlântica.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNewScore}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Score Histórico</span>
          </button>
        </div>

        {/* Filtros da Tabela de Scores */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Temporadas</option>
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={scoreSearch}
              onChange={(e) => setScoreSearch(e.target.value)}
              placeholder="🔍 Buscar por jogador ou deck no histórico..."
              className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs font-bold text-amber-300 whitespace-nowrap text-center">
            {filteredScores.length} Registros
          </div>
        </div>

        {/* Tabela de Scores */}
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-white/10 text-xs uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3 text-center w-12">Pos</th>
                <th className="py-2.5 px-4">Temporada</th>
                <th className="py-2.5 px-4">Jogador</th>
                <th className="py-2.5 px-3 text-center">Cat</th>
                <th className="py-2.5 px-3 text-center">Pontos</th>
                <th className="py-2.5 px-4">Deck Utilizado</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredScores.map((sc, idx) => (
                <tr key={sc.id || idx} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                    #{sc.pos || idx + 1}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-medium text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10">
                      {sc.temporada}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-white">
                    {sc.jogador}
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {sc.categoria || "ME"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-400 tabular-nums">
                    {sc.pontos}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-300">
                    {sc.deck || "Não especificado"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditScore(sc)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScore(sc.id)}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================== */}
      {/* SEÇÃO 3: ENCERRAR E ARQUIVAR TEMPORADA                     */}
      {/* ========================================================== */}
      <section className="glass-card rounded-2xl p-6 border border-red-500/30 bg-red-950/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Encerrar e Arquivar Temporada Vigente</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Operação crítica de fechamento oficial de temporada e coroa do campeão.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
            Protegido por Confirmação 🔒
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Ao finalizar a temporada, todos os dados atuais (ranking consolidado e etapas) serão arquivados permanentemente no banco de dados e em histórico isolado, o Campeão será coroado no Hall da Fama e o ranking ativo será zerado para a Temporada #{currentSeasonNumber + 1}.
        </p>

        <button
          type="button"
          onClick={() => setIsClosureModalOpen(true)}
          className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Lock className="h-4 w-4" />
          <span>Iniciar Protocolo de Encerramento da Temporada #{currentSeasonNumber}...</span>
        </button>
      </section>

      {/* ========================================================== */}
      {/* MODAL: CADASTRO / EDIÇÃO DE CAMPEÃO                       */}
      {/* ========================================================== */}
      {isChampionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <span>{editingChampion ? "Editar Campeão" : "Novo Campeão do Hall da Fama"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChampionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChampion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Temporada</label>
                  <input
                    type="text"
                    required
                    value={championForm.temporada}
                    onChange={(e) => setChampionForm({ ...championForm, temporada: e.target.value })}
                    placeholder="Ex: Temporada #5"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data do Título</label>
                  <input
                    type="date"
                    required
                    value={championForm.data}
                    onChange={(e) => setChampionForm({ ...championForm, data: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Campeão</label>
                  <input
                    type="text"
                    required
                    value={championForm.campeao}
                    onChange={(e) => setChampionForm({ ...championForm, campeao: e.target.value })}
                    placeholder="Nome do vencedor"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vice-Campeão</label>
                  <input
                    type="text"
                    value={championForm.vice}
                    onChange={(e) => setChampionForm({ ...championForm, vice: e.target.value })}
                    placeholder="Nome do vice"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deck Campeão</label>
                <input
                  type="text"
                  required
                  value={championForm.deckCampeao}
                  onChange={(e) => setChampionForm({ ...championForm, deckCampeao: e.target.value })}
                  placeholder="Ex: Charizard ex / Pidgeot"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL da Foto do Campeão (Opcional)</label>
                <input
                  type="url"
                  value={championForm.fotoCampeao}
                  onChange={(e) => setChampionForm({ ...championForm, fotoCampeao: e.target.value })}
                  placeholder="https://exemplo.com/foto-campeao.jpg"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Link de Lista / Limitless TCG (Opcional)</label>
                <input
                  type="url"
                  value={championForm.urlDeck}
                  onChange={(e) => setChampionForm({ ...championForm, urlDeck: e.target.value })}
                  placeholder="https://limitlesstcg.com/decks/..."
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsChampionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Salvar Campeão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CADASTRO / EDIÇÃO DE SCORE ANTIGO                  */}
      {/* ========================================================== */}
      {isScoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-400" />
                <span>{editingScore ? "Editar Score Histórico" : "Novo Score Histórico"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Temporada</label>
                  <input
                    type="text"
                    required
                    value={scoreForm.temporada}
                    onChange={(e) => setScoreForm({ ...scoreForm, temporada: e.target.value })}
                    placeholder="Ex: Temporada #1"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Posição Final</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={scoreForm.pos}
                    onChange={(e) => setScoreForm({ ...scoreForm, pos: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Jogador</label>
                <input
                  type="text"
                  required
                  value={scoreForm.jogador}
                  onChange={(e) => setScoreForm({ ...scoreForm, jogador: e.target.value })}
                  placeholder="Nome do participante"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={scoreForm.categoria}
                    onChange={(e) => setScoreForm({ ...scoreForm, categoria: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Master">Master (ME)</option>
                    <option value="Senior">Senior (SR)</option>
                    <option value="Junior">Junior (JR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pontuação Final</label>
                  <input
                    type="text"
                    required
                    value={scoreForm.pontos}
                    onChange={(e) => setScoreForm({ ...scoreForm, pontos: e.target.value })}
                    placeholder="Ex: 45"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deck Utilizado</label>
                <input
                  type="text"
                  value={scoreForm.deck}
                  onChange={(e) => setScoreForm({ ...scoreForm, deck: e.target.value })}
                  placeholder="Ex: Lugia Archeops"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Salvar Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: PROTOCOLO DE ENCERRAMENTO DE TEMPORADA              */}
      {/* ========================================================== */}
      {isClosureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-red-500/40 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3 text-red-400">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <h3 className="text-lg font-bold text-white">Fechar Temporada #{currentSeasonNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClosureModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSeasonClosure} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/30 text-slate-300 space-y-1">
                <p className="font-bold text-red-300">Atenção:</p>
                <p>O ranking atual será arquivado no histórico de scores antigos e o ranking oficial será resetado para a Temporada #{currentSeasonNumber + 1}.</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Campeão Oficial da Temporada #{currentSeasonNumber}</label>
                <input
                  type="text"
                  required
                  value={closureCampeao}
                  onChange={(e) => setClosureCampeao(e.target.value)}
                  placeholder="Nome do 1º colocado"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vice-Campeão</label>
                  <input
                    type="text"
                    value={closureVice}
                    onChange={(e) => setClosureVice(e.target.value)}
                    placeholder="Nome do 2º colocado"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Deck do Campeão</label>
                  <input
                    type="text"
                    required
                    value={closureDeck}
                    onChange={(e) => setClosureDeck(e.target.value)}
                    placeholder="Ex: Gardevoir ex"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-red-400 font-semibold mb-1">
                  Digite &quot;ENCERRAR TEMPORADA {currentSeasonNumber}&quot; para confirmar:
                </label>
                <input
                  type="text"
                  required
                  value={closureConfirmText}
                  onChange={(e) => setClosureConfirmText(e.target.value)}
                  placeholder={`ENCERRAR TEMPORADA ${currentSeasonNumber}`}
                  className="w-full bg-slate-900 border border-red-500/40 rounded-xl px-3 py-2 text-white font-mono text-center"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsClosureModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={closureLoading || closureConfirmText !== `ENCERRAR TEMPORADA ${currentSeasonNumber}`}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {closureLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>Confirmar Fechamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
