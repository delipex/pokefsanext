"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, RotateCcw, Orbit, CircleDot } from "lucide-react";
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

const ENERGY_LABELS: Record<string, { label: string; icon: string }> = {
  grass: { label: "Planta", icon: "🌿" },
  fire: { label: "Fogo", icon: "🔥" },
  water: { label: "Água", icon: "💧" },
  lightning: { label: "Raios", icon: "⚡" },
  electric: { label: "Raios", icon: "⚡" },
  psychic: { label: "Psíquico", icon: "👁️" },
  fighting: { label: "Luta", icon: "🥊" },
  darkness: { label: "Trevas", icon: "🌑" },
  dark: { label: "Trevas", icon: "🌑" },
  metal: { label: "Metal", icon: "⚙️" },
  dragon: { label: "Dragão", icon: "🐉" },
  colorless: { label: "Incolor", icon: "⭐" },
};

function getArcPath(cx: number, cy: number, innerR: number, outerR: number, startA: number, endA: number) {
  const diff = endA - startA;
  const largeArc = diff > Math.PI ? 1 : 0;
  // Margem mínima para evitar sobreposição
  const x1Out = cx + outerR * Math.cos(startA);
  const y1Out = cy + outerR * Math.sin(startA);
  const x2Out = cx + outerR * Math.cos(endA);
  const y2Out = cy + outerR * Math.sin(endA);

  const x1In = cx + innerR * Math.cos(startA);
  const y1In = cy + innerR * Math.sin(startA);
  const x2In = cx + innerR * Math.cos(endA);
  const y2In = cy + innerR * Math.sin(endA);

  return `M ${x1Out} ${y1Out} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1In} ${y1In} Z`.trim();
}

