"use client";

import { useState } from "react";
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
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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
  const [selectedDeck, setSelectedDeck] = useState(player.deckAtivoNome || allDecks[0]?.nome || "Dragapult Ex");
  const [decklistText, setDecklistText] = useState(player.decklistTexto || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [cardStats, setCardStats] = useState<any>(null);

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
        setSubmitMessage("✅ Sua Decklist oficial de 60 cartas foi validada e enviada com sucesso para o torneio!");
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 px-2">
      {/* 1. Header do Atleta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-blue-500/30 text-blue-400 shadow-inner">
            <User className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">{player.nome}</h1>
              <span className="rounded-md bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-xs font-bold text-blue-300 uppercase">
                {player.categoria}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              POP ID: <strong>{player.id}</strong> • {player.cidade || "Feira de Santana - BA"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>

      {/* 2. KPIs de Desempenho Pessoal na Temporada 5 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Pontos na Temporada</span>
          <span className="text-2xl sm:text-3xl font-black text-yellow-400 tracking-tight mt-1 block">
            {rankingItem ? Math.round(rankingItem.pontos) : 0} <span className="text-xs text-yellow-300 font-bold">PTS</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Vitórias / Derrotas</span>
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 block">
            <span className="text-emerald-400">{rankingItem?.vitorias || 0}V</span> - <span className="text-rose-400">{rankingItem?.derrotas || 0}D</span>
          </span>
          <span className="text-[10px] text-slate-400">{rankingItem?.empates || 0} Empates</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Aproveitamento</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-400 tracking-tight mt-1 block">
            {winRate}%
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Pódios (Top 4)</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mt-1 block">
            {rankingItem?.podios || 0}x
          </span>
        </div>
      </div>

      {/* 3. Submissão de Decklist para o Próximo Torneio */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-black uppercase text-blue-300 mb-2">
              <Sparkles className="h-3 w-3" />
              Check-in de Torneio
            </span>
            <h3 className="text-lg font-black text-white">
              {nextEvent ? nextEvent.evento : "Próxima Etapa Oficial da Liga"}
            </h3>
            {nextEvent && (
              <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {nextEvent.data}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {nextEvent.horario || "14:00"}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {nextEvent.local || "Livraria Atlântica +"}</span>
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmitDecklist} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Selecione o Arquétipo do seu Deck:
            </label>
            <select
              value={selectedDeck}
              onChange={(e) => setSelectedDeck(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
            >
              {allDecks.map((d) => (
                <option key={d.id} value={d.nome}>
                  {d.nome} ({d.tipoEnergia})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Cole sua Decklist Oficial (60 Cartas):
              </label>
              <span className="text-[11px] text-slate-400">
                Formato padrão exportado do <strong>Pokémon TCG Live</strong> ou Limitless
              </span>
            </div>
            <textarea
              rows={8}
              placeholder={`Pokémon: 14\n4 Dragapult Ex TWM 130\n2 Drakloak TWM 129\n...\n\nTreinador: 34\n4 Arven OBF 186\n...\n\nEnergia: 12\n...`}
              value={decklistText}
              onChange={(e) => setDecklistText(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {submitMessage && (
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold">
              {submitMessage}
            </div>
          )}

          {submitErrors.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold space-y-1">
              {submitErrors.map((err, idx) => (
                <p key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{err}</span>
                </p>
              ))}
            </div>
          )}

          {cardStats && (
            <div className="grid grid-cols-4 gap-2 p-3 rounded-xl border border-white/10 bg-slate-950 text-center text-xs">
              <div><span className="text-slate-400 block text-[10px]">Total</span><strong>{cardStats.total} / 60</strong></div>
              <div><span className="text-emerald-400 block text-[10px]">Pokémon</span><strong>{cardStats.pokemon}</strong></div>
              <div><span className="text-blue-400 block text-[10px]">Treinadores</span><strong>{cardStats.trainers}</strong></div>
              <div><span className="text-amber-400 block text-[10px]">Energias</span><strong>{cardStats.energy}</strong></div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Validar & Enviar Decklist Oficial</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. Histórico de Torneios Jogados */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Meu Histórico de Etapas ({stageResults.length})
        </h3>

        {stageResults.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Você ainda não possui registros de etapas nesta temporada.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-white/10 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 pl-4">Data</th>
                  <th className="py-3 px-3 text-center">Colocação</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center font-bold text-yellow-400">Pontos</th>
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
                    <td className="py-2.5 px-3 text-center font-black text-yellow-400">{Math.round(r.pontos)}</td>
                    <td className="py-2.5 pr-4 font-medium text-slate-300">{r.deckNome || "Não registrado"}</td>
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
