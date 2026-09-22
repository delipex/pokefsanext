"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PlayerModalData, PlayerModal } from "./PlayerModal";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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

  const podiumOrder = [
    { rank: 2, player: top4[1], icon: "🥈", label: "Vice-Campeão", border: "border-slate-400/40", glow: "shadow-slate-400/20", height: "md:h-64", isChampion: false },
    { rank: 1, player: top4[0], icon: "🏆", label: "Líder Geral", border: "border-yellow-400/70", glow: "shadow-yellow-500/30", height: "md:h-72", isChampion: true },
    { rank: 3, player: top4[2], icon: "🥉", label: "3º Colocado", border: "border-amber-600/40", glow: "shadow-amber-600/20", height: "md:h-60", isChampion: false },
    { rank: 4, player: top4[3], icon: "🎖️", label: "4º Colocado", border: "border-blue-400/30", glow: "shadow-blue-500/15", height: "md:h-56", isChampion: false },
  ];

  return (
    <section className="relative my-6 sm:my-8">
      {/* Título Único da Seção (Sem textos redundantes) com Ação */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Pódio dos Campeões
        </h2>

        {showFullLink && (
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl"
          >
            Ver Tabela Completa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Grid do Pódio com Glassmorphism e Efeito Foil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {podiumOrder.map(({ rank, player, icon, label, border, glow, height, isChampion }) => {
          if (!player) return null;

          return (
            <div
              key={player.jogadorId || rank}
              onClick={() => handlePlayerClick(player)}
              className={`group relative flex flex-col justify-between rounded-3xl border ${border} ${
                isChampion ? "foil-card bg-slate-900/80" : "bg-slate-900/60"
              } p-5 shadow-2xl ${glow} backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:bg-slate-900/95 cursor-pointer ${height}`}
            >
              {/* Efeito Brilho do Campeão */}
              {isChampion && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3.5 py-0.5 text-[10px] font-black text-slate-950 shadow-lg shadow-yellow-500/40 flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  Líder da Temporada
                </div>
              )}

              {/* Cabeçalho do Card */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl drop-shadow-md">{icon}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </span>
                    <span className="block text-xs font-bold text-blue-400">
                      {player.categoria}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {player.pontos}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                    PTS
                  </span>
                </div>
              </div>

              {/* Centro: Nome do Jogador em Alta Evidência + Último Deck Utilizado */}
              <div className="my-3 space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-400 transition-colors tracking-tight leading-snug line-clamp-1">
                  {player.jogadorNome}
                </h3>

                {player.ultimoDeck && (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-slate-200 shadow-sm backdrop-blur-md"
                    style={{
                      background: getMultiEnergyConfig(player.ultimoDeckEnergia || "").gradientBg,
                      border: getMultiEnergyConfig(player.ultimoDeckEnergia || "").borderStyle,
                    }}
                  >
                    <div className="flex items-center -space-x-1 shrink-0">
                      {getMultiEnergyConfig(player.ultimoDeckEnergia || "").types.map((t, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full border border-black/40 shadow-sm shrink-0"
                          style={{ backgroundColor: t.hex, boxShadow: `0 0 5px ${t.hex}` }}
                        />
                      ))}
                    </div>
                    <span className="text-slate-200 font-medium truncate max-w-[130px]">{player.ultimoDeck}</span>
                  </div>
                )}
              </div>

              {/* Rodapé do Card: Stats */}
              <div className="grid grid-cols-3 gap-1.5 border-t border-white/10 pt-3 text-center text-xs">
                <div className="rounded-xl bg-slate-800/60 p-1.5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">V/E/D</span>
                  <span className="font-bold text-slate-200">{player.vitorias}/{player.empates}/{player.derrotas}</span>
                </div>
                <div className="rounded-xl bg-slate-800/60 p-1.5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Pódios</span>
                  <span className="font-bold text-yellow-400">{player.podios}x</span>
                </div>
                <div className="rounded-xl bg-slate-800/60 p-1.5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Média</span>
                  <span className="font-bold text-slate-200">#{player.mediaColocacao.toFixed(1)}</span>
                </div>
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
