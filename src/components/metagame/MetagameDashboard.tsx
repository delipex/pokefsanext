"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  CircleDot,
  Calendar,
  Layers,
} from "lucide-react";
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

export interface StageInfo {
  id: number;
  data: string;
  tipo: string;
  multiplicador: number;
  temporada?: number;
}

interface MetagameDashboardProps {
  metagameEntries: MetagameEntry[];
  decksInfo: DeckInfo[];
  etapas?: StageInfo[];
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

function getArcPath(cx: number, cy: number, innerR: number, outerR: number, startA: number, endA: number) {
  const diff = endA - startA;
  const largeArc = diff > Math.PI ? 1 : 0;
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

function formatDateBR(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function MetagameDashboard({
  metagameEntries,
  decksInfo,
  etapas = [],
}: MetagameDashboardProps) {
  // Filtro de Etapa: "all" (Temporada Completa) ou "YYYY-MM-DD"
  const [selectedStageDate, setSelectedStageDate] = useState<string>("all");
  // Modo de visualização: "bars" (Opção 1) | "treemap" (Opção 2) | "donut" (Opção 3)
  const [chartMode, setChartMode] = useState<"bars" | "treemap" | "donut">("bars");
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [hoveredDeck, setHoveredDeck] = useState<string | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Ordenação cronológica das etapas para numeração estável
  const chronologicalStages = useMemo(() => {
    return [...etapas].sort((a, b) => a.data.localeCompare(b.data));
  }, [etapas]);

  // Etapas ordenadas da mais recente para a mais antiga para exibição no dropdown
  const stagesForSelect = useMemo(() => {
    return [...etapas].sort((a, b) => b.data.localeCompare(a.data));
  }, [etapas]);

  // Etapa selecionada atual
  const activeStageInfo = useMemo(() => {
    if (selectedStageDate === "all") return null;
    return etapas.find((e) => e.data === selectedStageDate) || null;
  }, [etapas, selectedStageDate]);

  const activeStageNumber = useMemo(() => {
    if (!activeStageInfo) return null;
    const idx = chronologicalStages.findIndex((s) => s.data === activeStageInfo.data);
    return idx !== -1 ? idx + 1 : null;
  }, [chronologicalStages, activeStageInfo]);

  // Entradas de metagame ativas (filtradas pela etapa ou todas)
  const activeMetagameEntries = useMemo(() => {
    if (selectedStageDate === "all") return metagameEntries;
    return metagameEntries.filter((m) => m.etapaData === selectedStageDate);
  }, [metagameEntries, selectedStageDate]);

  // Resetar o carrossel quando o filtro de etapa mudar
  useEffect(() => {
    setCarouselIndex(0);
    setHoveredDeck(null);
  }, [selectedStageDate]);

  // 1. Estatísticas consolidadas dos decks filtrados
  const { deckStats, totalDecks, carouselDecks, maxPercent } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of activeMetagameEntries) {
      const name = entry.deckNome?.trim();
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }

    const total = activeMetagameEntries.length || 1;

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

    const validDecks = stats.filter(
      (d) => d.deckName.toLowerCase() !== "outros" && d.deckName.toLowerCase() !== "outros decks"
    );

    const max = stats.length > 0 ? stats[0].percent : 1;

    return {
      deckStats: stats,
      totalDecks: activeMetagameEntries.length,
      carouselDecks: validDecks.length > 0 ? validDecks : stats,
      maxPercent: max || 1,
    };
  }, [activeMetagameEntries, decksInfo]);

