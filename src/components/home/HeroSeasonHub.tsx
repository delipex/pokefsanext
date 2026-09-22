"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { PlayerModalData, PlayerModal } from "@/components/ranking/PlayerModal";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export interface HeroSeasonHubProps {
  temporada: number;
  totalEtapas: number;
  totalJogadores: number;
  top4?: PlayerModalData[];
  lider?: {
    nome: string;
    pontos: number;
  } | null;
  topDeck?: {
    nome: string;
    porcentagem: string;
  } | null;
  awards?: {
    gold: {
      player: string;
      id: string;
      wins: number;
      losses: number;
      draws: number;
      winRate: string;
      points: number;
    } | null;
    gym: {
      player: string;
      id: string;
      participations: number;
      points: number;
    } | null;
    ditto: {
      player: string;
      count: number;
      decks: any[];
      participations: number;
    } | null;
    murcha: {
      player: string;
      id: string;
      wins: number;
      losses: number;
      participations: number;
    } | null;
  };
  nextEvent?: {
    id: number;
    data: string;
    horario?: string | null;
    evento: string;
    tipo?: string | null;
    local?: string | null;
    linkLocal?: string | null;
    linkMaps?: string | null;
    status?: string | null;
    linkInscricao?: string | null;
    descricao?: string | null;
    foto?: string | null;
  } | null;
}

