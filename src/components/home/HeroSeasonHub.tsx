"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Swords,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export interface HeroSeasonHubProps {
  temporada: number;
  totalEtapas: number;
  totalJogadores: number;
  lider: {
    nome: string;
    pontos: number;
  } | null;
  topDeck: {
    nome: string;
    porcentagem: string;
  } | null;
  awards: {
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

function parseEventDate(rawDate?: string) {
  if (!rawDate) return { day: "--", weekday: "---", month: "---", full: rawDate || "" };
  let year = 2026, month = 9, day = 1;
  const clean = rawDate.replace(/\//g, "-").trim();
  const parts = clean.split("-");

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  const dateObj = new Date(year, month - 1, day);
  const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  return {
    day: String(day).padStart(2, "0"),
    weekday: weekdays[dateObj.getDay()] || "---",
    month: months[month - 1] || "---",
    year: String(year),
    full: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
  };
}

export function HeroSeasonHub({
  temporada,
  totalEtapas,
  totalJogadores,
  lider,
  topDeck,
  awards,
  nextEvent,
}: HeroSeasonHubProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const titleSlides = [
    {
      id: "gold",
      title: "Pokébola de Ouro",
      leader: awards.gold?.player || "A definir",
      stat: awards.gold
        ? `${awards.gold.wins}V - ${awards.gold.losses}D (${awards.gold.winRate}% WR)`
        : "Aguardando mais etapas",
      accentBg: "from-amber-500/15 to-transparent",
      icon: Trophy,
      iconColor: "text-amber-400",
    },
    {
      id: "gym",
      title: "Líder do Ginásio",
      leader: awards.gym?.player || "A definir",
      stat: awards.gym
        ? `${awards.gym.participations} etapas (${awards.gym.points} pts)`
        : "Aguardando etapas",
      accentBg: "from-blue-500/15 to-transparent",
      icon: Swords,
      iconColor: "text-blue-400",
    },
    {
      id: "ditto",
      title: "Ditto Player",
      leader: awards.ditto?.player || "A definir",
      stat: awards.ditto
        ? `${awards.ditto.count} decks diferentes`
        : "Aguardando metagame",
      accentBg: "from-purple-500/15 to-transparent",
      icon: Sparkles,
      iconColor: "text-purple-400",
    },
    {
      id: "murcha",
      title: "Pokébola Murcha",
      leader: awards.murcha?.player || "A definir",
      stat: awards.murcha
        ? `${awards.murcha.losses} derrotas acumuladas`
        : "Sem candidatos",
      accentBg: "from-rose-500/15 to-transparent",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
    },
  ];

  // Auto slide ticker
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % titleSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, titleSlides.length]);

  const currentSlide = titleSlides[activeSlide];
  const SlideIcon = currentSlide.icon;
  const eventDate = parseEventDate(nextEvent?.data);

  return (
    <div className="space-y-4">
      {/* 1. HERO PRINCIPAL: HUB DA TEMPORADA */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header da Temporada + Ticker de Títulos */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                  CIRCUITO OFICIAL TCG
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">Ao Vivo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                Liga Atlântica{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-amber-300">
                  Temporada {temporada}
                </span>
              </h1>
            </div>

            {/* Ticker de Premiações da Temporada */}
            <div
              className="relative min-w-[280px] sm:min-w-[340px] rounded-2xl border border-white/10 bg-slate-950/80 p-3 shadow-inner"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                    <SlideIcon className={`h-4 w-4 ${currentSlide.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {currentSlide.title}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {currentSlide.leader}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-black text-amber-400 hidden sm:block">
                    {currentSlide.stat}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlide(
                        (prev) => (prev - 1 + titleSlides.length) % titleSlides.length
                      )
                    }
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlide((prev) => (prev + 1) % titleSlides.length)
                    }
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPIs Rápidos da Temporada */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
            {/* KPI 1: Líder Geral */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Líder Atual</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <strong className="text-sm sm:text-base font-black text-white truncate">
                  {lider?.nome || "A definir"}
                </strong>
                <span className="text-xs font-black text-amber-400 shrink-0">
                  {lider ? `${lider.pontos} pts` : "0 pts"}
                </span>
              </div>
            </div>

            {/* KPI 2: Etapas */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Etapas Jogadas</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <strong className="text-base sm:text-lg font-black text-white">
                  {totalEtapas}
                </strong>
                <span className="text-[11px] font-bold text-slate-400">rodadas</span>
              </div>
            </div>

            {/* KPI 3: Competidores */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Jogadores Ativos</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <strong className="text-base sm:text-lg font-black text-white">
                  {totalJogadores}
                </strong>
                <span className="text-[11px] font-bold text-slate-400">atletas</span>
              </div>
            </div>

            {/* KPI 4: Top Meta */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Deck #1 no Meta</span>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <strong className="text-sm sm:text-base font-black text-white truncate">
                  {topDeck?.nome || "Em disputa"}
                </strong>
                <span className="text-xs font-bold text-purple-400 shrink-0">
                  {topDeck?.porcentagem || "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARD DEDICADO DO PRÓXIMO TORNEIO (Layout de Ingresso / Ticket de Etapa) */}
      {nextEvent && (
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900/90 to-slate-900/80 p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Bloco de Data Tipo Ingresso */}
            <div className="flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-center shadow-inner">
              <span className="text-[9px] font-black uppercase text-blue-300">
                {eventDate.weekday}
              </span>
              <span className="text-lg font-black text-white leading-none my-0.5">
                {eventDate.day}
              </span>
              <span className="text-[9px] font-bold uppercase text-blue-300">
                {eventDate.month}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  Próxima Etapa Oficial
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {nextEvent.horario || "14:00"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">
                {nextEvent.evento}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>{nextEvent.local || "Livraria Atlântica +"}</span>
              </p>
            </div>
          </div>

          {/* Botões de Ação da Etapa */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {nextEvent.linkMaps && (
              <a
                href={nextEvent.linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>Como Chegar</span>
              </a>
            )}
            <a
              href={nextEvent.linkInscricao || "https://chat.whatsapp.com/EpUEb62hq1bKs6iDtQ3ena"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg shadow-blue-600/30"
            >
              <span>Garantir Inscrição</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
