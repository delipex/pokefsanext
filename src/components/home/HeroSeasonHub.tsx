"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Calendar,
  MapPin,
  ExternalLink,
  Crown,
  Clock,
  Swords,
  Trophy,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
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
  totalEtapas = 0,
  totalJogadores = 0,
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
  const eventTitle = nextEvent?.evento || `Sessão #${totalEtapas + 1} de Liga (Torneio TBT)`;
  const eventDesc = nextEvent?.descricao || "Formato Standard oficial Play! Pokémon. Traga seu deck de 60 cartas!";
  const eventLocation = nextEvent?.local || "Livraria Atlântica";
  const eventMapUrl = nextEvent?.linkMaps || nextEvent?.linkLocal || "https://maps.google.com";
  const stageType = nextEvent?.tipo || "Standard";

  // Configuração visual personalizada e refinada para cada card de Pódio (1º ao 4º)
  const getPodiumCardConfig = (pos: number) => {
    if (pos === 1) {
      return {
        containerClass:
          "border-amber-400/40 bg-gradient-to-r from-amber-500/[0.12] via-[#0f172a]/90 to-[#0b1329]/90 shadow-[0_4px_20px_rgba(245,158,11,0.12)] hover:border-amber-400/70 hover:shadow-[0_4px_28px_rgba(245,158,11,0.22)]",
        badgeStyle: {
          bg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/50",
          border: "border-amber-200/80",
        },
        ptsColor: "text-[#ffcb05] drop-shadow-[0_0_8px_rgba(255,203,5,0.35)]",
        seal: (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950 shadow-md shadow-amber-500/25 tracking-wider">
            <Crown className="h-2.5 w-2.5 fill-slate-950" /> Líder da Liga
          </span>
        ),
      };
    }
    if (pos === 2) {
      return {
        containerClass:
          "border-slate-300/25 bg-gradient-to-r from-slate-400/[0.08] via-[#0f172a]/90 to-[#0b1329]/90 shadow-[0_4px_16px_rgba(148,163,184,0.06)] hover:border-slate-300/50 hover:shadow-[0_4px_24px_rgba(148,163,184,0.14)]",
        badgeStyle: {
          bg: "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-950 font-black shadow-md shadow-slate-300/25 ring-2 ring-slate-200/40",
          border: "border-slate-200/60",
        },
        ptsColor: "text-slate-100",
        seal: (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/15 border border-slate-300/30 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300 tracking-wider">
            🥈 Vice-Líder
          </span>
        ),
      };
    }
    if (pos === 3) {
      return {
        containerClass:
          "border-amber-700/30 bg-gradient-to-r from-amber-800/[0.08] via-[#0f172a]/90 to-[#0b1329]/90 shadow-[0_4px_16px_rgba(180,83,9,0.06)] hover:border-amber-600/50 hover:shadow-[0_4px_24px_rgba(180,83,9,0.14)]",
        badgeStyle: {
          bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 font-black shadow-md shadow-amber-900/30 ring-2 ring-amber-600/30",
          border: "border-amber-500/40",
        },
        ptsColor: "text-amber-200/90",
        seal: null,
      };
    }
    return {
      containerClass:
        "border-blue-500/25 bg-gradient-to-r from-blue-600/[0.08] via-[#0f172a]/90 to-[#0b1329]/90 shadow-[0_4px_16px_rgba(37,99,235,0.06)] hover:border-blue-400/50 hover:shadow-[0_4px_24px_rgba(37,99,235,0.14)]",
      badgeStyle: {
        bg: "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 text-white font-black shadow-md shadow-blue-500/30 ring-2 ring-blue-400/30",
        border: "border-blue-400/40",
      },
      ptsColor: "text-blue-200/90",
      seal: null,
    };
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* =========================================================
            COLUNA 1: PÓDIO DA TEMPORADA ATUAL (Esquerda)
           ========================================================= */}
        <div className="lg:col-span-7 flex flex-col space-y-2.5">
          {/* Header da Coluna */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 stroke-current fill-none stroke-[2.2]"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 19h20" />
                <path d="M4 19V11h5v8" />
                <path d="M9 19V6h6v13" />
                <path d="M15 19v-5h5v5" />
              </svg>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Pódio Atual da Temporada
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Temporada #{temporada}
            </span>
          </div>

          {/* Lista dos 4 Cards Compacta e Limpa */}
          <div className="flex-1 flex flex-col justify-between space-y-2">
            {top4.slice(0, 4).map((player, index) => {
              const pos = index + 1;
              const cardCfg = getPodiumCardConfig(pos);
              const energyCfg = getMultiEnergyConfig(player.ultimoDeckEnergia || "colorless");

              return (
                <div
                  key={player.jogadorId || player.jogadorNome}
                  onClick={() => setSelectedPlayer(player)}
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-2.5 sm:p-3 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer ${cardCfg.containerClass}`}
                >
                  {/* Badge Numérico da Posição */}
                  <div
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm sm:text-base shrink-0 border ${cardCfg.badgeStyle.bg} ${cardCfg.badgeStyle.border}`}
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
                      {cardCfg.seal}
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
                      <span className="truncate max-w-[220px] sm:max-w-[280px] text-slate-300 font-medium">
                        {player.ultimoDeck || "Sem deck registrado"}
                      </span>
                    </div>
                  </div>

                  {/* Pontos Limpos */}
                  <div className="text-right shrink-0">
                    <div className={`font-black text-base sm:text-lg tracking-wide tabular-nums ${cardCfg.ptsColor}`}>
                      {player.pontos}{" "}
                      <span className="text-[11px] font-semibold text-slate-400">PTS</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            COLUNA 2: PRÓXIMO EVENTO (Direita - Altura Total & Rica)
           ========================================================= */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Header da Coluna */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Próximo Evento
              </h2>
            </div>
            <Link
              href="/calendario"
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Calendário</span>
              <ArrowRight className="h-3 w-3 text-amber-400" />
            </Link>
          </div>

          {/* Card do Evento Enriquecido e com Altura Perfeita */}
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0f172a]/95 via-[#0b1329]/95 to-[#060a17]/95 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
            {/* Brilho decorativo no topo */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Topo do Card: Alerta com Pulso e Data em Amarelo Dourado Exclusivo */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Próximo Torneio</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#ffcb05] tabular-nums">
                <Clock className="h-3.5 w-3.5 text-[#ffcb05]" />
                <span>{formattedEventDate} às {eventTime}</span>
              </div>
            </div>

            {/* Título e Descrição do Torneio */}
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {eventTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                {eventDesc}
              </p>
            </div>

            {/* Timer Regressivo com Visual Glassmorphism Escuro e Números Claros Neutros */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                <span>Contagem Regressiva</span>
                <span className="text-slate-400 font-semibold lowercase first-letter:uppercase">faltam poucos dias</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {[
                  { label: "DIAS", value: timeLeft.days },
                  { label: "HORAS", value: timeLeft.hours },
                  { label: "MINS", value: timeLeft.mins },
                  { label: "SEGS", value: timeLeft.secs },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-[#060a17]/90 py-3 px-2 shadow-inner"
                  >
                    <span className="tabular-nums text-xl sm:text-2xl font-black text-slate-100 drop-shadow-sm">
                      {item.value}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé: Local e Botão de Ação */}
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
              <a
                href={eventMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-slate-300 hover:text-white transition-colors truncate"
              >
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">Local: {eventLocation}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              </a>

              {nextEvent?.linkInscricao ? (
                <a
                  href={nextEvent.linkInscricao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-black text-white shadow-lg shadow-blue-600/30 transition-all shrink-0"
                >
                  Inscrever-se
                </a>
              ) : (
                <Link
                  href="/calendario"
                  className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all shrink-0"
                >
                  Ver Detalhes
                </Link>
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
