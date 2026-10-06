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
  colocacao: number;
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

const ITEMS_PER_PAGE = 5;

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  if (!player) return null;

  const sc = player.stageContext;
  const isStageView = Boolean(sc);

  // Paginação inteligente inicializada na página da etapa inspecionada
  const [page, setPage] = useState(() => {
    if (sc && player.stageHistory) {
      const idx = player.stageHistory.findIndex((h) => h.numeroEtapa === sc.numeroEtapa);
      if (idx !== -1) return Math.floor(idx / ITEMS_PER_PAGE);
    }
    return 0;
  });

  // Métricas da Temporada
  const seasonTotalJogos = player.vitorias + player.empates + player.derrotas;
  const seasonWinRate = seasonTotalJogos > 0 ? Math.round((player.vitorias / seasonTotalJogos) * 100) : 0;
  const etapasArray = player.historicoColocacoes ? player.historicoColocacoes.split(";") : [];

  // Métricas da Etapa (se visualização de etapa)
  const stageTotalJogos = sc ? sc.vitorias + sc.empates + sc.derrotas : 0;
  const stageWinRate = stageTotalJogos > 0 ? Math.round((sc!.vitorias / stageTotalJogos) * 100) : 0;

  // Formatação de data da etapa
  const formattedStageDate = sc?.etapaData
    ? (() => {
        const parts = sc.etapaData.replace(/\//g, "-").split("-");
        if (parts.length === 3) {
          if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
          return `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
        return sc.etapaData;
      })()
    : "";

  const maskPlayerId = (id?: string | null) => {
    if (!id) return "";
    const clean = String(id).trim();
    if (!clean || clean === "—" || clean === "null") return "";
    if (clean.length <= 4) return clean;
    const first4 = clean.slice(0, 4);
    const asterisks = "*".repeat(Math.max(1, clean.length - 4));
    return `${first4}${asterisks}`;
  };

  const renderPlacementBadge = (colocacao: number) => {
    if (colocacao === 1) {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/60 px-2 py-1 text-xs font-black text-amber-300 shadow-sm shadow-amber-500/10 shrink-0">
          <span className="text-sm leading-none">🥇</span> 1º
        </span>
      );
    }
    if (colocacao === 2) {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-slate-300/20 border border-slate-300/40 px-2 py-1 text-xs font-black text-slate-100 shadow-sm shrink-0">
          <span className="text-sm leading-none">🥈</span> 2º
        </span>
      );
    }
    if (colocacao === 3) {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-amber-700/30 border border-amber-600/40 px-2 py-1 text-xs font-black text-amber-400 shadow-sm shrink-0">
          <span className="text-sm leading-none">🥉</span> 3º
        </span>
      );
    }
    if (colocacao === 4) {
      return (
        <span className="flex items-center gap-1 rounded-lg bg-blue-500/20 border border-blue-500/40 px-2 py-1 text-xs font-black text-blue-300 shadow-sm shrink-0">
          <span className="text-xs leading-none">🎖️</span> 4º
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center rounded-lg bg-slate-800/90 border border-white/10 px-2 py-1 text-xs font-extrabold text-slate-300 shrink-0 tabular-nums">
        #{colocacao}º
      </span>
    );
  };

  const totalHistoryItems = player.stageHistory?.length || 0;
  const totalPages = Math.ceil(totalHistoryItems / ITEMS_PER_PAGE);
  const currentHistoryPage = player.stageHistory
    ? player.stageHistory.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
    : [];

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

          {/* Contexto da Etapa (se aberto a partir de uma etapa) */}
          {isStageView && sc && (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">
                  {sc.colocacao === 1 ? "🥇" : sc.colocacao === 2 ? "🥈" : sc.colocacao === 3 ? "🥉" : "🎖️"}
                </span>
                <span className="text-xs text-amber-300 font-bold truncate">
                  Etapa #{sc.numeroEtapa || ""} • {formattedStageDate} ({sc.colocacao}º lugar)
                </span>
              </div>
              <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300 tabular-nums">
                {sc.pontos} PTS
              </span>
            </div>
          )}

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
                {isStageView ? `${stageWinRate}%` : `${seasonWinRate}%`}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">V-E-D</span>
              <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-200 tabular-nums">
                <span className="text-emerald-400">{isStageView && sc ? sc.vitorias : player.vitorias}</span>/
                <span className="text-yellow-400">{isStageView && sc ? sc.empates : player.empates}</span>/
                <span className="text-rose-400">{isStageView && sc ? sc.derrotas : player.derrotas}</span>
              </p>
            </div>
          </div>

          {/* Seção de Contabilidade de Pontos (Extrato Etapa a Etapa Paginado) */}
          <div className="mt-3.5 flex flex-col rounded-2xl border border-white/[0.08] bg-slate-900/60 p-3 sm:p-3.5 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Calculator className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                  Extrato da Temporada
                </span>
              </div>
              <span className="rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 px-2.5 py-1 text-xs font-black text-amber-300 tabular-nums shadow-sm">
                {player.pontos} PTS TOTAL
              </span>
            </div>

            {player.stageHistory && player.stageHistory.length > 0 ? (
              <div className="mt-2.5 space-y-1.5">
                {currentHistoryPage.map((item, idx) => {
                  const hasMultiplier = item.multiplicador !== undefined && Number(item.multiplicador) !== 1.0;
                  const [year, month, day] = item.data.split("-");
                  const formattedDate = day && month && year ? `${day}/${month}` : item.data;
                  const isCurrentStage = isStageView && sc?.numeroEtapa === item.numeroEtapa;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-2.5 rounded-xl border p-2 text-xs transition-all ${
                        isCurrentStage
                          ? "border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50"
                          : hasMultiplier
                          ? "border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      {/* Lado Esquerdo: Colocação em Evidência + Detalhes */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {renderPlacementBadge(item.colocacao)}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-white text-xs">
                              Etapa #{item.numeroEtapa}
                            </span>
                            <span className="text-[10px] text-slate-400">({formattedDate})</span>
                            {hasMultiplier && (
                              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-300">
                                {item.multiplicador}x
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-300 flex-wrap">
                            {item.deckNome && (
                              <span className="flex items-center gap-1 font-medium truncate max-w-[130px] sm:max-w-[170px]">
                                <EnergyBadge energyRaw={item.deckEnergia || ""} size="sm" showLabel={false} />
                                <span className="truncate">{item.deckNome}</span>
                              </span>
                            )}
                            <span className="text-slate-500 text-[10px]">•</span>
                            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                              <strong className="text-emerald-400 font-semibold">{item.vitorias}</strong>V-
                              <strong className="text-yellow-400 font-semibold">{item.empates}</strong>E-
                              <strong className="text-rose-400 font-semibold">{item.derrotas}</strong>D
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Pontuação em Evidência */}
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-sm font-black text-[#ffcb05] tabular-nums block leading-none">
                          +{item.pontosFinais} PTS
                        </span>
                        {hasMultiplier ? (
                          <span className="text-[10px] text-amber-300/90 font-mono font-semibold block mt-0.5">
                            {item.pontosBase} &times; {item.multiplicador}x
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            ({item.pontosBase} base)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 my-2">
                {etapasArray.map((colocacao, idx) => {
                  const num = Number(colocacao);
                  const isPodium = !isNaN(num) && num > 0 && num <= 4;
                  const isAbsent = colocacao === "-" || !colocacao;
                  const isCurrentStage = isStageView && sc?.numeroEtapa === idx + 1;

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center justify-center h-8 w-8 rounded text-[10px] font-bold border ${
                        isCurrentStage
                          ? "bg-amber-400 text-slate-950 border-amber-300 font-black"
                          : isPodium
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                          : isAbsent
                          ? "bg-slate-800/30 text-slate-500 border-white/5"
                          : "bg-slate-800 text-slate-200 border-white/10"
                      }`}
                      title={`Etapa #${idx + 1}: ${isAbsent ? "Não participou" : `${colocacao}º Lugar`}`}
                    >
                      <span className="text-[8px] leading-none text-slate-400">E{idx + 1}</span>
                      <span className="leading-none mt-0.5">{isAbsent ? "—" : `${colocacao}º`}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginação e Rodapé */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }).map((_, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setPage(pIdx)}
                        className={`h-6 min-w-[24px] px-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          pIdx === page
                            ? "bg-amber-400 text-slate-950 font-black shadow-sm shadow-amber-400/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {pIdx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Histórico Completo
                </span>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="text-emerald-400 hidden sm:flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3 shrink-0" /> Auditado •
                </span>
                <span>
                  Presenças: <strong className="text-white font-bold">{player.participacoes}</strong>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
