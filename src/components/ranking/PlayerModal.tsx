"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, TrendingUp, Calendar, Zap, Swords, Medal } from "lucide-react";
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop com Blur Profundo iOS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Estilo iOS Sheet / Card com Spring Physics */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 35 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/[0.08] bg-slate-950/95 p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-slate-100 z-10"
        >
          {/* iOS Handle Indicator */}
          <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-4 sm:hidden" />

          {/* Botão Fechar com Spring Tap */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </motion.button>

          {/* Banner Contextual da Etapa (se aberto a partir de uma etapa) */}
          {isStageView && sc && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-3 sm:p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                  {sc.colocacao === 1 ? "🥇" : sc.colocacao === 2 ? "🥈" : sc.colocacao === 3 ? "🥉" : `${sc.colocacao}º`}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    Resultado Oficial da Etapa #{sc.numeroEtapa || ""}
                  </span>
                  <span className="text-xs text-slate-200 font-semibold truncate block">
                    {formattedStageDate} • {sc.tipo || "Liga"} {sc.multiplicador && sc.multiplicador > 1 ? `(${sc.multiplicador}x)` : ""}
                  </span>
                </div>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300 tabular-nums">
                {sc.pontos} PTS
              </span>
            </div>
          )}

          {/* Cabeçalho do Jogador */}
          <div className="flex items-start gap-4 pr-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg cursor-default ${
                isStageView && sc?.colocacao === 1
                  ? "bg-gradient-to-tr from-amber-500 to-yellow-600 shadow-amber-500/30"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/30"
              }`}
            >
              {player.jogadorNome.slice(0, 2).toUpperCase()}
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-extrabold text-white truncate">{player.jogadorNome}</h3>
                <CategoryBadge category={player.categoria} />
                {player.posicaoOficial && (
                  <span className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 text-xs font-black text-blue-300">
                    #{player.posicaoOficial}º Geral
                  </span>
                )}
              </div>
              {player.jogadorId && player.jogadorId !== "—" && (
                <span className="text-[10px] text-slate-400/60 font-light tracking-wider select-none leading-tight mt-0.5 block">
                  ID: {maskPlayerId(player.jogadorId)}
                </span>
              )}

              {/* Deck em Destaque */}
              {isStageView && sc?.deckNome ? (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <EnergyBadge energyRaw={sc.deckEnergia || ""} size="sm" showLabel={false} />
                  <span className="text-xs text-amber-300 font-bold">
                    Deck da Etapa: <span className="text-white">{sc.deckNome}</span>
                  </span>
                </div>
              ) : player.ultimoDeck ? (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <EnergyBadge energyRaw={player.ultimoDeckEnergia || ""} size="sm" showLabel={false} />
                  <span className="text-xs text-slate-300 font-bold">
                    Último Deck: <span className="text-white">{player.ultimoDeck}</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Atleta Oficial Liga Atlântica</p>
              )}
            </div>
          </div>

          {/* Estatísticas Chave Bento com Efeito Spring Micro-Cards */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <motion.div
              whileHover={{ y: -2 }}
              className={`rounded-2xl border p-3 text-center transition-all shadow-sm ${
                isStageView
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-white/[0.04] bg-white/[0.02]"
              }`}
            >
              <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-yellow-400">
                <Trophy className="h-3.5 w-3.5" /> {isStageView ? "PTS Etapa" : "Pontos"}
              </span>
              <p className="mt-1 text-2xl font-black text-white tabular-nums">
                {isStageView && sc ? sc.pontos : player.pontos}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className={`rounded-2xl border p-3 text-center transition-all shadow-sm ${
                isStageView
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-white/[0.04] bg-white/[0.02]"
              }`}
            >
              <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-400">
                <Award className="h-3.5 w-3.5" /> {isStageView ? "Colocação" : "Pódios"}
              </span>
              <p className="mt-1 text-2xl font-black text-white tabular-nums">
                {isStageView && sc ? `${sc.colocacao}º` : player.podios}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className={`rounded-2xl border p-3 text-center transition-all shadow-sm ${
                isStageView
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-white/[0.04] bg-white/[0.02]"
              }`}
            >
              <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" /> Win Rate
              </span>
              <p className="mt-1 text-2xl font-black text-white tabular-nums">
                {isStageView ? `${stageWinRate}%` : `${seasonWinRate}%`}
              </p>
            </motion.div>
          </div>

          {/* Resumo de Partidas (Etapa vs Temporada) */}
          <div className="mt-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4">
            <div className="flex justify-between text-xs text-slate-300">
              <span>
                Partidas {isStageView ? "na Rodada" : "no Ranking"}:{" "}
                <strong className="text-white tabular-nums">
                  {isStageView ? stageTotalJogos : seasonTotalJogos}
                </strong>
              </span>
              <span>
                {isStageView ? (
                  <>
                    Multiplicador: <strong className="text-amber-400 tabular-nums">{sc?.multiplicador || 1.0}x</strong>
                  </>
                ) : (
                  <>
                    Presenças: <strong className="text-white tabular-nums">{player.participacoes} et.</strong>
                  </>
                )}
              </span>
              <span>
                {isStageView ? (
                  <>
                    Posição: <strong className="text-white tabular-nums">#{sc?.colocacao}º</strong>
                  </>
                ) : (
                  <>
                    Média: <strong className="text-white tabular-nums">#{player.mediaColocacao.toFixed(1)}</strong>
                  </>
                )}
              </span>
            </div>
            <div className="mt-2.5 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-800">
              {isStageView && sc ? (
                <>
                  <div
                    style={{ width: `${(sc.vitorias / (stageTotalJogos || 1)) * 100}%` }}
                    className="bg-emerald-500"
                    title={`Vitórias: ${sc.vitorias}`}
                  />
                  <div
                    style={{ width: `${(sc.empates / (stageTotalJogos || 1)) * 100}%` }}
                    className="bg-yellow-500"
                    title={`Empates: ${sc.empates}`}
                  />
                  <div
                    style={{ width: `${(sc.derrotas / (stageTotalJogos || 1)) * 100}%` }}
                    className="bg-rose-500"
                    title={`Derrotas: ${sc.derrotas}`}
                  />
                </>
              ) : (
                <>
                  <div
                    style={{ width: `${(player.vitorias / (seasonTotalJogos || 1)) * 100}%` }}
                    className="bg-emerald-500"
                    title={`Vitórias: ${player.vitorias}`}
                  />
                  <div
                    style={{ width: `${(player.empates / (seasonTotalJogos || 1)) * 100}%` }}
                    className="bg-yellow-500"
                    title={`Empates: ${player.empates}`}
                  />
                  <div
                    style={{ width: `${(player.derrotas / (seasonTotalJogos || 1)) * 100}%` }}
                    className="bg-rose-500"
                    title={`Derrotas: ${player.derrotas}`}
                  />
                </>
              )}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-400 tabular-nums">
              <span className="text-emerald-400 font-bold">
                V: {isStageView && sc ? sc.vitorias : player.vitorias}
              </span>
              <span className="text-yellow-400 font-bold">
                E: {isStageView && sc ? sc.empates : player.empates}
              </span>
              <span className="text-rose-400 font-bold">
                D: {isStageView && sc ? sc.derrotas : player.derrotas}
              </span>
            </div>
          </div>

          {/* Seção Secundária: Histórico da Temporada (se na visualização de etapa) */}
          {isStageView && (
            <div className="mt-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-3.5 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5 text-amber-400 text-[11px] uppercase tracking-wider">
                  <Medal className="h-3.5 w-3.5" /> Posição Consolidada na Temporada
                </span>
                <span className="text-white font-black">
                  #{player.posicaoOficial ? `${player.posicaoOficial}º Geral` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Total de Pontos Acumulados:</span>
                <span className="font-bold text-slate-200">{player.pontos} PTS</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Presenças no Ano:</span>
                <span className="font-bold text-slate-200">{player.participacoes} etapas</span>
              </div>
            </div>
          )}

          {/* Histórico Etapa por Etapa */}
          <div className="mt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              Histórico de Colocações na Temporada
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {etapasArray.map((colocacao, idx) => {
                const num = Number(colocacao);
                const isPodium = !isNaN(num) && num > 0 && num <= 4;
                const isAbsent = colocacao === "-" || !colocacao;
                const isCurrentStage = isStageView && sc?.numeroEtapa === idx + 1;

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center h-10 w-10 rounded-lg text-xs font-bold border transition-all cursor-default ${
                      isCurrentStage
                        ? "bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-md shadow-amber-400/30"
                        : isPodium
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-sm shadow-yellow-500/20"
                        : isAbsent
                        ? "bg-slate-800/30 text-slate-500 border-white/5 font-normal"
                        : "bg-slate-800 text-slate-200 border-white/10"
                    }`}
                    title={`Etapa #${idx + 1}: ${isAbsent ? "Não participou" : `${colocacao}º Lugar`}`}
                  >
                    <span
                      className={`text-[9px] font-medium leading-none ${
                        isCurrentStage ? "text-slate-950 font-black" : "text-slate-400"
                      }`}
                    >
                      E{idx + 1}
                    </span>
                    <span className="leading-none mt-0.5">{isAbsent ? "—" : `${colocacao}º`}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Botão Fechar Inferior com iOS Tap Feedback */}
          <div className="mt-6 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Fechar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