  // 2. Geometria do Donut Top 5 (Opção 3)
  const top5DonutSlices = useMemo(() => {
    const total = totalDecks || 1;
    const TOP_LIMIT = 5;
    const topDecks = deckStats.slice(0, TOP_LIMIT);
    const otherDecks = deckStats.slice(TOP_LIMIT);
    const outrosCount = otherDecks.reduce((acc, d) => acc + d.count, 0);

    const currentSlices = topDecks.map((d) => ({
      name: d.deckName,
      count: d.count,
      percent: d.percent,
      percentStr: d.percent < 1 ? d.percent.toFixed(1) + "%" : Math.round(d.percent) + "%",
      energy: d.tipoEnergia,
      icone: d.icone,
      isOutros: false,
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

    const cx = 220;
    const cy = 220;
    const outerR = 195;
    const innerR = 80;
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
  }, [deckStats, totalDecks]);

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
    if (carouselDecks.length === 0) return;
    setCarouselIndex((prev) => (prev - 1 + carouselDecks.length) % carouselDecks.length);
  };

  const handleNext = () => {
    if (carouselDecks.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
  };

  // Sincronização ao passar o mouse ou clicar em um Deck
  const handleDeckHover = (deckName: string) => {
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
  const activeDeckInfo = decksInfo.find(
    (d) => d.nome.toLowerCase() === activeDeck?.deckName?.toLowerCase()
  );
  const activeEnergy = activeDeckInfo?.tipoEnergia || "colorless";
  const activeConfig = getMultiEnergyConfig(activeEnergy);
  const primaryEnergyColor = activeConfig.types[0]?.hex || "#ffcb05";

  const getEnergyColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return OFFICIAL_ENERGY_COLORS[norm] || OFFICIAL_ENERGY_COLORS.colorless;
  };

  const activeHoverDeckInfo = hoveredDeck
    ? deckStats.find((d) => d.deckName.toLowerCase() === hoveredDeck.toLowerCase())
    : null;

  return (
    <div className="w-full space-y-6">
      {/* BARRA DE FILTROS SUPERIOR: Seletor de Etapa + Seletor de 3 Gráficos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-lg">
        {/* Dropdown Seletor de Etapa com Ícone de Calendário */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <label htmlFor="stage-filter-select" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Filtrar por Etapa
            </label>
            <select
              id="stage-filter-select"
              value={selectedStageDate}
              onChange={(e) => setSelectedStageDate(e.target.value)}
              className="w-full bg-transparent text-sm font-black text-white focus:outline-none cursor-pointer truncate pr-2"
            >
              <option value="all" className="bg-slate-900 text-white font-bold">
                🏆 Toda a Temporada 5 ({etapas.length} etapas • {metagameEntries.length} decks)
              </option>
              {stagesForSelect.map((stage) => {
                const stageNum = chronologicalStages.findIndex((s) => s.data === stage.data) + 1;
                const formatted = formatDateBR(stage.data);
                const isPremier = stage.multiplicador > 1.0;
                return (
                  <option key={stage.data} value={stage.data} className="bg-slate-900 text-white">
                    Etapa #{stageNum} • {formatted} ({stage.tipo}{isPremier ? ` • ${stage.multiplicador}x` : ""})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Seletor com as 3 Opções de Visualização de Gráficos */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 shadow-inner shrink-0 justify-center">
          <button
            onClick={() => setChartMode("bars")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === "bars"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Opção 1: Barras Horizontais com Metagame Share"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>1. Barras</span>
          </button>

          <button
            onClick={() => setChartMode("treemap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === "treemap"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Opção 2: Mosaico de Blocos Proporcionais"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>2. Mosaico</span>
          </button>

          <button
            onClick={() => setChartMode("donut")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartMode === "donut"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Opção 3: Donut Espaçoso focado nos Top 5"
          >
            <CircleDot className="h-3.5 w-3.5" />
            <span>3. Donut Top 5</span>
          </button>
        </div>
      </div>

      {/* Card Unificado com Visualizador de Metagame e Carrossel 3D */}
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
        {/* Header com Informações do Deck Focado + Contexto da Etapa */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-white/[0.06] pb-5 mb-6">
          {activeDeck ? (
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2.5 justify-center lg:justify-start flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeDeck.deckName}
                </h3>
                <EnergyBadge energyRaw={activeDeck.tipoEnergia} />
                {selectedStageDate !== "all" && activeStageNumber && (
                  <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                    Etapa #{activeStageNumber}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
                Representatividade de{" "}
                <strong className="text-amber-400 font-bold">{activeDeck.percent.toFixed(1)}%</strong>{" "}
                {selectedStageDate === "all" ? "no metagame geral" : `na Etapa #${activeStageNumber}`} (
                {activeDeck.count} de {totalDecks} {totalDecks === 1 ? "registro" : "registros"})
              </p>
            </div>
          ) : (
            <div className="text-center lg:text-left text-slate-400 text-sm font-medium">
              Nenhum deck registrado para esta etapa.
            </div>
          )}

          {activeDeck?.limitless && (
            <a
              href={activeDeck.limitless}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Lista no Limitless</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {totalDecks === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-base font-bold text-white">Nenhum deck encontrado nesta etapa</p>
            <p className="text-xs text-slate-500">Selecione outra etapa no menu superior para visualizar o metagame.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Lado Esquerdo: Carrossel 3D das Cartas Pokémon */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative overflow-visible py-4">
              <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[63/88] flex items-center justify-center overflow-visible">
                {/* Controles de Navegação */}
                {carouselDecks.length > 1 && (
                  <>
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
                  </>
                )}

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

            {/* Lado Direito: Visualizador Selecionado (Barras, Mosaico ou Donut) */}
            <div className="md:col-span-7 flex flex-col justify-center relative min-h-[380px]">
              {/* ========================================================== */}
              {/* OPÇÃO 1: BARRAS HORIZONTAIS INTERATIVAS (PADRÃO LIMITLESS)  */}
              {/* ========================================================== */}
              {chartMode === "bars" && (
                <div className="w-full space-y-2.5 max-h-[420px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar animate-in fade-in duration-300">
                  {deckStats.map((deck, idx) => {
                    const colors = getEnergyColor(deck.tipoEnergia);
                    const isCurrent = activeDeck?.deckName.toLowerCase() === deck.deckName.toLowerCase();
                    const isHovered = hoveredDeck === deck.deckName;
                    const barWidth = `${(deck.percent / maxPercent) * 100}%`;

                    return (
                      <div
                        key={`bar-${deck.deckName}`}
                        onMouseEnter={() => handleDeckHover(deck.deckName)}
                        onMouseLeave={() => setHoveredDeck(null)}
                        onClick={() => handleDeckHover(deck.deckName)}
                        className={`group relative rounded-2xl p-3 border transition-all duration-200 cursor-pointer ${
                          isCurrent || isHovered
                            ? "bg-white/[0.08] border-white/30 shadow-lg scale-[1.01]"
                            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 relative z-10 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank # */}
                            <span
                              className={`w-6 text-center text-xs font-black tabular-nums ${
                                idx === 0
                                  ? "text-amber-400"
                                  : idx === 1
                                  ? "text-slate-200"
                                  : idx === 2
                                  ? "text-amber-600"
                                  : "text-slate-500"
                              }`}
                            >
                              #{idx + 1}
                            </span>

                            {/* Avatar / Ícone do Pokémon */}
                            <div className="h-8 w-8 rounded-xl bg-slate-900 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                              {deck.icone ? (
                                <img
                                  src={deck.icone}
                                  alt={deck.deckName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs">⚡</span>
                              )}
                            </div>

                            {/* Nome do Deck */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                                  {deck.deckName}
                                </span>
                                <EnergyBadge energyRaw={deck.tipoEnergia} />
                              </div>
                            </div>
                          </div>

                          {/* Estatísticas Numéricas: % e Jogos */}
                          <div className="text-right shrink-0 flex items-baseline gap-2">
                            <span
                              className="text-base sm:text-lg font-black tabular-nums"
                              style={{ color: colors.primary }}
                            >
                              {deck.percent.toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                              ({deck.count} {deck.count === 1 ? "jogo" : "jogos"})
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso Horizontal Proporcional */}
                        <div className="w-full h-2 rounded-full bg-slate-900/80 overflow-hidden border border-white/5 relative">
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                            style={{
                              width: barWidth,
                              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ========================================================== */}
              {/* OPÇÃO 2: TREEMAP MOSAICO (GRADE DE BLOCOS PROPORCIONAIS)   */}
              {/* ========================================================== */}
              {chartMode === "treemap" && (
                <div className="w-full max-h-[420px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {deckStats.map((deck, idx) => {
                      const colors = getEnergyColor(deck.tipoEnergia);
                      const isCurrent = activeDeck?.deckName.toLowerCase() === deck.deckName.toLowerCase();
                      const isHovered = hoveredDeck === deck.deckName;
                      const isHero = idx === 0;

                      return (
                        <div
                          key={`treemap-${deck.deckName}`}
                          onMouseEnter={() => handleDeckHover(deck.deckName)}
                          onMouseLeave={() => setHoveredDeck(null)}
                          onClick={() => handleDeckHover(deck.deckName)}
                          className={`group relative rounded-2xl p-4 overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] ${
                            isHero ? "col-span-2 row-span-1 min-h-[130px]" : "col-span-1"
                          } ${
                            isCurrent || isHovered
                              ? "border-white/40 shadow-2xl scale-[1.02]"
                              : "border-white/10 hover:border-white/25"
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}25 0%, rgba(15, 23, 42, 0.95) 100%)`,
                          }}
                        >
                          {/* Marca d'água com ícone do Pokémon */}
                          {deck.icone && (
                            <img
                              src={deck.icone}
                              alt=""
                              className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-24 sm:h-24 opacity-20 pointer-events-none object-contain filter grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-300"
                            />
                          )}

                          <div className="flex items-start justify-between gap-2 relative z-10">
                            <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                              #{idx + 1}
                              <EnergyBadge energyRaw={deck.tipoEnergia} />
                            </span>
                            <span
                              className="text-xl sm:text-2xl font-black tabular-nums drop-shadow-md"
                              style={{ color: colors.primary }}
                            >
                              {deck.percent.toFixed(1)}%
                            </span>
                          </div>

                          <div className="relative z-10 mt-3">
                            <span className="font-black text-sm sm:text-base text-white block truncate">
                              {deck.deckName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {deck.count} {deck.count === 1 ? "aparição" : "aparições"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* OPÇÃO 3: DONUT ESPAÇOSO TOP 5 + OUTROS                    */}
              {/* ========================================================== */}
              {chartMode === "donut" && (
                <div className="relative w-full max-w-[390px] aspect-square mx-auto flex items-center justify-center animate-in fade-in duration-300">
                  <svg
                    viewBox="0 0 440 440"
                    className="w-full h-full overflow-visible select-none drop-shadow-2xl"
                  >
                    <defs>
                      {top5DonutSlices.map((slice, i) => {
                        const colors = getEnergyColor(slice.energy);
                        return (
                          <linearGradient
                            key={`donutTop5Grad-${i}`}
                            id={`donutTop5Grad-${i}`}
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
                      {top5DonutSlices.map((slice) => (
                        <clipPath key={`clip-top5-${slice.idx}`} id={`clip-top5-${slice.idx}`}>
                          <path d={slice.pathData} />
                        </clipPath>
                      ))}
                    </defs>

                    <g>
                      {top5DonutSlices.map((slice) => {
                        const isHovered = hoveredDeck === slice.name;
                        return (
                          <path
                            key={`donut-top5-path-${slice.idx}`}
                            d={slice.pathData}
                            fill={slice.isOutros ? "#334155" : `url(#donutTop5Grad-${slice.idx})`}
                            stroke={isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                            strokeWidth={isHovered ? 3.5 : 1}
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => handleDeckHover(slice.name)}
                            onMouseLeave={() => setHoveredDeck(null)}
                            onClick={() => handleDeckHover(slice.name)}
                          />
                        );
                      })}
                    </g>

                    {/* Sprites recortados */}
                    <g className="pointer-events-none">
                      {top5DonutSlices.map((slice) => {
                        if (slice.isOutros || !slice.icone) return null;
                        const isHovered = hoveredDeck === slice.name;
                        const iconSize = slice.sliceAngle > 0.4 ? 130 : 100;
                        return (
                          <g key={`donut-top5-img-${slice.idx}`} clipPath={`url(#clip-top5-${slice.idx})`}>
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

                    {/* Rótulos com contorno */}
                    <g className="pointer-events-none">
                      {top5DonutSlices.map((slice) => {
                        const label = slice.isOutros ? "Outros" : slice.percentStr;
                        return (
                          <g
                            key={`donut-top5-text-${slice.idx}`}
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
                              fontSize={13}
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

                  {/* Centro do Donut */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center flex flex-col items-center justify-center max-w-[130px] px-2">
                      <span
                        className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums drop-shadow-md"
                        style={{ color: primaryEnergyColor }}
                      >
                        {activeHoverDeckInfo
                          ? `${activeHoverDeckInfo.percent.toFixed(1)}%`
                          : activeDeck
                          ? `${activeDeck.percent.toFixed(1)}%`
                          : ""}
                      </span>

                      <span
                        className="text-xs sm:text-sm font-bold leading-tight truncate w-full mt-0.5 drop-shadow-sm text-slate-100"
                        style={{ color: primaryEnergyColor }}
                      >
                        {activeHoverDeckInfo ? activeHoverDeckInfo.deckName : activeDeck?.deckName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dica de Interatividade */}
              <p className="text-[11px] text-slate-400 font-normal text-center mt-3">
                {chartMode === "bars"
                  ? "💡 Opção 1 (Barras): Leitura clara e direta. Role para explorar todos os arquétipos ou passe o mouse para focar."
                  : chartMode === "treemap"
                  ? "💡 Opção 2 (Mosaico): Blocos proporcionais estilo Bento Grid. Role a lista para explorar todos os arquétipos."
                  : "💡 Opção 3 (Donut Top 5): Fatias largas e espaçosas focadas exclusivamente nos líderes."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
