"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface MetagameEntry {
  id: number;
  etapaData: string;
  sessionCode: string | null;
  jogadorNome: string;
  deckNome: string;
}

export interface DeckInfo {
  id: number;
  nome: string;
  tipoEnergia: string;
  imagem: string | null;
  limitless: string | null;
  icone: string | null;
}

interface MetagameDashboardProps {
  metagameEntries: MetagameEntry[];
  decksInfo: DeckInfo[];
}

const OFFICIAL_ENERGY_COLORS: Record<string, { primary: string; secondary: string }> = {
  grass: { primary: "#78C850", secondary: "#4e9b29" },
  fire: { primary: "#FF4216", secondary: "#c22b07" },
  water: { primary: "#1593F5", secondary: "#0c67b0" },
  lightning: { primary: "#EBC816", secondary: "#b59704" },
  electric: { primary: "#EBC816", secondary: "#b59704" },
  psychic: { primary: "#D94293", secondary: "#9d1f64" },
  fighting: { primary: "#C55E13", secondary: "#8f3e04" },
  darkness: { primary: "#7c3aed", secondary: "#4c1d95" },
  dark: { primary: "#7c3aed", secondary: "#4c1d95" },
  metal: { primary: "#7E8E9E", secondary: "#4b5966" },
  dragon: { primary: "#8D56FF", secondary: "#5b21b6" },
  colorless: { primary: "#94a3b8", secondary: "#64748b" },
};

