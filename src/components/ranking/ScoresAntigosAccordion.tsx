"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, History, Search, Trophy } from "lucide-react";
import { ScoreItem } from "@/components/historico/ScoresAntigosClient";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface ScoresAntigosAccordionProps {
  scores: ScoreItem[];
}

export function ScoresAntigosAccordion({ scores }: ScoresAntigosAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const seasons = Array.from(new Set(scores.map((s) => s.temporada)));
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredScores = scores.filter((s) => {
    const matchSeason = selectedSeason === "all" || s.temporada === selectedSeason;
    const matchSearch =
      s.jogador.toLowerCase().includes(search.toLowerCase()) ||
      (s.deck && s.deck.toLowerCase().includes(search.toLowerCase()));
    return matchSeason && matchSearch;
  });

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl backdrop-blur-xl transition-all overflow-hidden">
      {/* Cabeçalho Clicável do Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Consultar Scores Antigos
              </h3>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-400 border border-purple-500/20">
                Temporadas #1 a #4
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consulte as classificações finais históricas das temporadas anteriores da Liga.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold shrink-0">
          <span>{isOpen ? "Ocultar" : "Expandir Histórico"}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 border border-white/10 text-white">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Conteúdo Expansível */}
      {isOpen && (
        <div className="border-t border-white/10 p-5 space-y-5 bg-slate-950/40">
          {/* Controles: Seletor de Temporada e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedSeason("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  selectedSeason === "all"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5"
                }`}
              >
                Todas as Temporadas
              </button>
              {seasons.map((season) => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    selectedSeason === season
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5"
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar jogador ou deck antigo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Tabela de Resultados Históricos */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-white/10 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 pl-4 pr-2 text-center w-12">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-3 py-3 text-center">Temporada</th>
                  <th className="px-4 py-3 text-right font-bold text-yellow-400">Pontos</th>
                  <th className="px-4 py-3">Deck Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredScores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Nenhum resultado histórico encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredScores.map((score, idx) => {
                    const isChampion = score.pos === 1;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-purple-600/10 transition-colors ${
                          isChampion ? "bg-yellow-500/10 font-medium" : ""
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          {isChampion ? (
                            <span className="text-sm">🥇</span>
                          ) : score.pos === 2 ? (
                            <span className="text-sm">🥈</span>
                          ) : score.pos === 3 ? (
                            <span className="text-sm">🥉</span>
                          ) : (
                            <span className="tabular-nums font-bold text-slate-400">{score.pos}º</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{score.jogador}</span>
                            <CategoryBadge category={score.categoria} size="sm" />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/20">
                            {score.temporada}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-xs text-yellow-400">
                          {score.pontos || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 font-medium text-xs">
                          {score.deck || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
