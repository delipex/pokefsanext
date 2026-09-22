"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Send,
  LogOut,
  Sparkles,
  User,
  Award,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { CategoryBadge } from "../ui/CategoryBadge";
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
    <div className="max-w-5xl mx-auto py-6 px-3 space-y-6">
      {/* 1. PASSAPORTE OFICIAL PLAY! POKÉMON (Crachá do Competidor) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl p-6 sm:p-8">
        {/* Marca d'água oficial & Glow holográfico */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
          <PokeballIcon className="w-40 h-40" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-5">
            {/* Badge de Avatar & Categoria */}
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
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {player.nome}
                </h1>
                <CategoryBadge category={player.categoria} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-3">
                <span>POP ID: <strong className="text-white">{player.id}</strong></span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">{player.categoria.toUpperCase()} DIVISION</span>
                <span>•</span>
                <span>{player.cidade || "Feira de Santana - BA"}</span>
              </p>
            </div>
          </div>

          {/* Botão Encerrar Sessão */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

        {/* Métricas e Carimbos Oficiais gravados no Passaporte */}
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

      {/* 2. PRÓXIMO TORNEIO & DECKBOX REGISTRATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Próxima Etapa Oficial */}
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

        {/* Coluna Direita: Registro de Decklist de 60 Cartas */}
        <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-black text-white">Registro de Decklist (60 Cartas)</h3>
              <p className="text-xs text-slate-400">Cole a lista exportada do Pokémon TCG Live ou Limitless</p>
            </div>
            <div className="flex items-center gap-2">
              {decklistText && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(decklistText);
                    setCopiedRaw(true);
                    setTimeout(() => setCopiedRaw(false), 2000);
                  }}
                  className="rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedRaw ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedRaw ? "Copiado!" : "Copiar"}</span>
                </button>
              )}
              {cardStats && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  {cardStats.total}/60 Cartas
                </span>
              )}
            </div>
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
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{submitMessage}</span>
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

      {/* 3. HISTÓRICO DE ETAPAS & COLOCAÇÕES */}
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
  );
}
