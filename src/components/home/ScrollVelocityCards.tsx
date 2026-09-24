"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Flame, ArrowRight } from "lucide-react";
import { EnergyBadge } from "@/components/ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface DeckCardItem {
  nome: string;
  tipoEnergia: string;
  imagem?: string | null;
  limitless?: string | null;
  count?: number;
}

interface ScrollVelocityCardsProps {
  decks: DeckCardItem[];
  metagameEntries?: Array<{
    etapaData?: string;
    jogadorNome?: string;
    deckNome?: string;
  }>;
  decksInfo?: Array<{
    id: number;
    nome: string;
    tipoEnergia: string;
    imagem: string | null;
    limitless: string | null;
    icone: string | null;
  }>;
  baseVelocity?: number;
}

// Parâmetros estáticos pré-computados de rotação, altura e escala para visual de cartas colecionáveis
const ROTATIONS = [-4, 3, -2, 5, -3, 3, -5, 4, -2, 3, -4, 4];
const Y_OFFSETS = [-8, 10, -4, 12, -6, 8, -10, 8, -4, 10, -6, 8];
const SCALES = [1.01, 0.98, 1.02, 0.98, 1.01, 0.97, 1.02, 0.98];
const Z_INDICES = [10, 25, 15, 30, 20, 35, 12, 28];

