"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
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

  // Top 5 Decks mais populares para o Carrossel 3D
  const topDecks = useMemo(() => {
    return deckStats.slice(0, 5);
  }, [deckStats]);

  // Resetar índice do carrossel ao mudar a etapa
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedStageDate]);

  // Autoplay do carrossel 3D (pausa se hover)
  useEffect(() => {
    if (topDecks.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % topDecks.length);
    }, 4500);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [topDecks.length]);

  const activeDeck = topDecks[carouselIndex] || topDecks[0] || null;

  // Deck ativo em hover ou selecionado
  const activeHoverDeckInfo = useMemo(() => {
    if (!hoveredDeck) return null;
    return deckStats.find((d) => d.deckName.toLowerCase() === hoveredDeck.toLowerCase()) || null;
  }, [hoveredDeck, deckStats]);

  const displayedDeck = activeHoverDeckInfo || activeDeck;

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
    setCarouselIndex((prev) => (prev === 0 ? topDecks.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setCarouselIndex((prev) => (prev + 1) % topDecks.length);
  };

  const handleDeckHover = (deckName: string) => {
    setHoveredDeck(deckName);
    const idx = topDecks.findIndex((d) => d.deckName.toLowerCase() === deckName.toLowerCase());
    if (idx !== -1) {
      setCarouselIndex(idx);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Informações de Amostragem */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass-card p-4 sm:p-5 rounded-2xl backdrop-blur-xl border border-white/[0.08]">
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

      {/* Card Unificado com Visualizador de Metagame em Barras e Carrossel 3D */}
      <div
        className="glass-card rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all border border-white/[0.05]"
        onMouseEnter={() => {
          if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }}
        onMouseLeave={() => {
          if (topDecks.length > 1) {
            autoPlayRef.current = setInterval(() => {
              setCarouselIndex((prev) => (prev + 1) % topDecks.length);
            }, 4500);
          }
        }}
      >
        {totalGames === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base font-semibold">Nenhum dado de metagame encontrado para esta etapa.</p>
            <p className="text-xs text-slate-500 mt-1">Os decks jogados nesta etapa ainda não foram catalogados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Lado Esquerdo: Carrossel 3D & Deck em Destaque */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative">
              {displayedDeck && (
                <div className="w-full flex flex-col items-center text-center">
                  {/* Badge de Posição / Tier */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900/90 border border-white/20 text-white shadow-md flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full animate-pulse"
                        style={{ backgroundColor: primaryEnergyColor }}
                      />
                      {activeHoverDeckInfo
                        ? `Foco: ${activeHoverDeckInfo.deckName}`
                        : `Top #${carouselIndex + 1} Metagame`}
                    </span>
                    <EnergyBadge energyRaw={displayedDeck.tipoEnergia} />
                  </div>

                  {/* Carta 3D com Efeito Holográfico e Glow */}
                  <div className="relative group/card my-2">
                    <div
                      className="absolute -inset-2 rounded-2xl blur-xl opacity-40 group-hover/card:opacity-70 transition duration-500"
                      style={{
                        background: `radial-gradient(circle, ${primaryEnergyColor} 0%, transparent 70%)`,
                      }}
                    />

                    <div className="relative w-48 sm:w-56 aspect-[5/7] rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-950 transition-transform duration-300 group-hover/card:scale-105 flex items-center justify-center">
                      {displayedDeck.imagem ? (
                        <img
                          src={displayedDeck.imagem}
                          alt={displayedDeck.deckName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-slate-500">
                          <span className="text-4xl mb-2">⚡</span>
                          <span className="text-xs font-bold text-center text-slate-400">
                            {displayedDeck.deckName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nome do Deck e Participação */}
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight">
                    {displayedDeck.deckName}
                  </h3>

                  <div className="flex items-center gap-3 mt-1 text-sm font-bold">
                    <span style={{ color: primaryEnergyColor }} className="text-lg">
                      {displayedDeck.percent.toFixed(1)}% do Meta
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      {displayedDeck.count} {displayedDeck.count === 1 ? "partida" : "partidas"}
                    </span>
                  </div>

                  {/* Link Limitless TCG se disponível */}
                  {displayedDeck.limitless && (
                    <a
                      href={displayedDeck.limitless}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg"
                    >
                      <span>Ver Listas no Limitless TCG</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {/* Controles de Navegação do Carrossel Top 5 */}
                  {topDecks.length > 1 && (
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={handlePrevSlide}
                        className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md"
                        aria-label="Deck anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {topDecks.map((_, idx) => (
                          <button
                            key={`dot-${idx}`}
                            onClick={() => {
                              if (autoPlayRef.current) clearInterval(autoPlayRef.current);
                              setCarouselIndex(idx);
                              setHoveredDeck(null);
                            }}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              idx === carouselIndex && !activeHoverDeckInfo
                                ? "w-6 bg-white shadow-sm"
                                : "w-2 bg-slate-700 hover:bg-slate-500"
                            }`}
                            aria-label={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleNextSlide}
                        className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer shadow-md"
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

              <p className="text-[11px] text-slate-400 font-normal text-center mt-3">
                💡 Passe o mouse ou clique sobre qualquer deck da lista para visualizar sua carta e estatísticas detalhadas no painel lateral.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
