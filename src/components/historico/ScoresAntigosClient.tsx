"use client";

import { useState } from "react";
import { Search, Trophy, History } from "lucide-react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export interface ScoreItem {
  id: number;
  temporada: string;
  dataFechamento: string | null;
  pos: number;
  jogador: string;
  categoria: string | null;
  pontos: string | null;
  deck: string | null;
}

interface ScoresAntigosClientProps {
  scores: ScoreItem[];
}

export function ScoresAntigosClient({ scores }: ScoresAntigosClientProps) {
  const seasons = Array.from(new Set(scores.map((s) => s.temporada)));
  const [selectedSeason, setSelectedSeason] = useState<string>(seasons[0] || "Temporada #4");
  const [search, setSearch] = useState<string>("");

  const filteredScores = scores.filter((s) => {
    const matchSeason = s.temporada === selectedSeason;
    const matchSearch =
      s.jogador.toLowerCase().includes(search.toLowerCase()) ||
      (s.deck && s.deck.toLowerCase().includes(search.toLowerCase()));
    return matchSeason && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Abas das Temporadas e Campo de Busca Bento */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {seasons.map((season) => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSeason === season
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white border border-white/[0.05]"
              }`}
            >
              {season}
            </button>
          ))}
        </div>

        <div className="relative w-full min-w-0 sm:min-w-[240px] flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar jogador ou deck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/30 transition-all backdrop-blur-xl"
          />
        </div>
      </div>

      {/* Tabela de Scores Antigos Bento */}
      <div className="overflow-x-auto rounded-3xl border border-white/[0.04] bg-white/[0.02] shadow-2xl backdrop-blur-2xl">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 pl-4 pr-2 text-center w-12">#</th>
              <th className="px-4 py-3.5">Jogador</th>
              <th className="px-4 py-3.5 text-right font-bold text-amber-400">Pontos Finais</th>
              <th className="px-4 py-3.5">Deck Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filteredScores.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  Nenhum registro encontrado para esta temporada.
                </td>
              </tr>
            ) : (
              filteredScores.map((score, idx) => {
                const isChampion = score.pos === 1;

                return (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.04] transition-colors even:bg-white/[0.01]"
                  >
                    <td className="py-3.5 pl-4 pr-2 text-center">
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
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{score.jogador}</span>
                        <CategoryBadge category={score.categoria} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-sm text-amber-400">
                      {score.pontos || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-medium">{score.deck || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
