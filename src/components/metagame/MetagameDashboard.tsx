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

  // 3. Geometria Trigonométrica dos Arcos e Rótulos do Donut
  const cx = 220;
  const cy = 220;
  const outerRadius = 165;
  const innerRadius = 88;
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
  const activeCenterDeckName = hoveredDeck || activeDeck?.deckName || "Mega Lucario Ex";
  const activeCenterDeckInfo = decksInfo.find(
    (d) => d.nome.toLowerCase() === activeCenterDeckName.toLowerCase()
  );
  const activeCenterEnergy = activeCenterDeckInfo?.tipoEnergia || "fighting";
  const activeCenterConfig = getMultiEnergyConfig(activeCenterEnergy);
  const activeCenterIcon = activeCenterDeckInfo?.icone || activeHoverSlice?.icone || null;

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
          {/* Lado Esquerdo: Gráfico Donut com Imagens Embutidas nas Fatias */}
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
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.92} />
                        <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.78} />
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
                        onMouseEnter={() => handleSliceHover(slice.name)}
                        onMouseLeave={() => setHoveredDeck(null)}
                        onClick={() => handleSliceClick(slice)}
                      />
                    );
                  })}
                </g>

                {/* 2. Sprites Embutidos com Baixa Opacidade Dentro de Cada Fatia */}
                <g className="pointer-events-none">
                  {computedSlices.map((slice) => {
                    if (slice.isOutros || slice.isBack || !slice.icone) return null;
                    const isHovered = hoveredDeck === slice.name;
                    const iconSize = slice.sliceAngle > 0.3 ? 36 : 28;

                    return (
                      <g key={`embedded-icon-${slice.idx}`} clipPath={`url(#sliceClip-${slice.idx})`}>
                        <image
                          href={slice.icone}
                          x={slice.midX - iconSize / 2}
                          y={slice.midY - iconSize / 2}
                          width={iconSize}
                          height={iconSize}
                          preserveAspectRatio="xMidYMid meet"
                          opacity={isHovered ? 0.95 : 0.35}
                          className="transition-opacity duration-200 filter brightness-110"
                        />
                      </g>
                    );
                  })}
                </g>

                {/* 3. Rótulos de Porcentagem Dentro das Fatias */}
                <g className="pointer-events-none">
                  {computedSlices.map((slice) => {
                    if (slice.isBack) return null;
                    const hasRoom = slice.sliceAngle > 0.12 || slice.isOutros;
                    if (!hasRoom) return null;

                    return (
                      <text
                        key={`text-${slice.idx}`}
                        x={slice.midX}
                        y={slice.midY + (slice.icone ? 12 : 0)}
                        transform={`rotate(${slice.textRotation}, ${slice.midX}, ${slice.midY + (slice.icone ? 12 : 0)})`}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={slice.isOutros ? 9.5 : slice.percent >= 10 ? 11 : 9}
                        fontWeight="900"
                        className="font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                      >
                        {slice.isOutros ? "Outros" : slice.percentStr}
                      </text>
                    );
                  })}
                </g>
              </svg>

              {/* 4. Pílula Central com Imagem Oficial em Destaque, Nome do Deck e Estatísticas */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                  className="rounded-3xl p-3.5 sm:p-4 text-center shadow-2xl backdrop-blur-2xl border transition-all duration-300 w-[145px] sm:w-[155px] flex flex-col items-center justify-center"
                  style={{
                    background: activeCenterConfig.gradientBg || "rgba(15, 23, 42, 0.9)",
                    borderColor: activeCenterConfig.borderStyle ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)",
                    boxShadow: "0 10px 30px -4px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
                  }}
                >
                  {activeCenterIcon && (
                    <img
                      src={activeCenterIcon}
                      alt={activeCenterDeckName}
                      className="h-9 w-9 object-contain mb-1 drop-shadow-md animate-in fade-in zoom-in-95 duration-200"
                    />
                  )}

                  <span className="text-xs sm:text-sm font-black text-white block leading-tight tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate w-full">
                    {activeHoverSlice ? activeHoverSlice.name : activeCenterDeckName}
                  </span>

                  <span className="text-[10px] font-extrabold text-[#ffcb05] block mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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
            <p className="text-[11px] text-slate-400 font-medium text-center mt-3">
              {isOutrosExpanded
                ? "💡 Passe o mouse em uma fatia para focar ou em 'Voltar' para o resumo."
                : "💡 Passe o mouse ou clique em qualquer fatia para focar a carta no carrossel."}
            </p>
          </div>

          {/* Lado Direito: Carrossel 3D das Cartas Pokémon */}
          <div className="md:col-span-6 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] flex items-center justify-center">
              {/* Controles de Navegação */}
              <button
                onClick={handlePrev}
                className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
                aria-label="Deck anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-blue-600 transition-all shadow-xl backdrop-blur-md cursor-pointer"
                aria-label="Próximo deck"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Pilha 3D das Cartas (Sem borda amarela cafona) */}
              <div className="relative w-full h-full flex items-center justify-center">
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
                    transformStyle = "scale-85 opacity-40 z-10 translate-x-12 sm:translate-x-16 rotate-6";
                    zIndex = 10;
                  } else if (isLeft) {
                    transformStyle = "scale-85 opacity-40 z-10 -translate-x-12 sm:-translate-x-16 -rotate-6";
                    zIndex = 10;
                  }

                  return (
                    <div
                      key={deck.deckName}
                      className={`absolute w-[240px] sm:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 ease-out shadow-2xl cursor-pointer ${transformStyle}`}
                      style={{ zIndex }}
                      onClick={() => setCarouselIndex(idx)}
                    >
                      {deck.imagem ? (
                        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                          <img
                            src={deck.imagem}
                            alt={deck.deckName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#0a0f1d] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                          <span className="text-4xl mb-3">⚡</span>
                          <span className="font-bold text-white text-base">{deck.deckName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informações da Carta Ativa em Destaque */}
            {activeDeck && (
              <div className="w-full max-w-sm text-center space-y-2">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {activeDeck.deckName}
                  </h3>
                  <EnergyBadge energyRaw={activeDeck.tipoEnergia} />
                </div>

                <p className="text-xs text-slate-400 font-semibold">
                  Representatividade de{" "}
                  <strong className="text-yellow-400 font-black">{activeDeck.percent.toFixed(1)}%</strong> no
                  metagame ({activeDeck.count} de {totalDecks} jogadores)
                </p>

                {activeDeck.limitless && (
                  <div className="pt-2">
                    <a
                      href={activeDeck.limitless}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3.5 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-md"
                    >
                      <span>Ver no Limitless</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
