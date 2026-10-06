"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, TrendingUp, Calendar, Zap, Swords, Medal, Calculator, CheckCircle2 } from "lucide-react";
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

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  if (!player) return null;

  const sc = player.stageContext;
  const isStageView = Boolean(sc);

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
          className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl border border-white/[0.08] bg-slate-950/95 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl text-slate-100 z-10 overflow-hidden"
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
          <div className="mt-3.5 grid grid-cols-4 gap-2 text-center shrink-0">
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

          {/* Seção de Contabilidade de Pontos (Extrato Etapa a Etapa) */}
          <div className="mt-3.5 flex-1 min-h-0 flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/[0.04] shrink-0">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-amber-400" /> Extrato da Temporada
              </span>
              <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-black text-amber-300 tabular-nums">
                {player.pontos} PTS TOTAL
              </span>
            </div>

            {player.stageHistory && player.stageHistory.length > 0 ? (
              <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                {player.stageHistory.map((item, idx) => {
                  const hasMultiplier = item.multiplicador !== undefined && Number(item.multiplicador) !== 1.0;
                  const [year, month, day] = item.data.split("-");
                  const formattedDate = day && month && year ? `${day}/${month}` : item.data;
                  const isPodium = item.colocacao <= 4;
                  const isCurrentStage = isStageView && sc?.numeroEtapa === item.numeroEtapa;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        isCurrentStage
                          ? "border-amber-400 bg-amber-500/15"
                          : hasMultiplier
                          ? "border-amber-500/30 bg-amber-500/[0.04]"
                          : "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Lado Esquerdo */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-[11px]">
                            Etapa #{item.numeroEtapa}
                          </span>
                          <span className="text-[10px] text-slate-500">({formattedDate})</span>
                          {hasMultiplier && (
                            <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1 text-[8px] font-black uppercase text-amber-300">
                              {item.multiplicador}x
                            </span>
                          )}
                          <span className="text-slate-600 text-[10px]">•</span>
                          <span className={`text-[10px] font-bold ${isPodium ? "text-amber-400" : "text-slate-400"}`}>
                            {item.colocacao === 1 ? "🥇 1º" : item.colocacao === 2 ? "🥈 2º" : item.colocacao === 3 ? "🥉 3º" : `${item.colocacao}º`}
                          </span>
                          <span className="text-slate-600 text-[10px]">•</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {item.vitorias}-{item.empates}-{item.derrotas}
                          </span>
                        </div>

                        {item.deckNome && (
                          <div className="mt-0.5 flex items-center gap-1">
                            <EnergyBadge energyRaw={item.deckEnergia || ""} size="sm" showLabel={false} />
                            <span className="text-[10px] text-slate-300 font-medium truncate max-w-[140px]">
                              {item.deckNome}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lado Direito */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#ffcb05] tabular-nums block">
                          +{item.pontosFinais} PTS
                        </span>
                        {hasMultiplier ? (
                          <span className="text-[9px] text-amber-300/80 font-mono block">
                            {item.pontosBase} &times; {item.multiplicador}x
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono block">
                            ({item.pontosBase} base)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1 flex-1">
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

            {/* Rodapé Compacto */}
            <div className="mt-2 pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-400 shrink-0">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3 shrink-0" /> Auditado
              </span>
              <span className="tabular-nums">
                Presenças: <strong className="text-white">{player.participacoes} etapas</strong>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