function GpuMarqueeCards({
  decks,
  baseVelocity = -28,
}: {
  decks: DeckCardItem[];
  baseVelocity?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // 1. Limita aos Top 10-12 decks com maior relevância para eliminar overhead no DOM
  const topDecks = useMemo(() => {
    if (decks.length === 0) return [];
    let list = decks.slice(0, 12);
    // Garante no mínimo 6 itens no conjunto base para preencher telas ultrawide
    if (list.length < 6) {
      list = [...list, ...list];
    }
    return list;
  }, [decks]);

  // 2. Duplicação exata (2 conjuntos: A e B) para loop contínuo infinito de 0% a -50%
  const loopCards = useMemo(() => {
    return [
      ...topDecks.map((d, i) => ({ ...d, setIdx: 0, origIdx: i })),
      ...topDecks.map((d, i) => ({ ...d, setIdx: 1, origIdx: i })),
    ];
  }, [topDecks]);

  // 3. Pausa inteligente de processamento quando o componente sair do campo de visão (Scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "150px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Duração da animação calculada com base na quantidade de cartas e velocidade
  const durationSeconds = Math.max(25, Math.min(65, Math.round(topDecks.length * 3.6)));

  return (
    <div
      ref={containerRef}
      className="marquee-container relative w-full overflow-hidden select-none py-6 sm:py-10 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div
        className={`animate-marquee-gpu ${!isVisible ? "paused" : ""}`}
        style={
          {
            "--marquee-duration": `${durationSeconds}s`,
          } as React.CSSProperties
        }
      >
        <div className="flex -space-x-3 sm:-space-x-4 shrink-0 items-center">
          {loopCards.map((deck) => {
            const cardKey = `${deck.nome}-s${deck.setIdx}-i${deck.origIdx}`;
            const energy = getMultiEnergyConfig(deck.tipoEnergia);
            const rot = ROTATIONS[deck.origIdx % ROTATIONS.length];
            const yOff = Y_OFFSETS[deck.origIdx % Y_OFFSETS.length];
            const scl = SCALES[deck.origIdx % SCALES.length];
            const zIdx = Z_INDICES[deck.origIdx % Z_INDICES.length];
            const isHovered = hoveredKey === cardKey;

            return (
              <div
                key={cardKey}
                onMouseEnter={() => setHoveredKey(cardKey)}
                onMouseLeave={() => setHoveredKey(null)}
                className="shrink-0 transition-transform duration-200 ease-out will-change-transform"
                style={{
                  zIndex: isHovered ? 50 : zIdx,
                  transform: isHovered
                    ? `translate3d(0, ${yOff - 14}px, 0) scale(1.06) rotate(0deg)`
                    : `translate3d(0, ${yOff}px, 0) scale(${scl}) rotate(${rot}deg)`,
                }}
              >
                {/* Card Pokémon Físico com Aspect Ratio Oficial 63:88 */}
                <div
                  className="relative aspect-[63/88] w-[150px] sm:w-[185px] md:w-[215px] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-xl transition-all duration-200 group cursor-pointer"
                  onClick={() => {
                    if (deck.limitless) {
                      window.open(deck.limitless, "_blank", "noopener,noreferrer");
                    } else {
                      window.location.href = "/metagame";
                    }
                  }}
                >
                  {/* Imagem da Carta Otimizada */}
                  {deck.imagem ? (
                    <img
                      src={deck.imagem}
                      alt={deck.nome}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center select-none filter brightness-95 group-hover:brightness-105 transition-all duration-200 pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center select-none">
                      <span className="text-3xl mb-2">⚡</span>
                      <span className="font-bold text-white text-xs leading-tight">
                        {deck.nome}
                      </span>
                    </div>
                  )}

                  {/* Efeito Foil Holográfico Sutil */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-200 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent mix-blend-overlay ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  {/* Badge Flutuante de Energia */}
                  <div className="absolute top-2 right-2 z-20">
                    <div className="flex items-center -space-x-1 p-1 rounded-full bg-black/75 border border-white/15 shadow-sm">
                      {energy.types.map((t, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border border-black/50 shadow-sm"
                          style={{ background: t.bgGradient || t.hex, boxShadow: `0 0 3px ${t.glow || t.hex}` }}
                          title={t.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Botão de Ação ao Hover */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-150 pointer-events-none ${
                      isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/95 border border-blue-400/40 px-2.5 py-1 text-[10px] font-bold text-white shadow-xl whitespace-nowrap">
                      {deck.limitless ? "Ver Lista ↗" : "Ver Metagame →"}
                    </span>
                  </div>

                  {/* Faixa Inferior com Nome do Deck */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-2.5 pt-6 flex flex-col justify-end z-20">
                    <span className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm">
                      {deck.nome}
                    </span>
                    {deck.count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {deck.count} aparições na temporada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ScrollVelocityCards({
  decks = [],
  metagameEntries = [],
  decksInfo = [],
  baseVelocity = -28,
}: ScrollVelocityCardsProps) {
  // Cálculo integrado das estatísticas do Metagame para o rodapé da esteira
  const metaStats = useMemo(() => {
    const deckCounts: Record<string, number> = {};
    let totalValid = 0;

    metagameEntries.forEach((entry) => {
      const name = entry.deckNome?.trim();
      if (!name || name.toLowerCase() === "outros" || name.toLowerCase() === "sem deck registrado") {
        return;
      }
      deckCounts[name] = (deckCounts[name] || 0) + 1;
      totalValid++;
    });

    const sorted = Object.entries(deckCounts)
      .map(([nome, count]) => {
        const info = decksInfo.find((d) => d.nome.toLowerCase() === nome.toLowerCase());
        const percentage = totalValid > 0 ? (count / totalValid) * 100 : 0;
        return {
          nome,
          count,
          percentage,
          tipoEnergia: info?.tipoEnergia || "colorless",
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalPlays: totalValid,
      archetypesCount: sorted.length,
      topDeck: sorted[0] || null,
      topContenders: sorted.slice(1, 4),
    };
  }, [metagameEntries, decksInfo]);

  // Filtra apenas decks válidos com cartas reais
  const validDecks = decks.filter(
    (d) =>
      d.nome &&
      d.nome.toLowerCase() !== "outros" &&
      d.nome.toLowerCase() !== "sem deck registrado"
  );

  if (validDecks.length < 3) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/[0.04] bg-white/[0.015] p-4 sm:p-7 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Luz ambiente suave de fundo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* 1. Topo Informativo da Caixa */}
      <div className="flex items-center justify-between px-1 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Decks em Destaque na Temporada
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400 font-normal hidden sm:inline">
          ⚡ Passe o mouse para pausar e inspecionar
        </span>
      </div>

      {/* 2. Esteira GPU Ultraleve com Loop Infinito Contínuo */}
      <div className="relative w-full overflow-hidden z-10">
        <GpuMarqueeCards decks={validDecks} baseVelocity={baseVelocity} />
      </div>

      {/* 3. Rodapé Bento Integrado com Telemetria do Metagame */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-3 border-t border-white/[0.05] items-center relative z-10">
        {/* Bloco 1: Deck Dominante (5 Colunas) */}
        {metaStats.topDeck && (
          <div className="md:col-span-5 flex items-center gap-3 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.02]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Flame className="h-4 w-4 fill-amber-400/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Líder do Metagame
                </span>
                <EnergyBadge energyRaw={metaStats.topDeck.tipoEnergia} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-black text-white truncate">
                  {metaStats.topDeck.nome}
                </span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">
                  {metaStats.topDeck.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bloco 2: Telemetria de Partidas e Decks (3 Colunas) */}
        <div className="md:col-span-3 flex items-center justify-around sm:justify-start gap-4 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.02]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Arquétipos
            </span>
            <span className="text-sm sm:text-base font-black text-white tabular-nums">
              {metaStats.archetypesCount} Decks
            </span>
          </div>
          <div className="h-6 w-[1px] bg-white/[0.08]" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Registros
            </span>
            <span className="text-sm sm:text-base font-black text-slate-200 tabular-nums">
              {metaStats.totalPlays} Jogos
            </span>
          </div>
        </div>

        {/* Bloco 3: Link de Ação para o Metagame Completo (4 Colunas) */}
        <div className="md:col-span-4 flex items-center justify-between sm:justify-end gap-3 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 min-w-0">
            {metaStats.topContenders.map((contender, i) => (
              <span
                key={i}
                className="hidden sm:inline-block text-[11px] font-medium text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.06] truncate max-w-[90px]"
                title={contender.nome}
              >
                {contender.nome}
              </span>
            ))}
          </div>

          <Link
            href="/metagame"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all shadow-sm shrink-0 group cursor-pointer"
          >
            <span>Ver Metagame</span>
            <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
