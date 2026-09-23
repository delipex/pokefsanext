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

    // Carrossel contém todos os decks registrados (exceto o agrupamento genérico 'outros')
    const validDecks = stats.filter(
      (d) => d.deckName.toLowerCase() !== "outros" && d.deckName.toLowerCase() !== "outros decks"
    );

    return {
      deckStats: stats,
      totalDecks: metagameEntries.length,
      carouselDecks: validDecks.length > 0 ? validDecks : stats,
    };
  }, [metagameEntries, decksInfo]);

  // 2. Agrupamento para o Donut Chart (Com suporte a Drilldown para 'Outros Decks')
  const chartSlices = useMemo(() => {
    const total = totalDecks || 1;

    let outrosCount = 0;
    const outrosList: typeof deckStats = [];
    const mainList: typeof deckStats = [];

    // Modo Principal: Todos os decks com representatividade >= 2.0% aparecem no donut principal
    deckStats.forEach((d) => {
      const isOutrosVal =
        d.deckName.toLowerCase() === "outros" || d.deckName.toLowerCase() === "outros decks";
      const isMinor = d.percent < 2.0 || isOutrosVal;

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
    }> = [];

    if (isOutrosExpanded) {
      // Modo Drill-down: Mostra exclusivamente os decks de menor expressão (< 2%) sem fatia de voltar
      currentSlices = outrosList.map((d) => ({
        name: d.deckName,
        count: d.count,
        percent: d.percent,
        percentStr: d.percent < 1 ? d.percent.toFixed(1) + "%" : Math.round(d.percent) + "%",
        energy: d.tipoEnergia,
        icone: d.icone,
      }));
    } else {
      // Modo Principal: Decks principais (>= 2%) + fatia agregada "Outros Decks"
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
          percentStr: outrosPct < 1 ? outrosPct.toFixed(1) + "%" : Math.round(outrosPct) + "%",
          energy: "colorless",
          icone: null,
          isOutros: true,
        });
      }
    }

    return currentSlices;
  }, [deckStats, totalDecks, isOutrosExpanded]);

  // 3. Geometria Trigonométrica dos Arcos e Rótulos do Donut (Mais Espesso e Imersivo)
  const cx = 220;
  const cy = 220;
  const outerRadius = 195;
  const innerRadius = 78;
  const midRadius = (innerRadius + outerRadius) / 2;

  const totalSliceValue = chartSlices.reduce((sum, s) => sum + s.count, 0) || 1;
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

    // Posição central da fatia
    const midX = cx + midRadius * Math.cos(midAngle);
    const midY = cy + midRadius * Math.sin(midAngle);

    // Rotação do texto para leitura confortável
    let textRotation = (midAngle * 180) / Math.PI;
    if (textRotation > 90 && textRotation < 270) {
      textRotation += 180;
    } else if (textRotation < -90 && textRotation > -270) {
      textRotation += 180;
    }

    return {
      ...slice,
      idx,
      pathData,
      sliceAngle,
      midX,
      midY,
      textRotation,
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

  // Sincronização direta de HOVER nas fatias do Donut com a carta ativa do Carrossel 3D
  const handleSliceHover = (deckName: string) => {
    setHoveredDeck(deckName);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);

    const foundIdx = carouselDecks.findIndex(
      (d) => d.deckName.toLowerCase() === deckName.toLowerCase()
    );
    if (foundIdx !== -1) {
      setCarouselIndex(foundIdx);
    }
  };

  const activeDeck = carouselDecks[carouselIndex] || deckStats[0] || null;
  const activeHoverSlice = chartSlices.find((c) => c.name === hoveredDeck);
  const activeCenterDeckName = hoveredDeck || activeDeck?.deckName || "Deck";
  const activeCenterDeckInfo = decksInfo.find(
    (d) => d.nome.toLowerCase() === activeCenterDeckName.toLowerCase()
  );
  const activeCenterEnergy = activeCenterDeckInfo?.tipoEnergia || "fighting";
  const activeCenterConfig = getMultiEnergyConfig(activeCenterEnergy);
  const primaryEnergyColor = activeCenterConfig.types[0]?.hex || "#ffcb05";

  const getEnergyColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return OFFICIAL_ENERGY_COLORS[norm] || OFFICIAL_ENERGY_COLORS.colorless;
  };

  const handleSliceClick = (slice: typeof chartSlices[0]) => {
    if (slice.isOutros) {
      setIsOutrosExpanded(true);
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
      {/* Card Unificado com Donut Chart e Carrossel 3D */}
      <div
        className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all border border-white/[0.05]"
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
        {/* Header com Informações do Deck Focado (Acima do Donut e do Carrossel) */}
        {activeDeck && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeDeck.deckName}
                </h3>
                <EnergyBadge energyRaw={activeDeck.tipoEnergia} />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
                Representatividade de{" "}
                <strong className="text-amber-400 font-bold">{activeDeck.percent.toFixed(1)}%</strong> no metagame ({activeDeck.count} de {totalDecks} registros na temporada)
              </p>
            </div>

            {activeDeck.limitless && (
              <a
                href={activeDeck.limitless}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-all shadow-md shrink-0"
              >
                <span>Ver Lista no Limitless</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo: Carrossel 3D das Cartas Pokémon (Proporção oficial 63:88 sem corte de bordas) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative overflow-visible py-4">
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[63/88] flex items-center justify-center overflow-visible">
              {/* Controles de Navegação */}
              <button
                onClick={handlePrev}
                className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
                aria-label="Deck anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
                aria-label="Próximo deck"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Pilha 3D das Cartas (Sem corte nas bordas e sem sombra artificial no rodapé) */}
              <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                {carouselDecks.map((deck, idx) => {
                  const offset = (idx - carouselIndex + carouselDecks.length) % carouselDecks.length;
                  const isCenter = offset === 0;
                  const isRight = offset === 1;
                  const isLeft = offset === carouselDecks.length - 1;

                  let transformStyle = "scale-75 opacity-0 pointer-events-none";
                  let zIndex = 0;

                  if (isCenter) {
                    transformStyle = "scale-100 opacity-100 z-20 translate-x-0";
                    zIndex = 20;
                  } else if (isRight) {
                    transformStyle = "scale-90 opacity-40 z-10 translate-x-10 sm:translate-x-14 rotate-3";
                    zIndex = 10;
                  } else if (isLeft) {
                    transformStyle = "scale-90 opacity-40 z-10 -translate-x-10 sm:-translate-x-14 -rotate-3";
                    zIndex = 10;
                  }

                  return (
                    <div
                      key={deck.deckName}
                      className={`absolute w-[220px] sm:w-[245px] aspect-[63/88] rounded-2xl overflow-hidden transition-all duration-500 ease-out shadow-2xl cursor-pointer ${transformStyle}`}
                      style={{ zIndex }}
                      onClick={() => setCarouselIndex(idx)}
                    >
                      {deck.imagem ? (
                        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl">
                          <img
                            src={deck.imagem}
                            alt={deck.deckName}
                            className="w-full h-full object-contain select-none"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#0a0f1d] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                          <span className="text-4xl mb-3">⚡</span>
                          <span className="font-bold text-white text-base">{deck.deckName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lado Direito: Gráfico Donut com Fatias em Gradiente e Recortes Conceituais Supergrandes */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
            {/* Botão de retorno do Drill-down */}
            {isOutrosExpanded && (
              <div className="w-full flex justify-center mb-3">
                <button
                  onClick={() => setIsOutrosExpanded(false)}
                  className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/30 px-4 py-1.5 text-xs font-bold text-sky-200 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>← Voltar para visão geral</span>
                </button>
              </div>
            )}

            <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
              <svg
                viewBox="0 0 440 440"
                className="w-full h-full overflow-visible select-none drop-shadow-2xl"
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
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.96} />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.88} />
                      </linearGradient>
                    );
                  })}
                  {/* Clip paths para recortar imagem dentro de cada fatia */}
                  {computedSlices.map((slice) => (
                    <clipPath key={`clip-${slice.idx}`} id={`sliceClip-${slice.idx}`}>
                      <path d={slice.pathData} />
                    </clipPath>
                  ))}
                </defs>

                {/* 1. Fatias do Donut com Gradiente de Energia Vibrante */}
                <g>
                  {computedSlices.map((slice) => {
                    const isHovered = hoveredDeck === slice.name;
                    return (
                      <path
                        key={`path-${slice.idx}`}
                        d={slice.pathData}
                        fill={
                          slice.isOutros
                            ? "#334155"
                            : `url(#donutGrad-${slice.idx})`
                        }
                        stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                        strokeWidth={isHovered ? 3 : 1}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => handleSliceHover(slice.name)}
                        onMouseLeave={() => setHoveredDeck(null)}
                        onClick={() => handleSliceClick(slice)}
                      />
                    );
                  })}
                </g>

                {/* 2. Sprites Supergrandes com Recorte Conceitual no Rosto do Pokémon */}
                <g className="pointer-events-none">
                  {computedSlices.map((slice) => {
                    if (slice.isOutros || !slice.icone) return null;
                    const isHovered = hoveredDeck === slice.name;
                    // Ícone supergrande para criar o corte de close conceitual na fatia
                    const iconSize = slice.sliceAngle > 0.4 ? 130 : slice.sliceAngle > 0.25 ? 110 : 85;

                    return (
                      <g key={`embedded-icon-${slice.idx}`} clipPath={`url(#sliceClip-${slice.idx})`}>
                        <image
                          href={slice.icone}
                          x={slice.midX - iconSize / 2}
                          y={slice.midY - iconSize / 2}
                          width={iconSize}
                          height={iconSize}
                          preserveAspectRatio="xMidYMid slice"
                          opacity={isHovered ? 1 : 0.88}
                          className="transition-all duration-300 filter brightness-110 contrast-105"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* 3. Rótulos de Porcentagem com Borda de Alto Contraste (Sempre Legíveis) */}
                <g className="pointer-events-none">
                  {computedSlices.map((slice) => {
                    const hasRoom = slice.sliceAngle >= 0.08 || slice.isOutros;
                    if (!hasRoom) return null;

                    const label = slice.isOutros ? "Outros" : slice.percentStr;
                    const fontSize = slice.isOutros ? 11 : slice.percent >= 10 ? 14 : 12;

                    return (
                      <g
                        key={`text-group-${slice.idx}`}
                        transform={`rotate(${slice.textRotation}, ${slice.midX}, ${slice.midY})`}
                      >
                        <text
                          x={slice.midX}
                          y={slice.midY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          stroke="#020617"
                          strokeWidth={4}
                          strokeLinejoin="round"
                          paintOrder="stroke fill"
                          fontSize={fontSize}
                          fontWeight="800"
                          className="tabular-nums select-none"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* 4. Centro do Donut Minimalista: % e Nome do Deck com Cores do Tipo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center flex flex-col items-center justify-center max-w-[140px] px-2 animate-in fade-in zoom-in-95 duration-200">
                  <span
                    className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums drop-shadow-md"
                    style={{ color: primaryEnergyColor }}
                  >
                    {activeHoverSlice
                      ? activeHoverSlice.percentStr
                      : activeDeck
                      ? `${activeDeck.percent.toFixed(1)}%`
                      : ""}
                  </span>

                  <span
                    className="text-xs sm:text-sm font-bold leading-tight truncate w-full mt-0.5 drop-shadow-sm text-slate-100"
                    style={{ color: primaryEnergyColor }}
                  >
                    {activeHoverSlice ? activeHoverSlice.name : activeDeck?.deckName}
                  </span>
                </div>
              </div>
            </div>

            {/* Dica de Interatividade */}
            <p className="text-[11px] text-slate-400 font-normal text-center mt-3">
              {isOutrosExpanded
                ? "💡 Visualizando decks com <2% de presença. Clique em 'Voltar para visão geral' para restaurar."
                : "💡 Decks com ≥2% de presença. Passe o mouse ou clique em qualquer fatia para sincronizar."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