// Helper para formatar a data do evento
function formatEventDate(rawDate?: string) {
  if (!rawDate) return "Em breve";
  const clean = rawDate.replace(/\//g, "-").trim();
  const parts = clean.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return rawDate;
}

export function HeroSeasonHub({
  temporada = 5,
  top4 = [],
  nextEvent,
}: HeroSeasonHubProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModalData | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: string;
    hours: string;
    mins: string;
    secs: string;
  }>({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00",
  });

  useEffect(() => {
    if (!nextEvent?.data) return;

    const parseTargetDate = () => {
      const rawDate = nextEvent.data.replace(/\//g, "-").trim();
      const parts = rawDate.split("-");
      let y = 2026, m = 9, d = 24;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
          d = parseInt(parts[2], 10);
        } else {
          d = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10);
          y = parseInt(parts[2], 10);
        }
      }
      const timeParts = (nextEvent.horario || "18:30").split(":");
      const hr = parseInt(timeParts[0] || "18", 10);
      const min = parseInt(timeParts[1] || "30", 10);
      return new Date(y, m - 1, d, hr, min, 0);
    };

    const target = parseTargetDate();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance <= 0) {
        setTimeLeft({ days: "00", hours: "00", mins: "00", secs: "00" });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        mins: String(mins).padStart(2, "0"),
        secs: String(secs).padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  // Fallbacks do Evento
  const formattedEventDate = formatEventDate(nextEvent?.data);
  const eventTime = nextEvent?.horario || "18:30";
  const eventTitle = nextEvent?.evento || `Sessão #21 de Liga (Torneio TBT) [${temporada}ª Temporada]`;
  const eventDesc = nextEvent?.descricao || "Formato Standard. Traga seu melhor deck!";
  const eventLocation = nextEvent?.local || "Livraria Atlântica";
  const eventMapUrl = nextEvent?.linkMaps || nextEvent?.linkLocal || "https://maps.google.com";

  // Badges estilizados de Posição
  const getBadgeStyle = (pos: number) => {
    if (pos === 1) {
      return {
        bg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30",
        border: "border-yellow-300/60",
      };
    }
    if (pos === 2) {
      return {
        bg: "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-950 font-black shadow-md shadow-slate-400/20",
        border: "border-slate-300/50",
      };
    }
    if (pos === 3) {
      return {
        bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 text-white font-black shadow-md shadow-orange-600/20",
        border: "border-amber-600/50",
      };
    }
    return {
      bg: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 text-white font-black shadow-md shadow-blue-500/20",
      border: "border-blue-400/50",
    };
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* =========================================================
            COLUNA 1: TOP 4 DA TEMPORADA ATUAL (Esquerda)
           ========================================================= */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Header da Coluna */}
          <div className="flex items-center gap-2 px-1">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Top 4 da Temporada Atual
            </h2>
          </div>

          {/* Lista dos 4 Cards */}
          <div className="flex-1 flex flex-col justify-between space-y-2.5">
            {top4.slice(0, 4).map((player, index) => {
              const pos = index + 1;
              const badgeStyle = getBadgeStyle(pos);
              const energyCfg = getMultiEnergyConfig(player.ultimoDeckEnergia || "colorless");

              return (
                <div
                  key={player.jogadorId || player.jogadorNome}
                  onClick={() => setSelectedPlayer(player)}
                  className="group relative flex items-center justify-between gap-3.5 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-slate-800/80 hover:scale-[1.01] cursor-pointer"
                >
                  {/* Badge Numérico da Posição */}
                  <div
                    className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-base sm:text-lg shrink-0 border ${badgeStyle.bg} ${badgeStyle.border}`}
                  >
                    {pos}
                  </div>

                  {/* Informações do Jogador e Deck */}
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-white group-hover:text-amber-400 transition-colors truncate">
                        {player.jogadorNome}
                      </span>
                      <CategoryBadge category={player.categoria} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                      {/* Energy Dot / Ícone de Energia */}
                      <div className="flex items-center -space-x-1 shrink-0">
                        {energyCfg.types.map((t, i) => (
                          <span
                            key={i}
                            className="h-2 w-2 rounded-full border border-black/50 shadow-sm shrink-0"
                            style={{ backgroundColor: t.hex, boxShadow: `0 0 4px ${t.hex}` }}
                          />
                        ))}
                      </div>
                      <span className="truncate max-w-[200px] sm:max-w-[260px] text-slate-300">
                        {player.ultimoDeck || "Sem deck registrado"}
                      </span>
                    </div>
                  </div>

                  {/* Pontos e Estatísticas */}
                  <div className="text-right shrink-0">
                    <div className="font-title font-black text-base sm:text-lg text-[#ffcb05] tracking-wide">
                      {player.pontos}{" "}
                      <span className="text-[11px] font-semibold text-slate-400">PTS</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {player.podios} pódio(s) &bull; média{" "}
                      {player.mediaColocacao
                        ? player.mediaColocacao.toFixed(1).replace(".", ",")
                        : "0"}
                      &deg;
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            COLUNA 2: PRÓXIMO EVENTO (Direita)
           ========================================================= */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Header da Coluna */}
          <div className="flex items-center gap-2 px-1">
            <Calendar className="h-4 w-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Próximo Evento
            </h2>
          </div>

          {/* Card do Evento */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-[#0f172a]/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
            {/* Header com Alerta e Data */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-xs font-bold text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                Próximo Torneio
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#ffcb05]">
                {formattedEventDate} às {eventTime}
              </span>
            </div>

            {/* Título e Descrição */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
                {eventTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                {eventDesc}
              </p>
            </div>

            {/* Timer Regressivo (4 Blocos Quadrados) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 py-1">
              {[
                { label: "DIAS", value: timeLeft.days },
                { label: "HORAS", value: timeLeft.hours },
                { label: "MINS", value: timeLeft.mins },
                { label: "SEGS", value: timeLeft.secs },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#0a0f1d]/90 py-3 px-2 shadow-inner"
                >
                  <span className="font-mono text-xl sm:text-2xl font-black text-[#ffcb05]">
                    {item.value}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Rodapé: Local e Inscrição */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
              <a
                href={eventMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>Local: {eventLocation}</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              {nextEvent?.linkInscricao && (
                <a
                  href={nextEvent.linkInscricao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[11px] font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all"
                >
                  Inscrever-se
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Jogador */}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