export function MetagameDashboard({ metagameEntries, decksInfo }: MetagameDashboardProps) {
  const [chartMode, setChartMode] = useState<"sunburst" | "donut">("sunburst");
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [hoveredDeck, setHoveredDeck] = useState<string | null>(null);
  const [hoveredEnergy, setHoveredEnergy] = useState<string | null>(null);
  const [isOutrosExpanded, setIsOutrosExpanded] = useState<boolean>(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Contagem e estatísticas brutas dos decks
  const { deckStats, totalDecks, carouselDecks, energyGroups } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of metagameEntries) {
      const name = entry.deckNome?.trim();
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

    // Carrossel contém todos os decks registrados (exceto agrupamento genérico)
    const validDecks = stats.filter(
      (d) => d.deckName.toLowerCase() !== "outros" && d.deckName.toLowerCase() !== "outros decks"
    );

    // Agrupamento por Tipo de Energia para o Sunburst
    const energyMap: Record<string, {
      energy: string;
      totalCount: number;
      percent: number;
      decks: typeof stats;
    }> = {};

    stats.forEach((d) => {
      const isOutrosVal = d.deckName.toLowerCase() === "outros" || d.deckName.toLowerCase() === "outros decks";
      const normEnergy = (isOutrosVal ? "colorless" : d.tipoEnergia || "colorless").toLowerCase().split("+")[0].trim();
      
      if (!energyMap[normEnergy]) {
        energyMap[normEnergy] = {
          energy: normEnergy,
          totalCount: 0,
          percent: 0,
          decks: [],
        };
      }
      energyMap[normEnergy].totalCount += d.count;
      energyMap[normEnergy].decks.push(d);
    });

    const groups = Object.values(energyMap)
      .map((g) => ({
        ...g,
        percent: (g.totalCount / total) * 100,
        decks: g.decks.sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.totalCount - a.totalCount);

    return {
      deckStats: stats,
      totalDecks: metagameEntries.length,
      carouselDecks: validDecks.length > 0 ? validDecks : stats,
      energyGroups: groups,
    };
  }, [metagameEntries, decksInfo]);

  // 2. Geometria do SUNBURST CHART (2 Níveis: Anel Interno = Energia, Anel Externo = Decks)
  const sunburstSlices = useMemo(() => {
    const cx = 220;
    const cy = 220;
    const innerR1 = 76;
    const outerR1 = 126;
    const midR1 = (innerR1 + outerR1) / 2;

    const innerR2 = 132;
    const outerR2 = 215;
    const midR2 = (innerR2 + outerR2) / 2;

    const totalCount = energyGroups.reduce((acc, g) => acc + g.totalCount, 0) || 1;
    let accumulatedAngle = -Math.PI / 2; // Inicia às 12 horas

    const innerSlices: Array<{
      energy: string;
      label: string;
      icon: string;
      count: number;
      percent: number;
      percentStr: string;
      startAngle: number;
      endAngle: number;
      sliceAngle: number;
      midAngle: number;
      pathData: string;
      midX: number;
      midY: number;
      textRotation: number;
    }> = [];

    const outerSlices: Array<{
      deckName: string;
      energy: string;
      count: number;
      percent: number;
      percentStr: string;
      icone: string | null;
      startAngle: number;
      endAngle: number;
      sliceAngle: number;
      midAngle: number;
      pathData: string;
      midX: number;
      midY: number;
      textRotation: number;
      uniqueKey: string;
    }> = [];

    energyGroups.forEach((group, gIdx) => {
      const groupAngle = (group.totalCount / totalCount) * (2 * Math.PI);
      const groupStartAngle = accumulatedAngle;
      const groupEndAngle = accumulatedAngle + groupAngle;
      const groupMidAngle = (groupStartAngle + groupEndAngle) / 2;

      // Anel Interno: Arco da Energia
      const path1 = getArcPath(cx, cy, innerR1, outerR1, groupStartAngle, groupEndAngle);
      const midX1 = cx + midR1 * Math.cos(groupMidAngle);
      const midY1 = cy + midR1 * Math.sin(groupMidAngle);

      let textRot1 = (groupMidAngle * 180) / Math.PI;
      if (textRot1 > 90 && textRot1 < 270) textRot1 += 180;
      else if (textRot1 < -90 && textRot1 > -270) textRot1 += 180;

      const meta = ENERGY_LABELS[group.energy] || { label: group.energy, icon: "⭐" };

      innerSlices.push({
        energy: group.energy,
        label: meta.label,
        icon: meta.icon,
        count: group.totalCount,
        percent: group.percent,
        percentStr: Math.round(group.percent) + "%",
        startAngle: groupStartAngle,
        endAngle: groupEndAngle,
        sliceAngle: groupAngle,
        midAngle: groupMidAngle,
        pathData: path1,
        midX: midX1,
        midY: midY1,
        textRotation: textRot1,
      });

      // Anel Externo: Decks daquela energia particionando exatamente o arco do grupo
      let deckAccumAngle = groupStartAngle;
      group.decks.forEach((deck, dIdx) => {
        const deckAngle = (deck.count / group.totalCount) * groupAngle;
        const deckStartAngle = deckAccumAngle;
        const deckEndAngle = deckAccumAngle + deckAngle;
        const deckMidAngle = (deckStartAngle + deckEndAngle) / 2;
        deckAccumAngle = deckEndAngle;

        const path2 = getArcPath(cx, cy, innerR2, outerR2, deckStartAngle, deckEndAngle);
        const midX2 = cx + midR2 * Math.cos(deckMidAngle);
        const midY2 = cy + midR2 * Math.sin(deckMidAngle);

        let textRot2 = (deckMidAngle * 180) / Math.PI;
        if (textRot2 > 90 && textRot2 < 270) textRot2 += 180;
        else if (textRot2 < -90 && textRot2 > -270) textRot2 += 180;

        outerSlices.push({
          deckName: deck.deckName,
          energy: group.energy,
          count: deck.count,
          percent: deck.percent,
          percentStr: deck.percent < 1 ? deck.percent.toFixed(1) + "%" : Math.round(deck.percent) + "%",
          icone: deck.icone,
          startAngle: deckStartAngle,
          endAngle: deckEndAngle,
          sliceAngle: deckAngle,
          midAngle: deckMidAngle,
          pathData: path2,
          midX: midX2,
          midY: midY2,
          textRotation: textRot2,
          uniqueKey: `sunburst-deck-${gIdx}-${dIdx}-${deck.deckName}`,
        });
      });

      accumulatedAngle = groupEndAngle;
    });

    return { innerSlices, outerSlices };
  }, [energyGroups]);

  // 3. Geometria do DONUT CLÁSSICO (Fallback para comparação)
  const classicDonutSlices = useMemo(() => {
    const total = totalDecks || 1;
    let outrosCount = 0;
    const outrosList: typeof deckStats = [];
    const mainList: typeof deckStats = [];

    deckStats.forEach((d) => {
      const isOutrosVal = d.deckName.toLowerCase() === "outros" || d.deckName.toLowerCase() === "outros decks";
      const isMinor = d.percent < 2.0 || isOutrosVal;
      if (isMinor) {
        outrosCount += d.count;
        outrosList.push(d);
      } else {
        mainList.push(d);
      }
    });

    let currentSlices = (isOutrosExpanded ? outrosList : mainList).map((d) => ({
      name: d.deckName,
      count: d.count,
      percent: d.percent,
      percentStr: d.percent < 1 ? d.percent.toFixed(1) + "%" : Math.round(d.percent) + "%",
      energy: d.tipoEnergia,
      icone: d.icone,
      isOutros: false,
    }));

    if (!isOutrosExpanded && outrosCount > 0) {
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

    const cx = 220;
    const cy = 220;
    const outerR = 195;
    const innerR = 78;
    const midR = (innerR + outerR) / 2;
    const totalVal = currentSlices.reduce((acc, s) => acc + s.count, 0) || 1;
    let accAngle = -Math.PI / 2;

    return currentSlices.map((slice, idx) => {
      const sliceAngle = (slice.count / totalVal) * (2 * Math.PI);
      const startAngle = accAngle;
      const endAngle = accAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;
      accAngle = endAngle;

      const pathData = getArcPath(cx, cy, innerR, outerR, startAngle, endAngle);
      const midX = cx + midR * Math.cos(midAngle);
      const midY = cy + midR * Math.sin(midAngle);

      let textRotation = (midAngle * 180) / Math.PI;
      if (textRotation > 90 && textRotation < 270) textRotation += 180;
      else if (textRotation < -90 && textRotation > -270) textRotation += 180;

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
  }, [deckStats, totalDecks, isOutrosExpanded]);

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

  // Sincronização ao passar o mouse em um Deck do Sunburst / Donut
  const handleDeckHover = (deckName: string) => {
    setHoveredDeck(deckName);
    setHoveredEnergy(null);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);

    const foundIdx = carouselDecks.findIndex(
      (d) => d.deckName.toLowerCase() === deckName.toLowerCase()
    );
    if (foundIdx !== -1) {
      setCarouselIndex(foundIdx);
    }
  };

  // Sincronização ao passar o mouse em um Tipo de Energia (Anel Interno)
  const handleEnergyHover = (energy: string) => {
    setHoveredEnergy(energy);
    setHoveredDeck(null);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);

    const firstDeckOfEnergy = carouselDecks.find((d) => {
      const norm = (d.tipoEnergia || "colorless").toLowerCase().split("+")[0].trim();
      return norm === energy.toLowerCase();
    });

    if (firstDeckOfEnergy) {
      const foundIdx = carouselDecks.findIndex((d) => d.deckName === firstDeckOfEnergy.deckName);
      if (foundIdx !== -1) setCarouselIndex(foundIdx);
    }
  };

  const activeDeck = carouselDecks[carouselIndex] || deckStats[0] || null;
  const activeDeckInfo = decksInfo.find(
    (d) => d.nome.toLowerCase() === activeDeck?.deckName?.toLowerCase()
  );
  const activeEnergy = activeDeckInfo?.tipoEnergia || "colorless";
  const activeConfig = getMultiEnergyConfig(activeEnergy);
  const primaryEnergyColor = activeConfig.types[0]?.hex || "#ffcb05";

  // Objeto em foco no centro do Sunburst
  const activeSunburstEnergy = hoveredEnergy ? energyGroups.find((g) => g.energy === hoveredEnergy) : null;
  const activeSunburstDeck = hoveredDeck ? deckStats.find((d) => d.deckName === hoveredDeck) : null;

  const getEnergyColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return OFFICIAL_ENERGY_COLORS[norm] || OFFICIAL_ENERGY_COLORS.colorless;
  };

  return (
    <div className="w-full">
      {/* Card Unificado com Sunburst / Donut e Carrossel 3D */}
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
        {/* Header com Informações do Deck Focado + Seletor de Modo Sunburst vs Donut */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
          {activeDeck && (
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
          )}

          <div className="flex items-center gap-3">
            {/* Seletor Estilo iOS Segmented Control para Comparação */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/10 shadow-inner">
              <button
                onClick={() => setChartMode("sunburst")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "sunburst"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Sunburst 2-Níveis: Anel interno (Energias) + Anel externo (Decks)"
              >
                <Orbit className="h-3.5 w-3.5" />
                <span>Sunburst</span>
              </button>

              <button
                onClick={() => setChartMode("donut")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "donut"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Donut Clássico: Visão simplificada de 1 anel"
              >
                <CircleDot className="h-3.5 w-3.5" />
                <span>Donut</span>
              </button>
            </div>

            {activeDeck?.limitless && (
              <a
                href={activeDeck.limitless}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-all shadow-md shrink-0"
              >
                <span>Lista Limitless</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Lado Esquerdo: Carrossel 3D das Cartas Pokémon */}
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

              {/* Pilha 3D das Cartas */}
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

          {/* Lado Direito: Gráfico Radial (Sunburst ou Donut) */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative">
            {/* Botão de retorno do Drill-down (apenas no modo Donut) */}
            {chartMode === "donut" && isOutrosExpanded && (
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

            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
              <svg
                viewBox="0 0 440 440"
                className="w-full h-full overflow-visible select-none drop-shadow-2xl"
              >
                <defs>
                  {/* Gradientes oficiais para cada elemento */}
                  {Object.entries(OFFICIAL_ENERGY_COLORS).map(([energyKey, colors]) => (
                    <linearGradient
                      key={`sunburstGrad-${energyKey}`}
                      id={`sunburstGrad-${energyKey}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.96} />
                      <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.88} />
                    </linearGradient>
                  ))}

                  {/* Clip paths para os recortes de imagem dos decks no Sunburst */}
                  {sunburstSlices.outerSlices.map((slice) => (
                    <clipPath key={`clip-${slice.uniqueKey}`} id={`clip-${slice.uniqueKey}`}>
                      <path d={slice.pathData} />
                    </clipPath>
                  ))}

                  {/* Clip paths para o Donut clássico */}
                  {classicDonutSlices.map((slice) => (
                    <clipPath key={`clip-donut-${slice.idx}`} id={`clip-donut-${slice.idx}`}>
                      <path d={slice.pathData} />
                    </clipPath>
                  ))}
                </defs>

                {chartMode === "sunburst" ? (
                  /* ========================================================== */
                  /* SUNBURST CHART HIERÁRQUICO (2 ANÉIS CONCÊNTRICOS)          */
                  /* ========================================================== */
                  <>
                    {/* 1. Anel Interno: Grupos de Energia */}
                    <g>
                      {sunburstSlices.innerSlices.map((slice) => {
                        const isHovered = hoveredEnergy === slice.energy;
                        const isDeckInThisEnergyHovered = hoveredDeck
                          ? deckStats.find((d) => d.deckName === hoveredDeck)?.tipoEnergia?.toLowerCase()?.includes(slice.energy)
                          : false;
                        const isFocused = isHovered || isDeckInThisEnergyHovered;

                        return (
                          <path
                            key={`inner-energy-${slice.energy}`}
                            d={slice.pathData}
                            fill={`url(#sunburstGrad-${slice.energy})`}
                            stroke={isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.3)"}
                            strokeWidth={isFocused ? 2.5 : 1}
                            opacity={hoveredEnergy && !isHovered ? 0.45 : 1}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => handleEnergyHover(slice.energy)}
                            onMouseLeave={() => setHoveredEnergy(null)}
                            onClick={() => handleEnergyHover(slice.energy)}
                          />
                        );
                      })}
                    </g>

                    {/* 2. Anel Externo: Decks daquela Energia */}
                    <g>
                      {sunburstSlices.outerSlices.map((slice) => {
                        const isHovered = hoveredDeck === slice.deckName;
                        const isParentEnergyHovered = hoveredEnergy === slice.energy;
                        const opacityVal = hoveredDeck
                          ? isHovered
                            ? 1
                            : 0.35
                          : hoveredEnergy
                          ? isParentEnergyHovered
                            ? 1
                            : 0.3
                          : 0.95;

                        return (
                          <path
                            key={`outer-deck-${slice.uniqueKey}`}
                            d={slice.pathData}
                            fill={`url(#sunburstGrad-${slice.energy})`}
                            stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                            strokeWidth={isHovered ? 3 : 1}
                            opacity={opacityVal}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => handleDeckHover(slice.deckName)}
                            onMouseLeave={() => setHoveredDeck(null)}
                            onClick={() => handleDeckHover(slice.deckName)}
                          />
                        );
                      })}
                    </g>

                    {/* 3. Sprites de Pokémon nos Decks do Anel Externo */}
                    <g className="pointer-events-none">
                      {sunburstSlices.outerSlices.map((slice) => {
                        if (!slice.icone) return null;
                        const isHovered = hoveredDeck === slice.deckName;
                        const iconSize = slice.sliceAngle > 0.4 ? 120 : slice.sliceAngle > 0.2 ? 100 : 75;

                        return (
                          <g key={`sunburst-img-${slice.uniqueKey}`} clipPath={`url(#clip-${slice.uniqueKey})`}>
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

                    {/* 4. Rótulos do Anel Interno (Ícone e Nome da Energia) */}
                    <g className="pointer-events-none">
                      {sunburstSlices.innerSlices.map((slice) => {
                        if (slice.sliceAngle < 0.18) return null;
                        return (
                          <g
                            key={`inner-label-${slice.energy}`}
                            transform={`rotate(${slice.textRotation}, ${slice.midX}, ${slice.midY})`}
                          >
                            <text
                              x={slice.midX}
                              y={slice.midY}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#ffffff"
                              stroke="#020617"
                              strokeWidth={3.5}
                              strokeLinejoin="round"
                              paintOrder="stroke fill"
                              fontSize={slice.sliceAngle > 0.4 ? 12 : 10.5}
                              fontWeight="800"
                              className="tabular-nums select-none"
                            >
                              {slice.icon} {slice.percentStr}
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* 5. Rótulos do Anel Externo (% dos Decks Individuais) */}
                    <g className="pointer-events-none">
                      {sunburstSlices.outerSlices.map((slice) => {
                        if (slice.sliceAngle < 0.08) return null;
                        return (
                          <g
                            key={`outer-label-${slice.uniqueKey}`}
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
                              fontSize={slice.percent >= 10 ? 13 : 11}
                              fontWeight="800"
                              className="tabular-nums select-none"
                            >
                              {slice.percentStr}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </>
                ) : (
                  /* ========================================================== */
                  /* DONUT CLÁSSICO DE 1 NÍVEL                                  */
                  /* ========================================================== */
                  <>
                    <g>
                      {classicDonutSlices.map((slice) => {
                        const isHovered = hoveredDeck === slice.name;
                        return (
                          <path
                            key={`donut-path-${slice.idx}`}
                            d={slice.pathData}
                            fill={slice.isOutros ? "#334155" : `url(#sunburstGrad-${slice.energy})`}
                            stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                            strokeWidth={isHovered ? 3 : 1}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => handleDeckHover(slice.name)}
                            onMouseLeave={() => setHoveredDeck(null)}
                            onClick={() => {
                              if (slice.isOutros) setIsOutrosExpanded(true);
                              else handleDeckHover(slice.name);
                            }}
                          />
                        );
                      })}
                    </g>

                    <g className="pointer-events-none">
                      {classicDonutSlices.map((slice) => {
                        if (slice.isOutros || !slice.icone) return null;
                        const isHovered = hoveredDeck === slice.name;
                        const iconSize = slice.sliceAngle > 0.4 ? 130 : slice.sliceAngle > 0.25 ? 110 : 85;
                        return (
                          <g key={`donut-img-${slice.idx}`} clipPath={`url(#clip-donut-${slice.idx})`}>
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

                    <g className="pointer-events-none">
                      {classicDonutSlices.map((slice) => {
                        const hasRoom = slice.sliceAngle >= 0.08 || slice.isOutros;
                        if (!hasRoom) return null;
                        const label = slice.isOutros ? "Outros" : slice.percentStr;
                        const fontSize = slice.isOutros ? 11 : slice.percent >= 10 ? 14 : 12;

                        return (
                          <g
                            key={`donut-text-${slice.idx}`}
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
                  </>
                )}
              </svg>

              {/* Centro do Gráfico: Mostra % e Nome do Deck ou da Energia em Foco */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="text-center flex flex-col items-center justify-center max-w-[135px] px-2 animate-in fade-in zoom-in-95 duration-200">
                  <span
                    className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums drop-shadow-md"
                    style={{ color: primaryEnergyColor }}
                  >
                    {activeSunburstEnergy
                      ? `${activeSunburstEnergy.percent.toFixed(1)}%`
                      : activeSunburstDeck
                      ? `${activeSunburstDeck.percent.toFixed(1)}%`
                      : activeDeck
                      ? `${activeDeck.percent.toFixed(1)}%`
                      : ""}
                  </span>

                  <span
                    className="text-xs sm:text-sm font-bold leading-tight truncate w-full mt-0.5 drop-shadow-sm text-slate-100"
                    style={{ color: primaryEnergyColor }}
                  >
                    {activeSunburstEnergy
                      ? `Tipo ${ENERGY_LABELS[activeSunburstEnergy.energy]?.label || activeSunburstEnergy.energy}`
                      : activeSunburstDeck
                      ? activeSunburstDeck.deckName
                      : activeDeck?.deckName}
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {activeSunburstEnergy
                      ? `${activeSunburstEnergy.totalCount} jogos no tipo`
                      : activeSunburstDeck
                      ? `${activeSunburstDeck.count} aparições`
                      : `${activeDeck?.count || 0} aparições`}
                  </span>
                </div>
              </div>
            </div>

            {/* Dica de Interatividade */}
            <p className="text-[11px] text-slate-400 font-normal text-center mt-3">
              {chartMode === "sunburst"
                ? "💡 Anel Interno = Tipos de Energia • Anel Externo = Decks específicos. Passe o mouse ou clique para inspecionar."
                : isOutrosExpanded
                ? "💡 Visualizando decks com <2% de presença. Clique em 'Voltar para visão geral' para restaurar."
                : "💡 Decks com ≥2% de presença. Passe o mouse ou clique em qualquer fatia para sincronizar."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

