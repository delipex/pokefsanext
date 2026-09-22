"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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
  const [isOutrosExpanded, setIsOutrosExpanded] = useState<boolean>(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Contagem e estatísticas brutas dos decks
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
          icone: info?.icone || null,
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

  // 2. Agrupamento para o Donut Chart (Com suporte a Drilldown para 'Outros Decks')
  const chartSlices = useMemo(() => {
    const total = totalDecks || 1;

    let outrosCount = 0;
    const outrosList: typeof deckStats = [];
    const mainList: typeof deckStats = [];

    deckStats.forEach((d) => {
      const isOutrosVal =
        d.deckName.toLowerCase() === "outros" || d.deckName.toLowerCase() === "outros decks";
      const isMinor = d.count === 1 || isOutrosVal || d.percent < 1.5;

      if (isMinor) {
        outrosCount += d.count;
        outrosList.push(d);
      } else {
        mainList.push(d);
      }
    });

    let currentSlices: Array<{
      name: string;
      count: number;
      percent: number;
      percentStr: string;
      energy: string;
      icone: string | null;
      isOutros?: boolean;
      isBack?: boolean;
    }> = [];

    if (isOutrosExpanded) {
      // Modo Drill-down: Mostra decks menores + fatia de retorno
      currentSlices = outrosList.map((d) => ({
        name: d.deckName,
        count: d.count,
        percent: d.percent,
        percentStr: d.percent < 1 ? d.percent.toFixed(1) + "%" : Math.round(d.percent) + "%",
        energy: d.tipoEnergia,
        icone: d.icone,
      }));

      if (mainList.length > 0) {
        const sizeCount = Math.max(1, Math.round(outrosCount * 0.12));
        currentSlices.push({
          name: "Voltar para visão geral",
          count: sizeCount,
          percent: 0,
          percentStr: "Voltar",
          energy: "fire",
          icone: null,
          isBack: true,
        });
      }
    } else {
      // Modo Principal: Decks principais + fatia agregada "Outros Decks"
      currentSlices = mainList.map((d) => ({
        name: d.deckName,
        count: d.count,
        percent: d.percent,
        percentStr: d.percent < 1 ? d.percent.toFixed(1) + "%" : Math.round(d.percent) + "%",
        energy: d.tipoEnergia,
        icone: d.icone,
      }));

      if (outrosCount > 0) {
        const outrosPct = (outrosCount / total) * 100;
        currentSlices.push({
          name: "Outros Decks",
          count: outrosCount,
          percent: outrosPct,
          percentStr: Math.round(outrosPct) + "%",
          energy: "colorless",
          icone: null,
          isOutros: true,
        });
      }
    }

    return currentSlices;
  }, [deckStats, totalDecks, isOutrosExpanded]);

  // 3. Geometria Trigonométrica dos Arcos, Rótulos e Sprites do Donut
  const cx = 240;
  const cy = 240;
  const outerRadius = 145;
  const innerRadius = 78;
  const midRadius = (innerRadius + outerRadius) / 2;

  const totalSliceValue = chartSlices.reduce((sum, s) => sum + s.count, 0) || 1;

  // Cálculo dos arcos e posições de colisão de ícones
  const drawnIcons: Array<{ x: number; y: number }> = [];
  let accumulatedAngle = -Math.PI / 2; // Começa no topo (12 horas)

  const computedSlices = chartSlices.map((slice, idx) => {
    const sliceAngle = (slice.count / totalSliceValue) * (2 * Math.PI);
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    const midAngle = (startAngle + endAngle) / 2;
    accumulatedAngle = endAngle;

    // Coordenadas do Arco SVG Donut
    const x1Out = cx + outerRadius * Math.cos(startAngle);
    const y1Out = cy + outerRadius * Math.sin(startAngle);
    const x2Out = cx + outerRadius * Math.cos(endAngle);
    const y2Out = cy + outerRadius * Math.sin(endAngle);

    const x1In = cx + innerRadius * Math.cos(startAngle);
    const y1In = cy + innerRadius * Math.sin(startAngle);
    const x2In = cx + innerRadius * Math.cos(endAngle);
    const y2In = cy + innerRadius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = `
      M ${x1Out} ${y1Out}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Out} ${y2Out}
      L ${x2In} ${y2In}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1In} ${y1In}
      Z
    `.trim();

    // Posição do texto de porcentagem dentro da fatia
    const textX = cx + midRadius * Math.cos(midAngle);
    const textY = cy + midRadius * Math.sin(midAngle);

    // Rotação do texto para leitura confortável
    let textRotation = (midAngle * 180) / Math.PI;
    if (textRotation > 90 && textRotation < 270) {
      textRotation += 180;
    } else if (textRotation < -90 && textRotation > -270) {
      textRotation += 180;
    }

    // Cálculo de posição dos ícones externos com prevenção de colisão
    let iconData: { lineStartX: number; lineStartY: number; lineEndX: number; lineEndY: number; imgX: number; imgY: number; iconUrl: string } | null = null;

    if (!slice.isOutros && !slice.isBack && slice.icone) {
      const iconSize = 28;
      const possibleOffsets = [20, 36, 52, 68, 84];
      let chosenOffset: number | null = null;
      let finalX = 0;
      let finalY = 0;

      for (const off of possibleOffsets) {
        const testR = outerRadius + off;
        const testX = cx + Math.cos(midAngle) * testR;
        const testY = cy + Math.sin(midAngle) * testR;

        const hasCollision = drawnIcons.some((pos) => {
          const dist = Math.hypot(testX - pos.x, testY - pos.y);
          return dist < iconSize + 6;
        });

        if (!hasCollision) {
          chosenOffset = off;
          finalX = testX;
          finalY = testY;
          break;
        }
      }

      if (chosenOffset !== null) {
        drawnIcons.push({ x: finalX, y: finalY });
        const lineStartX = cx + Math.cos(midAngle) * outerRadius;
        const lineStartY = cy + Math.sin(midAngle) * outerRadius;
        const lineEndX = cx + Math.cos(midAngle) * (outerRadius + chosenOffset - iconSize / 2);
        const lineEndY = cy + Math.sin(midAngle) * (outerRadius + chosenOffset - iconSize / 2);

        iconData = {
          lineStartX,
          lineStartY,
          lineEndX,
          lineEndY,
          imgX: finalX - iconSize / 2,
          imgY: finalY - iconSize / 2,
          iconUrl: slice.icone,
        };
      }
    }

    return {
      ...slice,
      idx,
      pathData,
      textX,
      textY,
      textRotation,
      iconData,
    };
  });

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
  const activeHoverSlice = chartSlices.find((c) => c.name === hoveredDeck);
  const activeCenterDeckName = hoveredDeck || activeDeck?.deckName || "Mega Lucario Ex";
  const activeCenterDeckInfo = decksInfo.find(
    (d) => d.nome.toLowerCase() === activeCenterDeckName.toLowerCase()
  );
  const activeCenterEnergy = activeCenterDeckInfo?.tipoEnergia || "fighting";
  const activeCenterConfig = getMultiEnergyConfig(activeCenterEnergy);

  const getEnergyColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return OFFICIAL_ENERGY_COLORS[norm] || OFFICIAL_ENERGY_COLORS.colorless;
  };

  const handleSliceClick = (slice: typeof chartSlices[0]) => {
    if (slice.isOutros) {
      setIsOutrosExpanded(true);
      return;
    }
    if (slice.isBack) {
      setIsOutrosExpanded(false);
      return;
    }

    const idx = carouselDecks.findIndex(
      (d) => d.deckName.toLowerCase() === slice.name.toLowerCase()
    );
    if (idx !== -1) {
      setCarouselIndex(idx);
    }
  };

  return (
    <div className="w-full">
      {/* Card Unificado com Donut Chart com Sprites e Carrossel 3D */}
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
          {/* Lado Esquerdo: Gráfico Donut com Sprites Oficiais e Linhas de Conexão */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
            {/* Botão de retorno do Drill-down */}
            {isOutrosExpanded && (
              <button
                onClick={() => setIsOutrosExpanded(false)}
                className="mb-2 flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer shadow-md"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Voltar para visão geral</span>
              </button>
            )}

            <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center">
              <svg
                viewBox="0 0 480 480"
                className="w-full h-full overflow-visible select-none drop-shadow-xl"
              >
                <defs>
                  {chartSlices.map((slice, i) => {
                    const colors = getEnergyColor(slice.energy);
                    return (
                      <linearGradient
                        key={`donutGrad-${i}`}
                        id={`donutGrad-${i}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.92} />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.78} />
                      </linearGradient>
                    );
                  })}
                  {/* Sombra suave interna */}
                  <filter id="sliceGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
                  </filter>
                </defs>

                {/* 1. Fatias do Donut */}
                <g>
                  {computedSlices.map((slice) => {
                    const isHovered = hoveredDeck === slice.name;
                    return (
                      <path
                        key={`path-${slice.idx}`}
                        d={slice.pathData}
                        fill={
                          slice.isBack
                            ? "rgba(239, 68, 68, 0.4)"
                            : slice.isOutros
                            ? "#475569"
                            : `url(#donutGrad-${slice.idx})`
                        }
                        stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                        strokeWidth={isHovered ? 2.5 : 1}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredDeck(slice.name)}
                        onMouseLeave={() => setHoveredDeck(null)}
                        onClick={() => handleSliceClick(slice)}
                      />
                    );
                  })}
                </g>

                {/* 2. Linhas de Conexão e Sprites de Pokémon no Perímetro */}
                <g>
                  {computedSlices.map((slice) => {
                    if (!slice.iconData) return null;
                    return (
                      <g key={`icon-group-${slice.idx}`} className="pointer-events-none">
                        {/* Linha guia */}
                        <line
                          x1={slice.iconData.lineStartX}
                          y1={slice.iconData.lineStartY}
                          x2={slice.iconData.lineEndX}
                          y2={slice.iconData.lineEndY}
                          stroke="rgba(255, 255, 255, 0.35)"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        {/* Sprite Oficial */}
                        <image
                          href={slice.iconData.iconUrl}
                          x={slice.iconData.imgX}
                          y={slice.iconData.imgY}
                          width="28"
                          height="28"
                          preserveAspectRatio="xMidYMid meet"
                          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* 3. Textos de Porcentagem dentro das Fatias */}
                <g className="pointer-events-none">
                  {computedSlices.map((slice) => {
                    if (slice.isBack) return null;
                    return (
                      <text
                        key={`text-${slice.idx}`}
                        x={slice.textX}
                        y={slice.textY}
                        transform={`rotate(${slice.textRotation}, ${slice.textX}, ${slice.textY})`}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={slice.isOutros ? 9 : slice.percent >= 10 ? 11 : 9.5}
                        fontWeight="900"
                        className="font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      >
                        {slice.isOutros ? "Outros" : slice.percentStr}
                      </text>
                    );
                  })}
                </g>
              </svg>

              {/* 4. Pílula Central com Nome do Deck e Gradiente de Energia */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                  className="rounded-2xl px-4 py-2 text-center shadow-2xl backdrop-blur-xl border transition-all duration-300 max-w-[140px]"
                  style={{
                    background: activeCenterConfig.gradientBg || "rgba(15, 23, 42, 0.85)",
                    borderColor: activeCenterConfig.borderStyle ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                    boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <span className="text-xs sm:text-sm font-black text-white block leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                    {activeHoverSlice ? activeHoverSlice.name : activeCenterDeckName}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-300 block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {activeHoverSlice
                      ? `${activeHoverSlice.percentStr} (${activeHoverSlice.count}x)`
                      : activeDeck
                      ? `${activeDeck.percent.toFixed(1)}% (${activeDeck.count}x)`
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Dica de Interatividade */}
            <p className="mt-1 text-[11px] text-slate-400 font-mono text-center">
              {isOutrosExpanded
                ? "Visão de 'Outros Decks' expandida"
                : "Clique em 'Outros Decks' para expandir a lista"}
            </p>
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
                    className="absolute left-1 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-md cursor-pointer"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-1 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-md cursor-pointer"
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
