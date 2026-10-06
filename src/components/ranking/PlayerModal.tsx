"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, TrendingUp, Calendar, Zap, Swords, Medal, Calculator, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { CategoryBadge } from "../ui/CategoryBadge";

export interface StageContextData {
  etapaData: string;
  numeroEtapa?: number;
  tipo?: string;
  multiplicador?: number;
  colocacao: number;
  pontos: number;
  basePontos?: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  deckNome?: string | null;
  deckEnergia?: string | null;
  deckIcone?: string | null;
}

export interface StageHistoryItem {
  numeroEtapa: number;
  data: string;
  tipo: string;
  multiplicador: number;
  participou: boolean;
  colocacao?: number | null;
  pontosBase: number;
  pontosFinais: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  deckNome?: string | null;
  deckEnergia?: string | null;
  deckIcone?: string | null;
}

export interface PlayerModalData {
  posicaoOficial?: number;
  jogadorNome: string;
  jogadorId: string;
  categoria: string;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  podios: number;
  mediaColocacao: number;
  participacoes: number;
  historicoColocacoes: string;
  ultimoDeck?: string | null;
  ultimoDeckEnergia?: string | null;
  ultimoDeckIcone?: string | null;
  stageContext?: StageContextData | null;
  stageHistory?: StageHistoryItem[] | null;
}

