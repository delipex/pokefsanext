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
  Award,
  ShieldAlert,
  ArrowUpRight,
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
      decks: string[];
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
}

export function HeroSeasonHub({
  temporada,
  totalEtapas,
  totalJogadores,
  lider,
  topDeck,
  awards,
}: HeroSeasonHubProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const titleSlides = [
    {
      id: "gold",
      title: "Pokébola de Ouro",
      badge: "Líder de Vitórias",
      description: "Melhor aproveitamento e saldo de vitórias da temporada",
      leader: awards.gold?.player || "A definir",
      stat: awards.gold
        ? `${awards.gold.wins}V - ${awards.gold.losses}D (${awards.gold.winRate}% WR)`
        : "Aguardando mais etapas",
      tagColor: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      accentBg: "from-amber-500/10 via-amber-500/5 to-transparent",
      icon: Trophy,
      iconColor: "text-amber-400",
      targetId: "premios-temporada",
    },
    {
      id: "gym",
      title: "Líder do Ginásio",
      badge: "Maior Assiduidade",
      description: "Presença garantida no maior número de etapas disputadas",
      leader: awards.gym?.player || "A definir",
      stat: awards.gym
        ? `${awards.gym.participations} etapas disputadas (${awards.gym.points} pts)`
        : "Aguardando etapas",
      tagColor: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      accentBg: "from-blue-500/10 via-blue-500/5 to-transparent",
      icon: Swords,
      iconColor: "text-blue-400",
      targetId: "premios-temporada",
    },
    {
      id: "ditto",
      title: "Ditto Player",
      badge: "Maior Variedade",
      description: "Mestre da adaptação com a maior quantidade de decks diferentes",
      leader: awards.ditto?.player || "A definir",
      stat: awards.ditto
        ? `${awards.ditto.count} decks diferentes utilizados`
        : "Aguardando metagame",
      tagColor: "border-purple-500/30 bg-purple-500/10 text-purple-400",
      accentBg: "from-purple-500/10 via-purple-500/5 to-transparent",
      icon: Sparkles,
      iconColor: "text-purple-400",
      targetId: "premios-temporada",
    },
    {
      id: "murcha",
      title: "Pokébola Murcha",
      badge: "Persistência Pura",
      description: "Maior resiliência competitiva: enfrenta todas as derrotas sem desistir",
      leader: awards.murcha?.player || "A definir",
      stat: awards.murcha
        ? `${awards.murcha.losses} derrotas acumuladas (Guerreiro)`
        : "Sem candidatos",
      tagColor: "border-slate-500/30 bg-slate-500/10 text-slate-400",
      accentBg: "from-slate-500/10 via-slate-500/5 to-transparent",
      icon: ShieldAlert,
      iconColor: "text-slate-400",
      targetId: "premios-temporada",
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

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-950/80 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LADO ESQUERDO: Identidade da Liga + KPIs Dinâmicos da Temporada */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Temporada {temporada} em Andamento
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Circuito Oficial Pokémon TCG
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Liga Atlântica{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                Temporada {temporada}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Hub oficial de classificação, metagame em tempo real e premiações da temporada em Feira de Santana.
            </p>
          </div>

          {/* Quick KPI Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {/* KPI 1: Líder Geral */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
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
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
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
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
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
            <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3 flex flex-col justify-between">
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

        {/* LADO DIREITO: Showcase Dinâmico de Títulos e Premiações (Ticker / Slider) */}
        <div
          className="lg:col-span-5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-lg overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Background gradient of active slide */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentSlide.accentBg} pointer-events-none transition-all duration-700`}
            />

            {/* Header of the Slider Card */}
            <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-slate-300">
                  <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  Destaques dos Títulos
                </span>
              </div>

              {/* Slider Navigation controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) => (prev - 1 + titleSlides.length) % titleSlides.length
                    )
                  }
                  aria-label="Título anterior"
                  className="p-1 rounded-lg border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % titleSlides.length)
                  }
                  aria-label="Próximo título"
                  className="p-1 rounded-lg border border-white/5 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Slide Body */}
            <div className="relative z-10 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-slate-950/60 border border-white/10">
                    <SlideIcon className={`h-4 w-4 ${currentSlide.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white leading-none">
                      {currentSlide.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {currentSlide.description}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${currentSlide.tagColor}`}
                >
                  {currentSlide.badge}
                </span>
              </div>

              {/* Dynamic Leader Row */}
              <div className="rounded-xl border border-white/5 bg-slate-950/50 p-3 mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Atual Líder do Título:
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                    {currentSlide.leader}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-black text-amber-300 block">
                    {currentSlide.stat}
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Progress / Dots Indicator */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                {titleSlides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`Ver ${slide.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide
                        ? "w-6 bg-amber-400"
                        : "w-1.5 bg-slate-700 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>

              <Link
                href="/ranking#premios-temporada"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-300 transition-colors"
              >
                Ver todos os títulos <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
