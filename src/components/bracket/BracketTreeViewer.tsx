"use client";

import { useState } from "react";
import { Trophy, Crown, Check, ChevronRight, Swords, Sparkles } from "lucide-react";
import { CategoryBracket, BracketMatch, BracketPlayer } from "@/lib/bracket-types";
import { EnergyBadge } from "../ui/EnergyBadge";
import { CategoryBadge } from "../ui/CategoryBadge";

interface BracketTreeViewerProps {
  bracket: CategoryBracket;
  isAdmin?: boolean;
  onUpdateMatch?: (matchId: string, winnerId: string | null, score1: number, score2: number) => void;
  onEditPlayer?: (matchId: string, slot: "player1" | "player2", player: BracketPlayer | null) => void;
}

export function BracketTreeViewer({
  bracket,
  isAdmin = false,
  onUpdateMatch,
  onEditPlayer,
}: BracketTreeViewerProps) {
  // Fases organizadas
  const phases = bracket.totalSeeds === 16
    ? [
        { id: "oitavas", name: "Oitavas de Final" },
        { id: "quartas", name: "Quartas de Final" },
        { id: "semifinal", name: "Semifinais" },
        { id: "final", name: "Grande Final" },
      ]
    : [
        { id: "quartas", name: "Quartas de Final" },
        { id: "semifinal", name: "Semifinais" },
        { id: "final", name: "Grande Final" },
      ];

  const [activeMobilePhase, setActiveMobilePhase] = useState<string>(phases[0].id);

  // Agrupar partidas por fase
  const matchesByPhase = phases.reduce((acc, p) => {
    acc[p.id] = bracket.matches.filter((m) => m.phase === p.id);
    return acc;
  }, {} as Record<string, BracketMatch[]>);

  const handleScoreChange = (match: BracketMatch, delta1: number, delta2: number) => {
    if (!isAdmin || !onUpdateMatch) return;
    const s1 = Math.max(0, Math.min(3, match.score1 + delta1));
    const s2 = Math.max(0, Math.min(3, match.score2 + delta2));
    let winner: string | null = match.winnerId || null;

    if (s1 >= 2 && s1 > s2) winner = match.player1?.id || null;
    else if (s2 >= 2 && s2 > s1) winner = match.player2?.id || null;
    else if (s1 < 2 && s2 < 2) winner = null;

    onUpdateMatch(match.id, winner, s1, s2);
  };

  const handleSetWinner = (match: BracketMatch, winnerPlayer: BracketPlayer | null) => {
    if (!isAdmin || !onUpdateMatch) return;
    if (winnerPlayer && match.winnerId === winnerPlayer.id) {
      // Desfaz a vitória
      onUpdateMatch(match.id, null, 0, 0);
    } else if (winnerPlayer) {
      const s1 = winnerPlayer.id === match.player1?.id ? 2 : match.score1;
      const s2 = winnerPlayer.id === match.player2?.id ? 2 : match.score2;
      onUpdateMatch(match.id, winnerPlayer.id, s1, s2);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pódio do Campeão (quando o torneio estiver concluído) */}
      {bracket.campeao && (
        <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30">
              <Trophy className="h-8 w-8 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                <Crown className="h-3.5 w-3.5" /> Campeão da Temporada • {bracket.titulo}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{bracket.campeao.nome}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-xs font-mono font-bold text-amber-300">
                  Seed #{bracket.campeao.seed}
                </span>
                {bracket.campeao.deckNome && (
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    • <strong>{bracket.campeao.deckNome}</strong>
                    {bracket.campeao.deckEnergia && (
                      <EnergyBadge energyRaw={bracket.campeao.deckEnergia} size="sm" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {bracket.viceCampeao && (
            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Vice-Campeão</span>
              <span className="text-sm font-bold text-slate-200">{bracket.viceCampeao.nome}</span>
              <span className="text-[11px] text-slate-400 block">Seed #{bracket.viceCampeao.seed}</span>
            </div>
          )}
        </div>
      )}

      {/* Navegação de Fases no Mobile (Abas limpas) */}
      <div className="flex sm:hidden overflow-x-auto gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 no-scrollbar">
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActiveMobilePhase(p.id)}
            className={`flex-1 min-w-[100px] py-2 px-3 text-xs font-bold rounded-xl transition-all text-center cursor-pointer ${
              activeMobilePhase === p.id
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {p.name.replace(" de Final", "")}
          </button>
        ))}
      </div>

      {/* Árvore do Chaveamento (Desktop: Grid 4 Colunas | Mobile: Fase Selecionada) */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[760px] sm:min-w-[900px] grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {phases.map((phase) => {
            const matches = matchesByPhase[phase.id] || [];
            const isMobileHidden = activeMobilePhase !== phase.id;

            return (
              <div
                key={phase.id}
                className={`flex flex-col space-y-4 ${
                  isMobileHidden ? "hidden sm:flex" : "flex"
                }`}
              >
                {/* Header da Coluna */}
                <div className="sticky top-0 z-10 py-2 px-3 rounded-xl bg-slate-900 border border-white/10 text-center shadow-md">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    {phase.name}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {matches.length} {matches.length === 1 ? "confronto" : "confrontos"}
                  </span>
                </div>

                {/* Lista de Partidas com espaçamento proporcional */}
                <div className="flex flex-col justify-around flex-1 space-y-4">
                  {matches.map((m) => {
                    const isCompleted = Boolean(m.winnerId);
                    const p1Won = m.winnerId && m.winnerId === m.player1?.id;
                    const p2Won = m.winnerId && m.winnerId === m.player2?.id;

                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl border transition-all relative overflow-hidden bg-slate-900/90 shadow-lg ${
                          isCompleted
                            ? "border-amber-400/30 ring-1 ring-amber-400/20"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {/* Faixa Superior: Mesa / Número */}
                        <div className="flex items-center justify-between px-3 py-1 bg-slate-950/60 border-b border-white/5 text-[10px] text-slate-400 font-mono">
                          <span>Mesa {m.mesa || m.matchIndex}</span>
                          {isAdmin && (
                            <span className="text-amber-400 font-bold">Admin: clique p/ avançar</span>
                          )}
                        </div>

                        {/* Jogador 1 */}
                        <div
                          onClick={() => m.player1 && handleSetWinner(m, m.player1)}
                          className={`flex items-center justify-between p-2.5 transition-colors ${
                            isAdmin && m.player1 ? "cursor-pointer hover:bg-white/5" : ""
                          } ${p1Won ? "bg-emerald-500/15" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold font-mono ${
                                m.player1
                                  ? "bg-slate-800 text-amber-300 border border-white/10"
                                  : "bg-slate-800/40 text-slate-600"
                              }`}
                            >
                              {m.player1 ? m.player1.seed : "—"}
                            </span>

                            <div className="min-w-0 truncate">
                              <span
                                className={`block text-xs font-bold truncate ${
                                  p1Won
                                    ? "text-emerald-400 font-black"
                                    : m.player1
                                    ? "text-white"
                                    : "text-slate-500 italic"
                                }`}
                              >
                                {m.player1?.nome || "Aguardando..."}
                              </span>
                              {m.player1?.deckNome && (
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {m.player1.deckNome}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {p1Won && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                                p1Won
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {m.score1}
                            </span>
                          </div>
                        </div>

                        {/* Divisor do Confronto */}
                        <div className="h-px bg-white/5 relative">
                          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-1 text-[8px] text-slate-600 uppercase font-black">
                            vs
                          </span>
                        </div>

                        {/* Jogador 2 */}
                        <div
                          onClick={() => m.player2 && handleSetWinner(m, m.player2)}
                          className={`flex items-center justify-between p-2.5 transition-colors ${
                            isAdmin && m.player2 ? "cursor-pointer hover:bg-white/5" : ""
                          } ${p2Won ? "bg-emerald-500/15" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold font-mono ${
                                m.player2
                                  ? "bg-slate-800 text-amber-300 border border-white/10"
                                  : "bg-slate-800/40 text-slate-600"
                              }`}
                            >
                              {m.player2 ? m.player2.seed : "—"}
                            </span>

                            <div className="min-w-0 truncate">
                              <span
                                className={`block text-xs font-bold truncate ${
                                  p2Won
                                    ? "text-emerald-400 font-black"
                                    : m.player2
                                    ? "text-white"
                                    : "text-slate-500 italic"
                                }`}
                              >
                                {m.player2?.nome || "Aguardando..."}
                              </span>
                              {m.player2?.deckNome && (
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {m.player2.deckNome}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {p2Won && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                                p2Won
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {m.score2}
                            </span>
                          </div>
                        </div>

                        {/* Controles do Admin para Ajuste Fino de Placar */}
                        {isAdmin && (
                          <div className="flex items-center justify-between p-2 bg-slate-950/80 border-t border-white/5 text-[11px] gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">P1:</span>
                              <button
                                type="button"
                                onClick={() => handleScoreChange(m, -1, 0)}
                                className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleScoreChange(m, 1, 0)}
                                className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">P2:</span>
                              <button
                                type="button"
                                onClick={() => handleScoreChange(m, 0, -1)}
                                className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleScoreChange(m, 0, 1)}
                                className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-black cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
