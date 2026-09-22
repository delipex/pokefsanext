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
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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
      accentBg: "from-amber-500/15 via-slate-900/80 to-slate-950/90",
      icon: Trophy,
      iconColor: "text-amber-400",
    },
    {
      id: "gym",
      title: "Líder do Ginásio",
      leader: awards.gym?.player || "A definir",
      stat: awards.gym
        ? `${awards.gym.participations} etapas disputadas (${awards.gym.points} pts)`
        : "Aguardando etapas",
      accentBg: "from-blue-500/15 via-slate-900/80 to-slate-950/90",
      icon: Swords,
      iconColor: "text-blue-400",
    },
    {
      id: "ditto",
      title: "Ditto Player",
      leader: awards.ditto?.player || "A definir",
      stat: awards.ditto
        ? `${awards.ditto.count} decks diferentes utilizados`
        : "Aguardando metagame",
      accentBg: "from-purple-500/15 via-slate-900/80 to-slate-950/90",
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
      accentBg: "from-rose-500/15 via-slate-900/80 to-slate-950/90",
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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-blue-950/30 via-slate-900/60 to-slate-950/80 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LADO ESQUERDO: Ticker de Títulos da Temporada + KPIs Rápidos */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Título & Ticker Dinâmico de Títulos */}
          <div
            className="space-y-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Liga Atlântica{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                  Temporada {temporada}
                </span>
              </h1>

              {/* Controles de Slide dos Títulos */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) => (prev - 1 + titleSlides.length) % titleSlides.length
                    )
                  }
                  aria-label="Título anterior"
                  className="p-1 rounded-lg border border-white/10 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % titleSlides.length)
                  }
                  aria-label="Próximo título"
                  className="p-1 rounded-lg border border-white/10 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Slide Box dos Títulos */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-3.5 sm:p-4 backdrop-blur-xl shadow-md overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${currentSlide.accentBg} pointer-events-none transition-all duration-700 opacity-60`}
              />

              <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-white/10 shrink-0">
                    <SlideIcon className={`h-4.5 w-4.5 ${currentSlide.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                      {currentSlide.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                      Líder Atual: <strong className="text-white font-bold">{currentSlide.leader}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-black text-amber-300 block">
                    {currentSlide.stat}
                  </span>
                </div>
              </div>

              {/* Indicadores de Ponto */}
              <div className="relative z-10 flex items-center gap-1.5 pt-2 mt-2 border-t border-white/5">
                {titleSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Ver ${slide.title}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === activeSlide
                        ? "w-5 bg-amber-400"
                        : "w-1.5 bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick KPI Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* KPI 1: Líder Geral */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Líder Atual</span>
              </div>
              <div className="mt-1.5 truncate">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {lider?.nome || "A definir"}
                </div>
                <div className="text-[10px] text-amber-400 font-black">
                  {lider ? `${lider.pontos} pts` : "0 pts"}
                </div>
              </div>
            </div>

            {/* KPI 2: Etapas */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Swords className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>Etapas</span>
              </div>
              <div className="mt-1.5">
                <div className="text-xs sm:text-sm font-bold text-white">
                  {totalEtapas}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  disputadas
                </div>
              </div>
            </div>

            {/* KPI 3: Competidores */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Users className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>Jogadores</span>
              </div>
              <div className="mt-1.5">
                <div className="text-xs sm:text-sm font-bold text-white">
                  {totalJogadores}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  participantes
                </div>
              </div>
            </div>

            {/* KPI 4: Top Deck */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Top Meta</span>
              </div>
              <div className="mt-1.5 truncate">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {topDeck?.nome || "Em disputa"}
                </div>
                <div className="text-[10px] text-purple-400 font-bold">
                  {topDeck?.porcentagem || "0%"} meta
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Card Fixo de Próximo Evento Oficial */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="h-full rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-950/90 p-4 sm:p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
            {/* Header do Próximo Evento */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                <Flame className="h-3 w-3" />
                Próximo Evento Oficial
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Confirmado
              </span>
            </div>

            {/* Conteúdo do Evento */}
            {nextEvent ? (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {nextEvent.evento}
                </h3>

                {/* Bloco de Data e Local */}
                <div className="flex items-center gap-3.5">
                  <div className="flex flex-col items-center justify-center h-14 w-14 shrink-0 rounded-xl border border-blue-500/30 bg-blue-950/50 text-center shadow-inner">
                    <span className="text-[9px] font-black uppercase text-blue-400">
                      {eventDate.weekday}
                    </span>
                    <span className="text-lg font-black text-white leading-none my-0.5">
                      {eventDate.day}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-slate-400">
                      {eventDate.month}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{nextEvent.horario || "18:30"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{nextEvent.local || "Livraria Atlântica +"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Nenhum evento agendado para os próximos dias.
              </div>
            )}

            {/* Ações do Evento */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              {(nextEvent?.linkMaps || nextEvent?.linkLocal) && (
                <a
                  href={nextEvent.linkMaps || nextEvent.linkLocal || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-400" />
                  Como Chegar
                </a>
              )}
              <a
                href={nextEvent?.linkInscricao || "https://chat.whatsapp.com/EpUEb62hq1bKs6iDtQ3ena"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30"
              >
                Inscrição
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