export function MetagameDashboard({ metagameEntries, decksInfo }: MetagameDashboardProps) {
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [hoveredDeck, setHoveredDeck] = useState<string | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Contagem de decks do metagame
  const { deckStats, totalDecks, carouselDecks } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of metagameEntries) {
      const name = entry.deckNome.trim();
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }

    const total = metagameEntries.length || 1;

    const stats = Object.entries(counts)
      .map(([deckName, count]) => {
        const info = decksInfo.find(
          (d) => d.nome.toLowerCase() === deckName.toLowerCase()
        );
        const percent = (count / total) * 100;

        return {
          deckName,
          count,
          percent,
          tipoEnergia: info?.tipoEnergia || "colorless",
          imagem: info?.imagem || null,
          limitless: info?.limitless || null,
        };
      })
      .sort((a, b) => b.count - a.count);

    const withImages = stats.filter((d) => d.imagem && d.deckName.toLowerCase() !== "outros");

    return {
      deckStats: stats,
      totalDecks: metagameEntries.length,
      carouselDecks: withImages.length > 0 ? withImages : stats.slice(0, 8),
    };
  }, [metagameEntries, decksInfo]);

  // Dados para o Donut Chart
  const chartData = useMemo(() => {
    const top7 = deckStats.slice(0, 7);
    const others = deckStats.slice(7).reduce((acc, d) => acc + d.count, 0);

    return [
      ...top7.map((d) => ({
        name: d.deckName,
        value: d.count,
        percent: ((d.count / (totalDecks || 1)) * 100).toFixed(1),
        energy: d.tipoEnergia,
      })),
      ...(others > 0
        ? [
            {
              name: "Outros Decks",
              value: others,
              percent: ((others / (totalDecks || 1)) * 100).toFixed(1),
              energy: "colorless",
            },
          ]
        : []),
    ];
  }, [deckStats, totalDecks]);

  const getEnergyColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return OFFICIAL_ENERGY_COLORS[norm] || OFFICIAL_ENERGY_COLORS.colorless;
  };

  // Autoplay para o Carrossel 3D
  useEffect(() => {
    if (carouselDecks.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [carouselDecks.length]);

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselDecks.length) % carouselDecks.length);
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
  };

  const activeDeck = carouselDecks[carouselIndex] || deckStats[0] || null;
  const activeHoverData = chartData.find((c) => c.name === hoveredDeck);

  return (
    <div className="w-full">
      {/* Card Unificado com Donut Chart e Carrossel 3D */}
      <div
        className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all"
        onMouseEnter={() => {
          if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }}
        onMouseLeave={() => {
          if (carouselDecks.length > 1) {
            autoPlayRef.current = setInterval(() => {
              setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
            }, 4500);
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo: Gráfico Donut com Gradientes de Energia */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
            <div className="h-68 sm:h-76 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {chartData.map((entry, index) => {
                      const colors = getEnergyColor(entry.energy);
                      return (
                        <linearGradient
                          key={`grad-${index}`}
                          id={`energyGrad-${index}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={colors.primary} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.8} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={118}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(entry: any) => setHoveredDeck(entry?.name || null)}
                    onMouseLeave={() => setHoveredDeck(null)}
                    onClick={(entry: any) => {
                      const targetName = entry?.name;
                      if (!targetName) return;
                      const idx = carouselDecks.findIndex(
                        (d) => d.deckName.toLowerCase() === targetName.toLowerCase()
                      );
                      if (idx !== -1) setCarouselIndex(idx);
                    }}
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#energyGrad-${index})`}
                        stroke={hoveredDeck === entry.name ? "#ffffff" : "rgba(255,255,255,0.25)"}
                        strokeWidth={hoveredDeck === entry.name ? 2.5 : 1.2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/15 bg-slate-950/95 px-3 py-2 shadow-2xl backdrop-blur-xl text-xs text-white">
                            <p className="font-extrabold text-sm">{item.name}</p>
                            <p className="text-yellow-400 font-bold mt-0.5">
                              {item.value} jogadores ({item.percent}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centro do Donut: Texto Flutuante Dinâmico */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-3.5 py-2 text-center backdrop-blur-md shadow-lg max-w-[130px]">
                  {activeHoverData ? (
                    <>
                      <span className="text-xs font-black text-white block leading-tight truncate">
                        {activeHoverData.name}
                      </span>
                      <span className="text-[11px] font-extrabold text-yellow-400 block mt-0.5">
                        {activeHoverData.percent}%
                      </span>
                    </>
                  ) : activeDeck ? (
                    <>
                      <span className="text-[11px] font-extrabold text-slate-200 block leading-tight truncate">
                        {activeDeck.deckName}
                      </span>
                      <span className="text-[10px] font-bold text-yellow-400 block mt-0.5">
                        {activeDeck.percent.toFixed(1)}% ({activeDeck.count}x)
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 block">
                      Toque numa fatia
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Legenda Resumida dos Principais Decks */}
            <div className="mt-1 flex flex-wrap justify-center gap-1.5 pt-1">
              {chartData.map((item, idx) => {
                const colors = getEnergyColor(item.energy);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const cIdx = carouselDecks.findIndex(
                        (d) => d.deckName.toLowerCase() === item.name.toLowerCase()
                      );
                      if (cIdx !== -1) setCarouselIndex(cIdx);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all cursor-pointer ${
                      hoveredDeck === item.name || activeDeck?.deckName.toLowerCase() === item.name.toLowerCase()
                        ? "border-yellow-400 bg-yellow-500/20 text-white shadow-md"
                        : "border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span>{item.name}: {item.percent}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lado Direito: Carrossel 3D de Cartas */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
            <div className="relative h-60 sm:h-68 w-full flex items-center justify-center [perspective:1000px]">
              {carouselDecks.map((deck, idx) => {
                let diff = idx - carouselIndex;
                if (diff > Math.floor(carouselDecks.length / 2)) diff -= carouselDecks.length;
                if (diff < -Math.floor(carouselDecks.length / 2)) diff += carouselDecks.length;

                const isCurrent = diff === 0;
                const isVisible = Math.abs(diff) <= 2;

                if (!isVisible) return null;

                const translateX = diff * 85;
                const translateZ = Math.abs(diff) * -100;
                const rotateY = diff * -32;
                const opacity = isCurrent ? 1 : Math.max(0.2, 1 - Math.abs(diff) * 0.4);

                return (
                  <div
                    key={deck.deckName}
                    onClick={() => setCarouselIndex(idx)}
                    className={`absolute transition-all duration-500 cursor-pointer ${
                      isCurrent ? "z-20 scale-105" : "z-10"
                    }`}
                    style={{
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                      opacity,
                    }}
                  >
                    {deck.imagem ? (
                      <img
                        src={deck.imagem}
                        alt={deck.deckName}
                        className={`h-48 sm:h-56 object-contain rounded-[10px] drop-shadow-2xl transition-transform ${
                          isCurrent
                            ? "ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(245,158,11,0.4)]"
                            : "brightness-75 hover:brightness-100"
                        }`}
                      />
                    ) : (
                      <div className="h-48 sm:h-56 w-34 rounded-[10px] bg-slate-800 flex items-center justify-center p-3 text-center text-xs font-bold text-white border border-white/10">
                        {deck.deckName}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botões de Navegação */}
              {carouselDecks.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-1 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-md"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-1 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-md"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Informação do Deck Ativo com Gradiente dos Tipos */}
            {activeDeck && (
              <div className="mt-3.5 text-center space-y-2">
                <div
                  className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-2xl border backdrop-blur-md shadow-lg"
                  style={{
                    background: getMultiEnergyConfig(activeDeck.tipoEnergia).gradientBg,
                    border: getMultiEnergyConfig(activeDeck.tipoEnergia).borderStyle,
                  }}
                >
                  <h4 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {activeDeck.deckName}
                  </h4>
                  <EnergyBadge energyRaw={activeDeck.tipoEnergia} size="sm" />
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-slate-300">
                  <span>{activeDeck.count} jogadores ({activeDeck.percent.toFixed(1)}%)</span>
                  {activeDeck.limitless && activeDeck.limitless !== "#" && (
                    <a
                      href={activeDeck.limitless}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"
                    >
                      Ver no Limitless <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
