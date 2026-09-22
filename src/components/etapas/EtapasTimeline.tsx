"use client";

import { useState } from "react";
import { Calendar, Trophy, Users, CheckCircle2, ChevronRight, X, Award, Shield } from "lucide-react";

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
      {/* Grid de Cards de Etapas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {etapas.map((etapa, idx) => {
          const isPremier = etapa.multiplicador > 1.0;
          const [year, month, day] = etapa.data.split("-");
          const formattedDate = `${day}/${month}/${year}`;
          const stageNumber = etapas.length - idx;

          return (
            <div
              key={etapa.id || idx}
              onClick={() => setSelectedEtapa(etapa)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-xl transition-all cursor-pointer hover:-translate-y-1 hover:bg-slate-900/90 shadow-lg ${
                isPremier
                  ? "border-amber-500/40 bg-slate-900/75 shadow-amber-500/10 hover:border-amber-400/60"
                  : "border-white/10 bg-slate-900/60 hover:border-white/20"
              }`}
            >
              {/* Topo do Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-md ${
                      isPremier
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950"
                        : "bg-slate-800 text-blue-400 border border-white/10"
                    }`}
                  >
                    E#{stageNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                        {etapa.tipo}
                      </h3>
                      {isPremier && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/40">
                          {etapa.multiplicador}x PTS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Oficial</span>
                </div>
              </div>

              {/* Informações da Etapa: Campeão e Participantes */}
              <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/50 p-3 space-y-1.5">
                {etapa.campeaoNome ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
                      <Trophy className="h-3.5 w-3.5" /> Campeão:
                    </span>
                    <strong className="text-white font-black truncate max-w-[160px]">
                      {etapa.campeaoNome}
                    </strong>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Resultados consolidados</div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-500" /> Participantes:
                  </span>
                  <span className="font-bold text-slate-200">
                    {etapa.totalJogadores > 0 ? `${etapa.totalJogadores} jogadores` : "Ver Tabela"}
                  </span>
                </div>
              </div>

              {/* Rodapé: Ver Standings */}
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>Ver Classificação da Etapa</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes da Etapa */}
      {selectedEtapa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={() => setSelectedEtapa(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

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
                <span className="text-xs text-slate-400 font-mono">
                  Data: {selectedEtapa.data}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                Classificação Oficial da Etapa
              </h3>
              <p className="text-xs text-slate-400">
                Total de <strong>{selectedEtapa.resultados.length}</strong> jogadores participaram desta rodada oficial TOM
              </p>
            </div>

            {/* Tabela de Standings da Etapa com Scroll */}
            <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/60 pr-1">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="sticky top-0 bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-2.5 pl-3 pr-2 text-center w-10">#</th>
                    <th className="px-3 py-2.5">Jogador</th>
                    <th className="px-2 py-2.5 text-center">Cat</th>
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
                        <td className="py-2.5 pl-3 pr-2 text-center">
                          {isWinner ? (
                            <span className="text-sm">🥇</span>
                          ) : res.colocacao === 2 ? (
                            <span className="text-sm">🥈</span>
                          ) : res.colocacao === 3 ? (
                            <span className="text-sm">🥉</span>
                          ) : res.colocacao === 4 ? (
                            <span className="text-xs font-bold text-blue-400">4º</span>
                          ) : (
                            <span className="text-slate-400 font-mono">{res.colocacao}º</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-bold text-white">{res.jogadorNome}</div>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                            {(res.categoria || "Master").slice(0, 3).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-sm text-yellow-400">
                          {res.pontos}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-300">
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
              <button
                onClick={() => setSelectedEtapa(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
