"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { useRouter } from "next/navigation";
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
  exibirPodio?: boolean;
  exibirProximoEvento?: boolean;
  premierAbertas?: boolean;
  premierConfig?: Record<string, any>;
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
  exibirPodio = true,
  exibirProximoEvento = true,
  premierAbertas = false,
  premierConfig,
}: HeroSeasonHubProps) {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModalData | null>(null);

  const handleOpenInscricao = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "inscricao";
      window.dispatchEvent(new CustomEvent("open-inscricao-modal"));
    }
  };


  // Countdown timer state
  const [isLive, setIsLive] = useState(false);
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
      const nowD = new Date();
      let y = nowD.getFullYear(), m = nowD.getMonth() + 1, d = nowD.getDate();
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
      const timeParts = (nextEvent.horario || "14:00").split(":");
      const hr = parseInt(timeParts[0] || "14", 10);
      const min = parseInt(timeParts[1] || "00", 10);
      return new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hr).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-03:00`);
    };

    const target = parseTargetDate();
    // Torneio permanece ativo/ao vivo por até 4 horas após o horário oficial de início
    const eventEnd = new Date(target.getTime() + 4 * 60 * 60 * 1000);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance <= 0) {
        // Se ainda está no período de realização do torneio (início até 4h depois):
        if (now <= eventEnd.getTime()) {
          setIsLive(true);
        } else {
          setIsLive(false);
          // O evento encerrou: revalida dados para avançar automaticamente ao próximo torneio
          router.refresh();
        }
        setTimeLeft({ days: "00", hours: "00", mins: "00", secs: "00" });
        return;
      }

      setIsLive(false);
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
  }, [nextEvent, router]);

  if (!exibirPodio && !exibirProximoEvento) return null;

  // Fallbacks do Evento
  const formattedEventDate = formatEventDate(nextEvent?.data);
  const eventTime = nextEvent?.horario || "18:30";
  const eventTitle = nextEvent?.evento || `Sessão #${totalEtapas + 1} de Liga (Torneio TBT)`;
  const eventDesc = nextEvent?.descricao || "Formato Standard oficial Play! Pokémon. Traga seu deck de 60 cartas!";
  const eventLocation = nextEvent?.local || "Livraria Atlântica";
  const eventMapUrl = nextEvent?.linkMaps || nextEvent?.linkLocal || "https://maps.google.com";
  const stageType = nextEvent?.tipo || "Standard";
  const normalizeDateToISO = (dt?: string | null) => {

    if (!dt) return "";
    const clean = String(dt).trim().replace(/\//g, "-");
    const parts = clean.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
    }
    return dt;
  };

  const nextDateISO = normalizeDateToISO(nextEvent?.data);
  const premierDateISO = normalizeDateToISO(premierConfig?.premierData);

  // Verifica se a data do evento já passou para expirar automaticamente
  const isPremierEventPassed = (() => {
    if (!premierDateISO) return false;
    const now = new Date();
    const parts = premierDateISO.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const eventEnd = new Date(y, m - 1, d, 23, 59, 59);
      return now.getTime() > eventEnd.getTime();
    }
    return false;
  })();

  const isPremierActive = premierAbertas && !isPremierEventPassed;

  const isNextEventThePremierEvent = Boolean(
    isPremierActive &&
    (
      (premierDateISO && nextDateISO && premierDateISO === nextDateISO) ||
      (premierConfig?.premierNome && nextEvent?.evento && (
        nextEvent.evento.toLowerCase().trim() === premierConfig.premierNome.toLowerCase().trim() ||
        nextEvent.evento.toLowerCase().includes(premierConfig.premierNome.toLowerCase())
      ))
    )
  );

  const hasDirectRegistrationLink = Boolean(nextEvent?.linkInscricao && nextEvent.linkInscricao.trim() !== "");
  const isRegistrationOpenForThisCard = isNextEventThePremierEvent || hasDirectRegistrationLink;


  // Tag inteligente de destaque para eventos especiais (Cup, Challenge, etc.)
  const getEventTagConfig = () => {
    if (isLive) {
      return {
        badgeClass: "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/20",
        dotClass: "bg-emerald-400 animate-pulse",
        label: "🟢 Acontecendo Hoje!",
      };
    }
    if (isRegistrationOpenForThisCard) {
      return {
        badgeClass: "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-md shadow-emerald-500/25 animate-pulse",
        dotClass: "bg-emerald-400 animate-ping",
        label: "⚡ Inscrições Abertas!",
      };
    }
    const combined = `${stageType} ${eventTitle}`.toLowerCase();


    if (combined.includes("cup")) {
      return {
        badgeClass: "bg-purple-500/15 border-purple-500/35 text-purple-300 shadow-sm shadow-purple-500/20",
        dotClass: "bg-purple-400 animate-pulse",
        label: "🏆 League Cup • Oficial",
      };
    }
    if (combined.includes("challenge")) {
      return {
        badgeClass: "bg-amber-500/15 border-amber-500/35 text-amber-300 shadow-sm shadow-amber-500/20",
        dotClass: "bg-amber-400 animate-pulse",
        label: "⚡ League Challenge • Oficial",
      };
    }
    if (combined.includes("especial") || combined.includes("premier")) {
      return {
        badgeClass: "bg-blue-500/15 border-blue-500/35 text-blue-300 shadow-sm shadow-blue-500/20",
        dotClass: "bg-blue-400 animate-pulse",
        label: "🌟 Evento Especial",
      };
    }
    return {
      badgeClass: "bg-rose-500/10 border-rose-500/20 text-rose-300",
      dotClass: "bg-rose-500 animate-pulse",
      label: "Próximo Torneio",
    };
  };

  const tagCfg = getEventTagConfig();

  const getPodiumCardConfig = (pos: number) => {
    if (pos === 1) {
      return {
        containerClass:
          "border-amber-400/20 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] hover:border-amber-400/40 shadow-sm",
        badgeStyle: {
          bg: "bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-300/40",
          border: "border-amber-200/60",
        },
        ptsColor: "text-[#ffcb05]",
        seal: (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase text-amber-300 tracking-wider">
            <Crown className="h-2.5 w-2.5 text-amber-400" /> Líder
          </span>
        ),
      };
    }
    if (pos === 2) {
      return {
        containerClass:
          "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] shadow-sm",
        badgeStyle: {
          bg: "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-950 font-black shadow-sm ring-1 ring-slate-200/40",
          border: "border-slate-200/50",
        },
        ptsColor: "text-slate-100",
        seal: null,
      };
    }
    if (pos === 3) {
      return {
        containerClass:
          "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] shadow-sm",
        badgeStyle: {
          bg: "bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-amber-100 font-black shadow-sm ring-1 ring-amber-600/30",
          border: "border-amber-500/30",
        },
        ptsColor: "text-amber-200/90",
        seal: null,
      };
    }
    return {
      containerClass:
        "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] shadow-sm",
      badgeStyle: {
        bg: "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 text-white font-black shadow-sm ring-1 ring-blue-400/30",
        border: "border-blue-400/30",
      },
      ptsColor: "text-blue-200/90",
      seal: null,
    };
  };

  const gridClass =
    exibirPodio && exibirProximoEvento
      ? "grid-cols-1 lg:grid-cols-12"
      : "grid-cols-1";

  const podiumColClass =
    exibirPodio && exibirProximoEvento
      ? "lg:col-span-5"
      : "w-full";

  const eventColClass =
    exibirPodio && exibirProximoEvento
      ? "lg:col-span-7"
      : "w-full";

  return (
    <div className="w-full space-y-4">
      {/* Banner de Destaque Dedicado para Torneio Especial com Inscrições Abertas (se o próximo evento imediato for outra sessão) */}
      {isPremierActive && !isNextEventThePremierEvent && (
        <motion.div

          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-4 sm:p-5 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-emerald-950/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
              <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Inscrições Abertas
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {premierConfig?.premierNome || "Torneio Especial Oficial"}
                </h3>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span>📅 {formatEventDate(premierConfig?.premierData)}</span>
                <span>•</span>
                <span>⏰ {premierConfig?.premierHorario || "14:00"}</span>
                <span>•</span>
                <span>📍 {premierConfig?.premierLocal || "Livraria Atlântica"}</span>
                {premierConfig?.premierValor && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-emerald-300">R$ {premierConfig.premierValor}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleOpenInscricao}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/30 cursor-pointer shrink-0 animate-pulse"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Fazer Inscrição Online</span>
          </motion.button>
        </motion.div>
      )}

      <div className={`grid ${gridClass} gap-4 sm:gap-6 items-stretch`}>
        {/* =========================================================
            COLUNA 1: PÓDIO DA TEMPORADA ATUAL (Se ativo)
           ========================================================= */}
        {exibirPodio && (
          <div className={`${podiumColClass} flex flex-col space-y-2`}>

            {/* Header da Coluna */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-amber-400 stroke-current fill-none stroke-[2.2]"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 19h20" />
                  <path d="M4 19V11h5v8" />
                  <path d="M9 19V6h6v13" />
                  <path d="M15 19v-5h5v5" />
                </svg>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Pódio Atual
                </h2>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Temp. #{temporada}
              </span>
            </div>

            {/* Caixa Única com Divisórias em Linhas Sutis */}
            <div className="flex-1 rounded-3xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] p-2 sm:p-3 backdrop-blur-2xl shadow-xl flex flex-col justify-between divide-y divide-white/[0.04] transition-all">
              {top4.slice(0, 4).map((player, index) => {
                const pos = index + 1;
                const cardCfg = getPodiumCardConfig(pos);
                const energyCfg = getMultiEnergyConfig(player.ultimoDeckEnergia || "colorless");

                return (
                  <motion.div
                    key={player.jogadorId || player.jogadorNome}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlayer(player)}
                    className="group relative flex items-center justify-between gap-2.5 p-2 sm:p-2.5 rounded-2xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    {/* Badge Numérico da Posição */}
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm sm:text-base shrink-0 border font-black ${cardCfg.badgeStyle.bg} ${cardCfg.badgeStyle.border}`}
                    >
                      {pos}
                    </div>

                    {/* Informações do Jogador e Deck */}
                    <div className="min-w-0 flex-1 pl-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base md:text-lg text-white group-hover:text-amber-400 transition-colors truncate">
                          {player.jogadorNome}
                        </span>
                        <CategoryBadge category={player.categoria} size="sm" />
                        {cardCfg.seal}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-slate-400 truncate mt-0.5">
                        {/* Energy Dot / Ícone de Energia */}
                        <div className="flex items-center -space-x-1 shrink-0">
                          {energyCfg.types.map((t, i) => (
                            <span
                              key={i}
                              className="h-2.5 w-2.5 rounded-full border border-black/50 shadow-sm shrink-0"
                              style={{ background: t.bgGradient || t.hex, boxShadow: `0 0 3px ${t.glow || t.hex}` }}
                            />
                          ))}
                        </div>
                        <span className="truncate max-w-[180px] sm:max-w-[240px] text-slate-300 font-medium">
                          {player.ultimoDeck || "Sem deck registrado"}
                        </span>
                      </div>
                    </div>

                    {/* Pontos Limpos */}
                    <div className="text-right shrink-0">
                      <div className={`font-black text-base sm:text-lg md:text-xl tracking-wide tabular-nums ${cardCfg.ptsColor}`}>
                        {player.pontos}{" "}
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-400">PTS</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            COLUNA 2: PRÓXIMO EVENTO (Se ativo)
           ========================================================= */}
        {exibirProximoEvento && (
          <div className={`${eventColClass} flex flex-col space-y-2`}>
            {/* Header da Coluna */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
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

            {/* Card do Evento Transparente e Confortável */}
            <div className="flex-1 rounded-3xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all">
              {/* Topo do Card: Alerta com Pulso e Data */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${tagCfg.badgeClass}`}>
                  <span className={`h-2 w-2 rounded-full ${tagCfg.dotClass}`} />
                  <span>{tagCfg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#ffcb05] tabular-nums">
                  <Clock className="h-3.5 w-3.5 text-[#ffcb05]" />
                  <span>{isLive ? "Hoje" : formattedEventDate} às {eventTime}</span>
                </div>
              </div>

              {/* Título e Descrição do Torneio */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {eventTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                  {eventDesc}
                </p>
              </div>

              {/* Timer Regressivo ou Status Ao Vivo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                  <span>{isLive ? "Status da Rodada" : "Contagem Regressiva"}</span>
                  {isLive ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 normal-case">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      Acontecendo Agora!
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold lowercase first-letter:uppercase">
                      {timeLeft.days === "00" ? "é hoje!" : "faltam poucos dias"}
                    </span>
                  )}
                </div>

                {isLive ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 sm:p-4 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-3.5 w-3.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wide">
                          Torneio em Andamento!
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                          Rodadas em disputa presencial na {eventLocation}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-[11px] font-black text-emerald-300 shrink-0">
                      AO VIVO
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: "DIAS", value: timeLeft.days },
                      { label: "HORAS", value: timeLeft.hours },
                      { label: "MINS", value: timeLeft.mins },
                      { label: "SEGS", value: timeLeft.secs },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.04] bg-white/[0.02] py-3 px-2 shadow-sm transition-all"
                      >
                        <span className="tabular-nums text-xl sm:text-2xl font-black text-slate-100">
                          {item.value}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                          {item.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé: Local e Botão de Ação */}
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400 pt-3 border-t border-white/[0.04]">
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

                {isRegistrationOpenForThisCard ? (
                  nextEvent?.linkInscricao && nextEvent.linkInscricao !== "#inscricao" && !nextEvent.linkInscricao.startsWith("/") ? (
                    <motion.a
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.02 }}
                      href={nextEvent.linkInscricao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 animate-pulse"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>⚡ Fazer Inscrição</span>
                    </motion.a>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={handleOpenInscricao}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition-all shrink-0 cursor-pointer flex items-center gap-1.5 animate-pulse"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>⚡ Fazer Inscrição</span>
                    </motion.button>
                  )
                ) : (
                  <motion.div whileTap={{ scale: 0.94 }} whileHover={{ scale: 1.02 }}>
                    <Link
                      href="/calendario"
                      className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0 inline-block"
                    >
                      Ver Detalhes
                    </Link>
                  </motion.div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Detalhes do Jogador */}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}

