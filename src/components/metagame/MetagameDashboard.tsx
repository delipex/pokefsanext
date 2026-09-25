"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

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
  water: { primary: "#00B4D8", secondary: "#0077B6" },
  lightning: { primary: "#EBC816", secondary: "#b59704" },
  electric: { primary: "#EBC816", secondary: "#b59704" },
  psychic: { primary: "#D94293", secondary: "#9d1f64" },
  fighting: { primary: "#C55E13", secondary: "#8f3e04" },
  darkness: { primary: "#1B4958", secondary: "#0F2830" },
  dark: { primary: "#1B4958", secondary: "#0F2830" },
  metal: { primary: "#7E8E9E", secondary: "#4b5966" },
  dragon: { primary: "#8D56FF", secondary: "#5b21b6" },
  colorless: { primary: "#94a3b8", secondary: "#64748b" },
};

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

  // Mapa de decks cadastrados
  const decksMap = useMemo(() => {
    const map = new Map<string, DeckInfo>();
    decksInfo.forEach((deck) => {
      map.set(deck.nome.toLowerCase().trim(), deck);
    });
    return map;
  }, [decksInfo]);

  // Filtragem dos registros conforme a etapa selecionada
  const filteredEntries = useMemo(() => {
    if (selectedStageDate === "all") {
      return metagameEntries;
    }
    return metagameEntries.filter((entry) => entry.etapaData === selectedStageDate);
  }, [metagameEntries, selectedStageDate]);

  // Total de jogos na amostra filtrada
  const totalGames = filteredEntries.length;

  // Agrupamento e estatísticas dos decks
  const deckStats = useMemo(() => {
    if (totalGames === 0) return [];

    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const name = entry.deckNome ? entry.deckNome.trim() : "Outros";
      counts[name] = (counts[name] || 0) + 1;
    });

    const list = Object.entries(counts).map(([name, count]) => {
      const lower = name.toLowerCase();
      const info = decksMap.get(lower);
      const percent = (count / totalGames) * 100;

      return {
        deckName: name,
        count,
        percent,
        tipoEnergia: info?.tipoEnergia || "colorless",
        imagem: info?.imagem || null,
        icone: info?.icone || null,
        limitless: info?.limitless || null,
      };
    });

    // Ordena pelo maior número de aparições
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.deckName.localeCompare(b.deckName, "pt-BR");
    });

    return list;
  }, [filteredEntries, totalGames, decksMap]);

  // Percentual máximo para dimensionamento das barras
  const maxPercent = useMemo(() => {
    if (deckStats.length === 0) return 1;
    return Math.max(...deckStats.map((d) => d.percent));
  }, [deckStats]);

  // Decks para o carrossel 3D (prioriza os que têm imagem)
  const carouselDecks = useMemo(() => {
    const withImages = deckStats.filter((d) => d.imagem);
    return withImages.length > 0 ? withImages : deckStats;
  }, [deckStats]);

  // Resetar índice do carrossel ao mudar a etapa
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedStageDate]);

  // Autoplay do carrossel 3D (4.5s por slide)
  useEffect(() => {
    if (carouselDecks.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [carouselDecks.length]);

  const activeCarouselDeck = carouselDecks[carouselIndex] || carouselDecks[0] || null;

  // Deck ativo em hover ou selecionado no carrossel
  const activeHoverDeckInfo = useMemo(() => {
    if (!hoveredDeck) return null;
    return deckStats.find((d) => d.deckName.toLowerCase() === hoveredDeck.toLowerCase()) || null;
  }, [hoveredDeck, deckStats]);

  const displayedDeck = activeHoverDeckInfo || activeCarouselDeck;

  // Helper para cor de energia
  const getEnergyColor = (tipoEnergia: string) => {
    const lower = (tipoEnergia || "colorless").toLowerCase();
    return (
      OFFICIAL_ENERGY_COLORS[lower] || {
        primary: "#3b82f6",
        secondary: "#1d4ed8",
      }
    );
  };

  const primaryEnergyColor = displayedDeck
    ? getEnergyColor(displayedDeck.tipoEnergia).primary
    : "#3b82f6";

  const handlePrevSlide = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setCarouselIndex((prev) => (prev === 0 ? carouselDecks.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setCarouselIndex((prev) => (prev + 1) % carouselDecks.length);
  };

  const handleDeckHover = (deckName: string) => {
    setHoveredDeck(deckName);
    const idx = carouselDecks.findIndex((d) => d.deckName.toLowerCase() === deckName.toLowerCase());
    if (idx !== -1) {
      setCarouselIndex(idx);
    }
  };

  return (
    <div
      className="glass-card rounded-3xl p-5 sm:p-7 backdrop-blur-2xl transition-all border border-white/[0.08] shadow-2xl space-y-6"
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
      {/* Cabeçalho Unificado: Filtro de Amostragem e Informações da Amostra */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        {/* Seletor de Etapa */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Filtro de Amostragem:</span>
          </div>

          <div className="relative">
            <select
              value={selectedStageDate}
              onChange={(e) => setSelectedStageDate(e.target.value)}
              className="w-full sm:w-auto bg-slate-900/90 border border-white/20 rounded-xl px-4 py-2 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none pr-10 cursor-pointer shadow-lg"
            >
              <option value="all" className="bg-slate-900 text-white">
                🏆 Temporada Completa ({etapas.length} etapas • {metagameEntries.length} partidas)
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

        {/* Indicador de Estatística da Amostra */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium self-end sm:self-center">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          <span>{totalGames} {totalGames === 1 ? "registro processado" : "registros processados"} • {deckStats.length} arquétipos</span>
        </div>
      </div>

      {totalGames === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-base font-semibold">Nenhum dado de metagame encontrado para esta etapa.</p>
          <p className="text-xs text-slate-500 mt-1">Os decks jogados nesta etapa ainda não foram catalogados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-2">
          {/* Lado Esquerdo: Carrossel 3D Coverflow de Cartas */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            {/* Palco 3D do Carrossel */}
            <div className="relative w-full max-w-full h-[290px] sm:h-[330px] flex items-center justify-center [perspective:1000px] overflow-hidden select-none my-1">
              <div className="relative w-[180px] sm:w-[210px] h-[252px] sm:h-[294px] [transform-style:preserve-3d]">
                {carouselDecks.map((deck, i) => {
                  const N = carouselDecks.length;
                  let diff = i - carouselIndex;
                  if (diff > Math.floor(N / 2)) diff -= N;
                  if (diff < -Math.floor(N / 2)) diff += N;
                  const isActive = diff === 0;
                  const offset = Math.abs(diff);
                  const direction = diff > 0 ? 1 : -1;
                  const rotate = 35 * direction;
                  const translateX = isActive ? 0 : (85 * direction) + (18 * diff);
                  const translateZ = isActive ? 0 : -85 - (offset * 30);
                  const opacity = offset > 2 ? 0 : Math.max(0, 1 - (offset * 0.32));
                  const zIndex = 10 - offset;
                  const energyConfig = getEnergyColor(deck.tipoEnergia);

                  return (
                    <div
                      key={`card-${deck.deckName}-${i}`}
                      onClick={() => {
                        if (isActive) {
                          if (deck.limitless) {
                            window.open(deck.limitless, "_blank", "noopener,noreferrer");
                          }
                        } else {
                          setCarouselIndex(i);
                          setHoveredDeck(null);
                        }
                      }}
                      className={`absolute inset-0 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer ${
                        isActive ? "ring-2 ring-white/40 shadow-2xl" : "hover:opacity-100"
                      }`}
                      style={{
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${isActive ? 0 : -rotate}deg)`,
                        opacity,
                        zIndex,
                        boxShadow: isActive
                          ? `0 20px 40px -10px rgba(0,0,0,0.8), 0 0 30px ${energyConfig.primary}45`
                          : "0 10px 25px rgba(0,0,0,0.6)",
                        pointerEvents: offset > 2 ? "none" : "auto",
                      }}
                    >
                      {deck.imagem ? (
                        <img
                          src={deck.imagem}
                          alt={deck.deckName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 border border-white/20 flex flex-col items-center justify-center p-4">
                          <span className="text-3xl mb-1">⚡</span>
                          <span className="text-xs font-bold text-center text-slate-300">
                            {deck.deckName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informações do Deck Ativo */}
            {displayedDeck && (
              <div className="w-full flex flex-col items-center text-center mt-3 min-h-[145px] justify-start">
                {/* Nome do Deck + Bolinhas de Energia ao lado (sem texto) */}
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-[280px]">
                    {displayedDeck.deckName}
                  </h3>
                  <EnergyBadge energyRaw={displayedDeck.tipoEnergia} showLabel={false} size="sm" />
                </div>

                {/* Estatísticas de Participação */}
                <div className="flex items-center gap-2.5 mt-1.5 text-sm font-bold">
                  <span style={{ color: primaryEnergyColor }} className="text-base sm:text-lg font-black">
                    {displayedDeck.percent.toFixed(1)}% do Meta
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    {displayedDeck.count} {displayedDeck.count === 1 ? "partida" : "partidas"}
                  </span>
                </div>

                {/* Controles de Navegação (Setas e Indicadores de Ponto) */}
                {carouselDecks.length > 1 && (
                  <div className="flex items-center gap-3 mt-3.5">
                    <button
                      onClick={handlePrevSlide}
                      className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                      aria-label="Deck anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {carouselDecks.slice(0, 8).map((_, idx) => (
                        <button
                          key={`dot-${idx}`}
                          onClick={() => {
                            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
                            setCarouselIndex(idx);
                            setHoveredDeck(null);
                          }}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === (carouselIndex % Math.min(8, carouselDecks.length)) && !activeHoverDeckInfo
                              ? "w-6 bg-white shadow-sm"
                              : "w-2 bg-slate-700 hover:bg-slate-500"
                          }`}
                          aria-label={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextSlide}
                      className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                      aria-label="Próximo deck"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lado Direito: Visualizador em Barras Horizontais Interativas */}
          <div className="md:col-span-7 flex flex-col justify-center relative min-h-[380px]">
            <div className="w-full space-y-2.5 max-h-[440px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
              {deckStats.map((deck, idx) => {
                const colors = getEnergyColor(deck.tipoEnergia);
                const isHovered = hoveredDeck === deck.deckName;
                const barWidth = `${(deck.percent / maxPercent) * 100}%`;

                return (
                  <div
                    key={`bar-${deck.deckName}`}
                    onMouseEnter={() => handleDeckHover(deck.deckName)}
                    onMouseLeave={() => setHoveredDeck(null)}
                    onClick={() => handleDeckHover(deck.deckName)}
                    className={`group relative rounded-2xl p-3 border transition-colors duration-150 cursor-pointer ${
                      isHovered
                        ? "bg-white/[0.08] border-white/20 shadow-md"
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 relative z-10 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
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

                        {/* Nome do Deck + Bolinhas de Tipo de Energia ao lado (sem texto) */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                              {deck.deckName}
                            </span>
                            <EnergyBadge energyRaw={deck.tipoEnergia} showLabel={false} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas Numéricas: % e Jogos + Botão Limitless */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        {deck.limitless && (
                          <a
                            href={deck.limitless}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 hover:border-blue-500/40 px-2 py-0.5 rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
                            title={`Ver listas de ${deck.deckName} no Limitless TCG`}
                          >
                            <span>Listas</span>
                            <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </a>
                        )}

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

            <p className="text-[11px] text-slate-400 font-normal text-center mt-3">
              💡 Passe o mouse ou clique sobre qualquer deck da lista para visualizar sua carta e estatísticas no carrossel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
