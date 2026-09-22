"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trophy, Users, CheckCircle2, ChevronRight, X, Award, Shield } from "lucide-react";
import { formatCategoryAbbr } from "@/lib/theme/energy-tokens";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export interface StageResult {
  id: number;
  jogadorId: string | null;
  jogadorNome: string;
  categoria: string | null;
  colocacao: number;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
}

export interface EtapaSummaryItem {
  id: number;
  data: string;
  tipo: string;
  multiplicador: number;
  temporada: number;
  status: string;
  totalJogadores: number;
  campeaoNome: string | null;
  campeaoId: string | null;
  resultados: StageResult[];
}

interface EtapasTimelineProps {
  etapas: EtapaSummaryItem[];
}

export function EtapasTimeline({ etapas }: EtapasTimelineProps) {
  const [selectedEtapa, setSelectedEtapa] = useState<EtapaSummaryItem | null>(null);

  if (!etapas || etapas.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Grid de Cards de Etapas Bento-Grid com Efeito iOS Spring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {etapas.map((etapa, idx) => {
          const isPremier = etapa.multiplicador > 1.0;
          const [year, month, day] = etapa.data.split("-");
          const formattedDate = `${day}/${month}/${year}`;
          const stageNumber = etapas.length - idx;

          return (
            <motion.div
              key={etapa.id || idx}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedEtapa(etapa)}
              className={`group relative flex flex-col justify-between rounded-3xl border p-5 sm:p-6 backdrop-blur-2xl transition-colors duration-300 cursor-pointer shadow-xl ${
                isPremier
                  ? "border-amber-400/30 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] hover:border-amber-400/50 shadow-amber-500/5"
                  : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]"
              }`}
            >
              {/* Header do Card com Número e Tags */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                      Etapa #{stageNumber}
                    </span>
                    {isPremier ? (
                      <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 shadow-sm shadow-amber-500/20">
                        PREMIER {etapa.multiplicador}x
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                        {etapa.tipo}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {formattedDate}
                  </span>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>

              {/* Corpo com Campeão e Participantes */}
              <div className="my-5 space-y-2.5">
                {etapa.campeaoNome ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider block">
                        Campeão da Etapa
                      </span>
                      <span className="text-sm font-black text-white truncate block">
                        {etapa.campeaoNome}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3 text-slate-400">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold">Etapa Concluída</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <strong className="text-slate-200 tabular-nums">{etapa.totalJogadores}</strong> atletas
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Oficial TOM
                  </span>
                </div>
              </div>

              {/* Botão Inferior de Standings */}
              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors">
                <span>Ver Classificação Completa</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal de Detalhes da Etapa com Animação iOS Sheet */}
      <AnimatePresence>
        {selectedEtapa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEtapa(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-white/[0.08] bg-slate-950/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 z-10"
            >
              {/* iOS Handle Indicator */}
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-2 mb-3" />

              {/* Fechar */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedEtapa(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Cabeçalho do Modal */}
              <div className="pr-8 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-black text-blue-300 border border-blue-500/30">
                    {selectedEtapa.tipo}
                  </span>
                  {selectedEtapa.multiplicador > 1 && (
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-black text-amber-300 border border-amber-500/30">
                      {selectedEtapa.multiplicador}x Pontos
                    </span>
                  )}
                  <span className="text-xs text-slate-400 tabular-nums">
                    Data: {selectedEtapa.data}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Classificação Oficial da Etapa
                </h3>
                <p className="text-xs text-slate-400">
                  Total de <strong className="tabular-nums">{selectedEtapa.resultados.length}</strong> jogadores participaram desta rodada oficial TOM
                </p>
              </div>

              {/* Tabela de Standings da Etapa com Scroll */}
              <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-slate-900/60 pr-1">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="sticky top-0 bg-slate-950/95 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 z-10">
                    <tr>
                      <th className="py-2.5 pl-3 pr-2 text-center w-10">#</th>
                      <th className="px-3 py-2.5">Treinador</th>
                      <th className="px-3 py-2.5 text-right font-bold text-yellow-400">PTS</th>
                      <th className="px-3 py-2.5 text-center">V / E / D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedEtapa.resultados.map((res, rIdx) => {
                      const isWinner = res.colocacao === 1;
                      const isTop4 = res.colocacao <= 4;

                      return (
                        <tr
                          key={rIdx}
                          className={`hover:bg-blue-500/10 transition-colors ${
                            isWinner ? "bg-yellow-500/10 font-bold" : isTop4 ? "bg-slate-800/30" : ""
                          }`}
                        >
                          <td className="py-2.5 pl-3 pr-2 text-center tabular-nums">
                            {isWinner ? (
                              <span className="text-sm">🥇</span>
                            ) : res.colocacao === 2 ? (
                              <span className="text-sm">🥈</span>
                            ) : res.colocacao === 3 ? (
                              <span className="text-sm">🥉</span>
                            ) : res.colocacao === 4 ? (
                              <span className="text-xs font-bold text-blue-400">4º</span>
                            ) : (
                              <span className="text-slate-400 font-bold">{res.colocacao}º</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white">{res.jogadorNome}</span>
                              <CategoryBadge category={res.categoria} size="sm" />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-sm text-yellow-400 tabular-nums">
                            {res.pontos}
                          </td>
                          <td className="px-3 py-2.5 text-center tabular-nums text-slate-300">
                            <span className="text-emerald-400 font-bold">{res.vitorias}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-yellow-400 font-bold">{res.empates}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="text-rose-400 font-bold">{res.derrotas}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé do Modal */}
              <div className="mt-4 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedEtapa(null)}
                  className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Fechar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