interface PlayerModalProps {
  player: PlayerModalData | null;
  onClose: () => void;
}

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  if (!player) return null;

  const sc = player.stageContext;
  const isStageView = Boolean(sc);

  // Histórico de Etapas completo
  const stages: StageHistoryItem[] = player.stageHistory && player.stageHistory.length > 0
    ? player.stageHistory
    : (() => {
        // Fallback caso stageHistory não esteja presente
        const raw = player.historicoColocacoes ? player.historicoColocacoes.split(";") : [];
        return raw.map((col, idx) => {
          const num = Number(col);
          const attended = !isNaN(num) && num > 0;
          return {
            numeroEtapa: idx + 1,
            data: `Etapa #${idx + 1}`,
            tipo: "Liga",
            multiplicador: 1.0,
            participou: attended,
            colocacao: attended ? num : null,
            pontosBase: attended ? (num === 1 ? 12 : num === 2 ? 9 : num === 3 ? 7 : 4) : 0,
            pontosFinais: attended ? (num === 1 ? 12 : num === 2 ? 9 : num === 3 ? 7 : 4) : 0,
            vitorias: attended ? 2 : 0,
            empates: 0,
            derrotas: attended ? 1 : 0,
            deckNome: player.ultimoDeck || null,
            deckEnergia: player.ultimoDeckEnergia || "colorless",
          };
        });
      })();

  // Etapa Ativa Selecionada (inicia na etapa do clique ou na última participada)
  const [activeIdx, setActiveIdx] = useState<number>(() => {
    if (sc?.numeroEtapa && stages.length > 0) {
      const idx = stages.findIndex((s) => s.numeroEtapa === sc.numeroEtapa);
      if (idx !== -1) return idx;
    }
    // Procura a última etapa que participou
    for (let i = stages.length - 1; i >= 0; i--) {
      if (stages[i].participou) return i;
    }
    return Math.max(0, stages.length - 1);
  });

  const activeStage = stages[activeIdx] || stages[0];

  // Métricas da Temporada
  const seasonTotalJogos = player.vitorias + player.empates + player.derrotas;
  const seasonWinRate = seasonTotalJogos > 0 ? Math.round((player.vitorias / seasonTotalJogos) * 100) : 0;

  // Métricas da Etapa Ativa
  const activeStageTotal = activeStage ? activeStage.vitorias + activeStage.empates + activeStage.derrotas : 0;
  const activeStageWinRate = activeStageTotal > 0 ? Math.round((activeStage.vitorias / activeStageTotal) * 100) : 0;

  // Formatação de data
  const formatStageDate = (dt?: string) => {
    if (!dt) return "";
    const parts = dt.replace(/\//g, "-").split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}`;
      return `${parts[0]}/${parts[1]}`;
    }
    return dt;
  };

  const maskPlayerId = (id?: string | null) => {
    if (!id) return "";
    const clean = String(id).trim();
    if (!clean || clean === "—" || clean === "null") return "";
    if (clean.length <= 4) return clean;
    const first4 = clean.slice(0, 4);
    const asterisks = "*".repeat(Math.max(1, clean.length - 4));
    return `${first4}${asterisks}`;
  };

  const renderPlacementBadge = (colocacao?: number | null) => {
    if (!colocacao) return null;
    if (colocacao === 1) {
      return (
        <div className="flex items-baseline gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40">
          <span className="text-base sm:text-lg font-black text-amber-400 tabular-nums leading-none">1º</span>
          <span className="text-[10px] font-bold text-amber-400/80 uppercase">Lugar</span>
        </div>
      );
    }
    if (colocacao === 2) {
      return (
        <div className="flex items-baseline gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-slate-300/15 border border-slate-300/40">
          <span className="text-base sm:text-lg font-black text-slate-200 tabular-nums leading-none">2º</span>
          <span className="text-[10px] font-bold text-slate-300/80 uppercase">Lugar</span>
        </div>
      );
    }
    if (colocacao === 3) {
      return (
        <div className="flex items-baseline gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-amber-600/15 border border-amber-600/40">
          <span className="text-base sm:text-lg font-black text-amber-500 tabular-nums leading-none">3º</span>
          <span className="text-[10px] font-bold text-amber-500/80 uppercase">Lugar</span>
        </div>
      );
    }
    if (colocacao === 4) {
      return (
        <div className="flex items-baseline gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-500/40">
          <span className="text-base sm:text-lg font-black text-blue-400 tabular-nums leading-none">4º</span>
          <span className="text-[10px] font-bold text-blue-400/80 uppercase">Lugar</span>
        </div>
      );
    }
    return (
      <div className="flex items-baseline gap-1 shrink-0 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-white/10">
        <span className="text-sm sm:text-base font-bold text-slate-300 tabular-nums leading-none">{colocacao}º</span>
        <span className="text-[10px] font-medium text-slate-400 uppercase">Lugar</span>
      </div>
    );
  };

  const participatedStagesCount = stages.filter((s) => s.participou).length;
  const hasMultiplier = activeStage && activeStage.multiplicador !== undefined && Number(activeStage.multiplicador) !== 1.0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop com Blur Profundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Enxuto com Spring Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg flex flex-col rounded-3xl border border-white/[0.08] bg-slate-950/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-slate-100 z-10 my-auto"
        >
          {/* Botão Fechar Discreto Superior Direito */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-20"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Cabeçalho do Jogador */}
          <div className="flex items-center gap-3 pr-8 shrink-0">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-md ${
                isStageView && sc?.colocacao === 1
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-600 shadow-amber-500/20"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20"
              }`}
            >
              {player.jogadorNome.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-white truncate leading-tight">{player.jogadorNome}</h3>
                <CategoryBadge category={player.categoria} size="sm" />
                {player.posicaoOficial && (
                  <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 text-[10px] font-black text-blue-300">
                    #{player.posicaoOficial}º Geral
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {player.jogadorId && player.jogadorId !== "—" && (
                  <span className="text-[10px] text-slate-500 font-light tracking-wider select-none leading-none font-sans">
                    ID: {maskPlayerId(player.jogadorId)}
                  </span>
                )}
                {player.ultimoDeck && (
                  <>
                    <span className="text-slate-600 text-[10px]">•</span>
                    <span className="text-[11px] text-slate-300 font-medium truncate flex items-center gap-1">
                      <EnergyBadge energyRaw={player.ultimoDeckEnergia || ""} size="sm" showLabel={false} />
                      {player.ultimoDeck}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Métricas Compactas em 4 Colunas */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center shrink-0">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-yellow-400 block uppercase tracking-wider">Pontos</span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-white tabular-nums">
                {isStageView && sc ? sc.pontos : player.pontos}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-blue-400 block uppercase tracking-wider">
                {isStageView ? "Posição" : "Pódios"}
              </span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-white tabular-nums">
                {isStageView && sc ? `${sc.colocacao}º` : player.podios}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">Winrate</span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-white tabular-nums">
                {seasonWinRate}%
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">V-E-D</span>
              <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-200 tabular-nums">
                <span className="text-emerald-400">{player.vitorias}</span>/
                <span className="text-yellow-400">{player.empates}</span>/
                <span className="text-rose-400">{player.derrotas}</span>
              </p>
            </div>
          </div>

          {/* Seção Visual de Quadradinhos das Etapas (Matrix Interativa) */}
          <div className="mt-3.5 flex flex-col rounded-2xl border border-white/[0.08] bg-slate-900/60 p-3 sm:p-3.5 backdrop-blur-xl shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Calculator className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                  Extrato da Temporada
                </span>
              </div>
              <span className="rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-black text-amber-300 tabular-nums shadow-sm">
                {player.pontos} PTS TOTAL
              </span>
            </div>

            {/* Grid de Quadradinhos das Etapas (Mostra todas, inclusive faltas) */}
            <div className="flex flex-wrap gap-1.5 justify-start max-h-[105px] overflow-y-auto pr-0.5 custom-scrollbar">
              {stages.map((stg, sIdx) => {
                const isSelected = sIdx === activeIdx;
                const isAbsent = !stg.participou;
                const col = stg.colocacao;
                const isP1 = col === 1;
                const isP2 = col === 2;
                const isP3 = col === 3;
                const isP4 = col === 4;

                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setActiveIdx(sIdx)}
                    className={`flex flex-col items-center justify-center h-10 w-9 sm:h-10 sm:w-10 rounded-xl text-[10px] font-bold border transition-all cursor-pointer relative shrink-0 ${
                      isSelected
                        ? "bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-400/30 scale-105 z-10 ring-2 ring-amber-400/70"
                        : isP1
                        ? "bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25"
                        : isP2
                        ? "bg-slate-300/15 text-slate-200 border-slate-300/40 hover:bg-slate-300/25"
                        : isP3
                        ? "bg-amber-600/15 text-amber-500 border-amber-600/40 hover:bg-amber-600/25"
                        : isP4
                        ? "bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25"
                        : !isAbsent
                        ? "bg-slate-800/80 text-slate-400 border-white/10 hover:bg-slate-700/80 hover:border-white/20"
                        : "bg-slate-900/40 text-slate-600 border-white/5 hover:border-white/10"
                    }`}
                    title={`Etapa #${stg.numeroEtapa}: ${isAbsent ? "Não participou" : `${stg.colocacao}º Lugar (+${stg.pontosFinais} PTS)`}`}
                  >
                    <span className={`text-[8px] leading-none ${isSelected ? "text-slate-950 font-bold" : "text-slate-500"}`}>
                      E{stg.numeroEtapa}
                    </span>
                    <span className="leading-none mt-0.5 text-[11px] font-extrabold tabular-nums">
                      {isAbsent ? "—" : `${stg.colocacao}º`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cartão de Detalhes da Etapa Selecionada */}
            {activeStage && (
              <div className="rounded-2xl border border-white/[0.08] bg-slate-950/80 p-3 backdrop-blur-xl">
                {/* Header da Etapa com Navegação Rápida */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-white">
                      Etapa #{activeStage.numeroEtapa}
                    </span>
                    <span className="text-[10px] text-slate-400">({formatStageDate(activeStage.data)})</span>
                    <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-bold text-blue-300">
                      {activeStage.tipo}
                    </span>
                    {hasMultiplier && (
                      <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black text-amber-300 uppercase">
                        {activeStage.multiplicador}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                      disabled={activeIdx === 0}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      title="Etapa anterior"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono px-1">
                      {activeIdx + 1}/{stages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveIdx((i) => Math.min(stages.length - 1, i + 1))}
                      disabled={activeIdx >= stages.length - 1}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      title="Próxima etapa"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Corpo do Detalhe da Etapa */}
                {activeStage.participou ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    {/* Lado Esquerdo: Colocação em Evidência + Deck + Record */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {renderPlacementBadge(activeStage.colocacao)}

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {activeStage.deckNome ? (
                            <span className="flex items-center gap-1 font-semibold text-white text-xs truncate max-w-[150px] sm:max-w-[190px]">
                              <EnergyBadge energyRaw={activeStage.deckEnergia || ""} size="sm" showLabel={false} />
                              <span className="truncate">{activeStage.deckNome}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Deck não registrado</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>
                            <strong className="text-emerald-400">{activeStage.vitorias}</strong>V -{" "}
                            <strong className="text-yellow-400">{activeStage.empates}</strong>E -{" "}
                            <strong className="text-rose-400">{activeStage.derrotas}</strong>D
                          </span>
                          <span>•</span>
                          <span className="text-slate-300 font-sans">
                            Winrate {activeStageTotal > 0 ? Math.round((activeStage.vitorias / activeStageTotal) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Pontuação com Fórmula em Evidência */}
                    <div className="text-right shrink-0 pl-1">
                      <span className="text-sm sm:text-base font-black text-[#ffcb05] tabular-nums block leading-tight">
                        +{activeStage.pontosFinais} PTS
                      </span>
                      {hasMultiplier ? (
                        <span className="text-[9px] text-amber-300/90 font-mono font-semibold block mt-0.5">
                          {activeStage.pontosBase} &times; {activeStage.multiplicador}x
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                          ({activeStage.pontosBase} base)
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500 py-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 border border-white/5 text-slate-500 font-bold">
                        —
                      </span>
                      <div>
                        <span className="font-semibold text-slate-400 block text-xs">Ausente</span>
                        <span className="text-[10px] text-slate-500">O atleta não participou desta rodada</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">0 PTS</span>
                  </div>
                )}
              </div>
            )}

            {/* Rodapé Informativo */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Auditado
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span>
                  Presenças: <strong className="text-white font-bold">{participatedStagesCount} de {stages.length} etapas</strong>
                </span>
                <span className="text-slate-500">({stages.length > 0 ? Math.round((participatedStagesCount / stages.length) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
