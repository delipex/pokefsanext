"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Trophy, Award, Medal } from "lucide-react";
import Link from "next/link";
import { PlayerModalData, PlayerModal } from "./PlayerModal";
import { EnergyBadge } from "../ui/EnergyBadge";
import { formatCategoryAbbr } from "@/lib/theme/energy-tokens";

interface PodiumSectionProps {
  top4: PlayerModalData[];
  onSelectPlayer?: (player: PlayerModalData) => void;
  showFullLink?: boolean;
}

export function PodiumSection({ top4, onSelectPlayer, showFullLink = true }: PodiumSectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModalData | null>(null);

  if (!top4 || top4.length === 0) return null;

  const handlePlayerClick = (player: PlayerModalData) => {
    if (onSelectPlayer) {
      onSelectPlayer(player);
    } else {
      setSelectedPlayer(player);
    }
  };

  // Ordem visual do Pódio: 2º (Prata), 1º (Ouro), 3º (Bronze), 4º (Top 4)
  const podiumCards = [
    {
      pos: 2,
      player: top4[1],
      label: "2º Vice-Líder",
      badgeClass: "bg-slate-400/20 text-slate-200 border-slate-400/40",
      borderClass: "border-slate-400/40 hover:border-slate-300",
      bgClass: "bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950",
      ptsColor: "text-slate-200",
      icon: "🥈",
      orderClass: "order-2 lg:order-1",
      elevationClass: "lg:translate-y-2",
    },
    {
      pos: 1,
      player: top4[0],
      label: "1º Líder da Temporada",
      badgeClass: "bg-amber-400/20 text-amber-300 border-amber-400/60 font-black",
      borderClass: "border-amber-400/80 hover:border-amber-300 shadow-xl shadow-amber-500/15",
      bgClass: "bg-gradient-to-b from-amber-500/15 via-slate-900/95 to-slate-950",
      ptsColor: "text-amber-400",
      icon: "🏆",
      orderClass: "order-1 lg:order-2",
      elevationClass: "lg:-translate-y-2 ring-1 ring-amber-400/40",
      isChampion: true,
    },
    {
      pos: 3,
      player: top4[2],
      label: "3º Colocado",
      badgeClass: "bg-amber-700/20 text-amber-400 border-amber-600/40",
      borderClass: "border-amber-600/40 hover:border-amber-500",
      bgClass: "bg-gradient-to-b from-amber-900/20 via-slate-900/90 to-slate-950",
      ptsColor: "text-amber-300",
      icon: "🥉",
      orderClass: "order-3 lg:order-3",
      elevationClass: "lg:translate-y-4",
    },
    {
      pos: 4,
      player: top4[3],
      label: "4º Colocado",
      badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      borderClass: "border-blue-500/30 hover:border-blue-400",
      bgClass: "bg-gradient-to-b from-blue-950/20 via-slate-900/90 to-slate-950",
      ptsColor: "text-blue-400",
      icon: "🎖️",
      orderClass: "order-4 lg:order-4",
      elevationClass: "lg:translate-y-6",
    },
  ];

  return (
    <section className="space-y-4">
      {/* Header do Pódio */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pódio dos Campeões
          </h2>
        </div>

        {showFullLink && (
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <span>Ver Ranking Geral</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Grid do Pódio Escalonado e Compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
        {podiumCards.map(({ pos, player, label, badgeClass, borderClass, bgClass, ptsColor, icon, orderClass, elevationClass, isChampion }) => {
          if (!player) return null;

          return (
            <div
              key={player.jogadorId || pos}
              onClick={() => handlePlayerClick(player)}
              className={`group relative rounded-2xl border ${borderClass} ${bgClass} ${orderClass} ${elevationClass} p-4.5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between space-y-3.5`}
            >
              {/* Badge de Campeão em Destaque */}
              {isChampion && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-0.5 text-[9px] font-black uppercase text-slate-950 shadow-md shadow-amber-500/30 flex items-center gap-1 tracking-wider whitespace-nowrap">
                  <Sparkles className="h-3 w-3" />
                  <span>Líder da Temporada</span>
                </div>
              )}

              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0 drop-shadow">{icon}</span>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeClass}`}>
                      {label}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-black tracking-tight ${ptsColor}`}>
                    {player.pontos}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 block -mt-1 uppercase">
                    PTS
                  </span>
                </div>
              </div>

              {/* Nome do Competidor + Categoria */}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-tight truncate">
                  {player.jogadorNome}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase">
                    {formatCategoryAbbr(player.categoria)}
                  </span>
                  {player.ultimoDeck && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 truncate">
                        <EnergyBadge energyRaw={player.ultimoDeckEnergia || "colorless"} size="sm" showLabel={false} />
                        <span className="text-slate-300 font-sans text-xs truncate max-w-[120px]">
                          {player.ultimoDeck}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rodapé Compacto com Estatísticas */}
              <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/5 font-mono text-slate-300">
                <span className="font-bold text-white">
                  <span className="text-emerald-400">{player.vitorias}V</span> - <span className="text-rose-400">{player.derrotas}D</span>
                </span>
                <span className="text-amber-300 font-bold">
                  {player.podios} {player.podios === 1 ? "pódio" : "pódios"}
                </span>
                <span className="text-slate-400">#{player.mediaColocacao.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Interno de Detalhes do Jogador */}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </section>
  );
}
