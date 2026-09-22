"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Swords,
  Layers,
  Calendar,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Send,
  LogOut,
  Sparkles,
  ShieldCheck,
  User,
  Copy,
  Check,
  QrCode,
  Award,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Gamepad2,
  LayoutGrid,
  FileCode2,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { PokeballIcon } from "../ui/BrandLogo";

interface PlayerPortalDashboardProps {
  player: any;
  rankingItem: any | null;
  stageResults: any[];
  allDecks: any[];
  nextEvent: any | null;
  submittedDecklist?: any | null;
}

export function PlayerPortalDashboard({
  player,
  rankingItem,
  stageResults,
  allDecks,
  nextEvent,
  submittedDecklist,
}: PlayerPortalDashboardProps) {
  const router = useRouter();

  // Layout Ativo: 'passport' (Play! Pokémon) | 'limitless' (Clean Esports) | 'tcglive' (App/Game)
  const [layoutMode, setLayoutMode] = useState<"passport" | "limitless" | "tcglive">("passport");

  useEffect(() => {
    const saved = localStorage.getItem("portal_layout_mode");
    if (saved === "passport" || saved === "limitless" || saved === "tcglive") {
      setLayoutMode(saved);
    }
  }, []);

  const handleSwitchLayout = (mode: "passport" | "limitless" | "tcglive") => {
    setLayoutMode(mode);
    localStorage.setItem("portal_layout_mode", mode);
  };

  // Estado da Decklist
  const [selectedDeck, setSelectedDeck] = useState(
    submittedDecklist?.deckNome || player.deckAtivoNome || allDecks[0]?.nome || "Dragapult Ex"
  );
  const [decklistText, setDecklistText] = useState(
    submittedDecklist?.decklistRaw || player.decklistTexto || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [cardStats, setCardStats] = useState<any>(
    submittedDecklist
      ? { total: submittedDecklist.totalCartas || 60, pokemon: 0, trainers: 0, energy: 0 }
      : null
  );
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Aba ativa na Opção 3 (TCG Live)
  const [tcgLiveTab, setTcgLiveTab] = useState<"deck" | "stats" | "history">("deck");

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/portal/logout", { method: "POST" });
      router.push("/portal/login");
      router.refresh();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  // Envio de Decklist com Validação
  const handleSubmitDecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitErrors([]);

    const foundDeck = allDecks.find((d) => d.nome.toLowerCase() === selectedDeck.toLowerCase());
    const tipoEnergia = foundDeck?.tipoEnergia || "colorless";

    try {
      const res = await fetch("/api/portal/decklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckNome: selectedDeck,
          decklistRaw: decklistText,
          tipoEnergia,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitMessage("✅ Sua Decklist oficial de 60 cartas foi validada e registrada com sucesso!");
        setCardStats({
          total: data.totalCards,
          pokemon: data.pokemonCount,
          trainers: data.trainerCount,
          energy: data.energyCount,
        });
        if (data.warnings && data.warnings.length > 0) {
          setSubmitErrors(data.warnings);
        }
      } else {
        setSubmitMessage(`❌ Erro: ${data.error}`);
        if (data.warnings) setSubmitErrors(data.warnings);
      }
    } catch (err: any) {
      setSubmitMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMatches = (rankingItem?.vitorias || 0) + (rankingItem?.derrotas || 0) + (rankingItem?.empates || 0);
  const winRate = totalMatches > 0 ? (((rankingItem?.vitorias || 0) / totalMatches) * 100).toFixed(1) : "0.0";
  const activeDeckObj = allDecks.find((d) => d.nome.toLowerCase() === selectedDeck.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 space-y-6">
      {/* SELETOR INTERATIVO DE ESTILOS DE LAYOUT (Para você testar os 3 visuais) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span><strong>Escolha o layout para testar:</strong></span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => handleSwitchLayout("passport")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              layoutMode === "passport"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>1. Passaporte Play! Pokémon</span>
          </button>

          <button
            onClick={() => handleSwitchLayout("limitless")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              layoutMode === "limitless"
                ? "bg-blue-600 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>2. Torneio Limitless / RK9</span>
          </button>

          <button
            onClick={() => handleSwitchLayout("tcglive")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              layoutMode === "tcglive"
                ? "bg-purple-600 text-white shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>3. TCG Live Client</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎴 LAYOUT 1: PLAY! POKÉMON TRAINER PASSPORT (Passaporte & Crachá de Atleta) */}
      {/* ========================================================================= */}
      {layoutMode === "passport" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Passaporte Físico / Badge de Treinador */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl p-6 sm:p-8">
            {/* Holographic Sheen & Watermark */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
              <PokeballIcon className="w-36 h-36" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-5">
                {/* Avatar Badge com Categoria */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-950 border-2 border-amber-400/40 text-amber-400 shadow-inner">
                  <User className="h-10 w-10 text-slate-300" />
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 rounded-full p-1 shadow">
                    <Award className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      PLAY! POKÉMON COMPETITOR
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Temporada 5
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                    {player.nome}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                    <span>POP ID: <strong className="text-white">{player.id}</strong></span>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">{player.categoria.toUpperCase()} DIVISION</span>
                    <span>•</span>
                    <span>{player.cidade || "Feira de Santana - BA"}</span>
                  </p>
                </div>
              </div>

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer self-start md:self-auto"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>

            {/* Carimbos & Métricas de Temporada gravados no Passaporte */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="border-l-2 border-amber-500/40 pl-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pontuação Oficial</span>
                <span className="text-2xl font-black text-amber-400 tracking-tight">
                  {rankingItem ? Math.round(rankingItem.pontos) : 0} <span className="text-xs font-bold text-amber-300">PTS</span>
                </span>
              </div>

              <div className="border-l-2 border-emerald-500/40 pl-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Retrospecto (V-D-E)</span>
                <span className="text-2xl font-black text-white tracking-tight">
                  <span className="text-emerald-400">{rankingItem?.vitorias || 0}V</span>{" "}
                  <span className="text-rose-400">{rankingItem?.derrotas || 0}D</span>
                </span>
                <span className="text-[10px] text-slate-400 block">{rankingItem?.empates || 0} empates</span>
              </div>

              <div className="border-l-2 border-blue-500/40 pl-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Aproveitamento</span>
                <span className="text-2xl font-black text-blue-400 tracking-tight">
                  {winRate}%
                </span>
              </div>

              <div className="border-l-2 border-purple-500/40 pl-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pódios Conquistados</span>
                <span className="text-2xl font-black text-purple-300 tracking-tight">
                  {rankingItem?.podios || 0}x <span className="text-xs text-purple-400 font-bold">Top 4</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. Próximo Torneio & Deckbox Registration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Próxima Etapa */}
            <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Próximo Evento Oficial</span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  {nextEvent ? nextEvent.evento : "Etapa Oficial da Liga Atlântica"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submeta sua lista com antecedência para agilizar a conferência de mesa no TOM.
                </p>
              </div>

              <div className="space-y-2.5 rounded-2xl bg-slate-950 p-4 border border-white/5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>{nextEvent?.data || "A definir"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>{nextEvent?.horario || "14:00 (Início das Rodadas)"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>{nextEvent?.local || "Livraria Atlântica +"}</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Deck Ativo Selecionado:
                </span>
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-white/10">
                  <EnergyBadge energyRaw={activeDeckObj?.tipoEnergia || "colorless"} size="sm" />
                  <span className="font-bold text-white text-sm">{selectedDeck}</span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Submissão de Decklist */}
            <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-black text-white">Registro de Decklist (60 Cartas)</h3>
                  <p className="text-xs text-slate-400">Cole a lista exportada do Pokémon TCG Live ou Limitless</p>
                </div>
                {cardStats && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                    {cardStats.total}/60 Cartas
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmitDecklist} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-300">Arquétipo do Deck:</label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    {allDecks.map((d) => (
                      <option key={d.id} value={d.nome}>
                        {d.nome} ({d.tipoEnergia})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={7}
                    placeholder={`Pokémon: 14\n4 Dragapult Ex TWM 130\n...\n\nTreinador: 34\n4 Arven OBF 186\n...\n\nEnergia: 12\n...`}
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed"
                    required
                  />
                </div>

                {submitMessage && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold">
                    {submitMessage}
                  </div>
                )}

                {submitErrors.length > 0 && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold space-y-1">
                    {submitErrors.map((err, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Validar & Confirmar Inscrição</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* 3. Histórico de Etapas */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Histórico de Participações ({stageResults.length})
            </h3>

            {stageResults.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhuma etapa registrada nesta temporada.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-white/10 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-3 pl-4">Data</th>
                      <th className="py-3 px-3 text-center">Colocação</th>
                      <th className="py-3 px-3 text-center">Score</th>
                      <th className="py-3 px-3 text-center font-bold text-amber-400">Pontos</th>
                      <th className="py-3 pr-4">Deck Utilizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stageResults.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 pl-4 font-mono text-slate-300">{r.etapaData}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">{r.colocacao}º</td>
                        <td className="py-2.5 px-3 text-center text-slate-300 font-mono">
                          {r.vitorias}-{r.derrotas}-{r.empates}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-amber-400">{Math.round(r.pontos)}</td>
                        <td className="py-2.5 pr-4 font-medium text-slate-300">{r.deckNome || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚡ LAYOUT 2: LIMITLESS / RK9 MINIMALIST (Clean Esports & Tournament Ledger) */}
      {/* ========================================================================= */}
      {layoutMode === "limitless" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Minimalista */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white font-mono">{player.nome}</h1>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-300">
                  ID #{player.id}
                </span>
                <span className="rounded bg-blue-900/50 border border-blue-700/50 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                  {player.categoria}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Temporada 5 • {player.cidade || "Feira de Santana - BA"} • Play! Pokémon Standard
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono hidden sm:block">
                <span className="text-xs text-slate-400 block">SCORE TOTAL</span>
                <strong className="text-lg font-bold text-yellow-400">{rankingItem ? Math.round(rankingItem.pontos) : 0} PTS</strong>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          {/* 2-Column Split: Esquerda (Status/Stats) + Direita (Decklist/Histórico) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Coluna Esquerda: KPIs & Próximo Torneio */}
            <div className="md:col-span-5 space-y-5">
              {/* Quick Record Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Estatísticas da Temporada</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">RECORD</span>
                    <strong className="text-sm text-emerald-400 font-mono">
                      {rankingItem?.vitorias || 0}-{rankingItem?.derrotas || 0}-{rankingItem?.empates || 0}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">WINRATE</span>
                    <strong className="text-sm text-blue-400 font-mono">{winRate}%</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PÓDIOS</span>
                    <strong className="text-sm text-amber-400 font-mono">{rankingItem?.podios || 0}x</strong>
                  </div>
                </div>
              </div>

              {/* Tournament Check-in Box */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Check-in de Torneio</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white">{nextEvent?.evento || "Etapa Oficial"}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {nextEvent?.data || "A definir"} • {nextEvent?.horario || "14:00"}
                </p>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Deck Cadastrado:</span>
                  <strong className="text-white">{selectedDeck}</strong>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Submissão de Lista & Histórico */}
            <div className="md:col-span-7 space-y-5">
              {/* Form Decklist */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase">Decklist (60 Cards)</h3>
                  <div className="flex items-center gap-2">
                    {decklistText && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(decklistText);
                          setCopiedRaw(true);
                          setTimeout(() => setCopiedRaw(false), 2000);
                        }}
                        className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedRaw ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedRaw ? "Copiado" : "Copiar"}</span>
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmitDecklist} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-mono mb-1">ARQUÉTIPO</label>
                      <select
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {allDecks.map((d) => (
                          <option key={d.id} value={d.nome}>{d.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="4 Dragapult Ex TWM 130..."
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />

                  {submitMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
                      {submitMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Validando..." : "Salvar Decklist"}
                  </button>
                </form>
              </div>

              {/* Match History Ledger */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">Histórico de Etapas</h3>
                {stageResults.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem histórico no momento.</p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {stageResults.map((r, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-white font-bold">{r.colocacao}º Lugar</span>
                          <span className="text-slate-400 font-mono ml-2">({r.vitorias}-{r.derrotas}-{r.empates})</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{r.deckNome || "Sem deck registrado"}</p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-yellow-400 font-bold">+{Math.round(r.pontos)} pts</span>
                          <span className="text-[10px] text-slate-500 block">{r.etapaData}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎮 LAYOUT 3: TCG LIVE CLIENT (App Gamer / Deckbuilder com Abas) */}
      {/* ========================================================================= */}
      {layoutMode === "tcglive" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Bar Gamer */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-purple-500/20 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black">
                {player.nome.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-black text-white">{player.nome}</h2>
                <span className="text-[11px] font-mono text-purple-300">ID: {player.id} • {player.categoria}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Abas Superiores Estilo Jogo */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setTcgLiveTab("deck")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tcgLiveTab === "deck"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              <span>Deckbuilder & Inscrição</span>
            </button>

            <button
              onClick={() => setTcgLiveTab("stats")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tcgLiveTab === "stats"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Estatísticas</span>
            </button>

            <button
              onClick={() => setTcgLiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tcgLiveTab === "history"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Histórico de Torneios</span>
            </button>
          </div>

          {/* Conteúdo da Aba 1: Deckbuilder */}
          {tcgLiveTab === "deck" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">Editor de Decklist Standard</h3>
                  <p className="text-xs text-slate-400">Exporte seu deck no Pokémon TCG Live e cole diretamente abaixo</p>
                </div>
                <div className="flex items-center gap-2">
                  <EnergyBadge energyRaw={activeDeckObj?.tipoEnergia || "colorless"} size="sm" />
                </div>
              </div>

              <form onSubmit={handleSubmitDecklist} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Escolha o Arquétipo:</label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  >
                    {allDecks.map((d) => (
                      <option key={d.id} value={d.nome}>{d.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={8}
                    placeholder="Cole sua lista exportada..."
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs font-mono text-purple-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                {submitMessage && (
                  <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 text-xs font-bold">
                    {submitMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Validando 60 cartas..." : "Confirmar e Enviar Decklist"}
                </button>
              </form>
            </div>
          )}

          {/* Conteúdo da Aba 2: Estatísticas */}
          {tcgLiveTab === "stats" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-bold uppercase">Pontuação Total</span>
                <strong className="text-3xl font-black text-amber-400 tracking-tight block mt-1">
                  {rankingItem ? Math.round(rankingItem.pontos) : 0}
                </strong>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-bold uppercase">Vitórias / Derrotas</span>
                <strong className="text-2xl font-black text-white tracking-tight block mt-1">
                  <span className="text-emerald-400">{rankingItem?.vitorias || 0}V</span> - <span className="text-rose-400">{rankingItem?.derrotas || 0}D</span>
                </strong>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-bold uppercase">Aproveitamento</span>
                <strong className="text-3xl font-black text-blue-400 tracking-tight block mt-1">
                  {winRate}%
                </strong>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-bold uppercase">Pódios Top 4</span>
                <strong className="text-3xl font-black text-purple-400 tracking-tight block mt-1">
                  {rankingItem?.podios || 0}x
                </strong>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba 3: Histórico */}
          {tcgLiveTab === "history" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-4">
              <h3 className="text-base font-black text-white">Etapas Concluídas</h3>
              {stageResults.length === 0 ? (
                <p className="text-xs text-slate-500">Sem registros ainda.</p>
              ) : (
                <div className="space-y-2">
                  {stageResults.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-black text-xs">
                          {r.colocacao}º
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">{r.deckNome || "Deck não registrado"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{r.etapaData}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-400">+{Math.round(r.pontos)} pts</span>
                        <div className="text-[11px] font-mono text-slate-400">{r.vitorias}V - {r.derrotas}D - {r.empates}E</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
