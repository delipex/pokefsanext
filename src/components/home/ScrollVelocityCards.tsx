"use client";

import { useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
  wrap,
} from "framer-motion";
import { Sparkles, Flame, ArrowRight, Layers, Swords } from "lucide-react";
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

// Parâmetros estéticos de cartas soltas em 3D (Motion.dev Linked Offset)
const ROTATIONS = [-6, 5, -3, 7, -5, 4, -7, 6, -4, 5, -2, 6];
const Y_OFFSETS = [-20, 24, -12, 28, -18, 16, -24, 20, -10, 22, -16, 18];
const SCALES = [1.03, 0.96, 1.05, 0.97, 1.02, 0.95, 1.04, 0.98];
const Z_INDICES = [10, 25, 15, 30, 20, 35, 12, 28];

function FreeFloating3DPlanes({
  decks,
  baseVelocity = -2.5, // Velocidade contínua lenta e perceptível (% por segundo)
}: {
  decks: DeckCardItem[];
  baseVelocity?: number;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Física de mola suave e amortecida
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 300,
  });

  // Fator de velocidade reativo ao scroll da página
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 1.5], {
    clamp: false,
  });

  // 3D Wave Tilt & Skew vinculados à inércia do scroll
  const velocityTilt = useTransform(smoothVelocity, [-1500, 1500], [-10, 10]);
  const velocitySkew = useTransform(smoothVelocity, [-1500, 1500], [-5, 5]);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const directionFactor = useRef<number>(1);

  useAnimationFrame((t, delta) => {
    if (hoveredIdx !== null || isDragging) {
      // Quando o cursor está sobre uma carta ou arrastando, desacelera 95% para contemplação
      const moveBy = baseVelocity * 0.05 * (delta / 1000);
      baseX.set(baseX.get() + moveBy);
      return;
    }

    // Movimento contínuo e autônomo constante (% por segundo)
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Reage fluidamente à rolagem da página
    const currentVelocity = velocityFactor.get();
    if (currentVelocity < 0) {
      directionFactor.current = -1;
    } else if (currentVelocity > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * Math.abs(currentVelocity);
    baseX.set(baseX.get() + moveBy);
  });

  // Looping contínuo seamless de 0% a -50% sem nenhum salto
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  // Duplicação de decks para garantir que Set B substitua Set A de forma idêntica
  const repeatedDecks = [...decks, ...decks, ...decks, ...decks];

  return (
    <div
      className="relative w-full overflow-visible select-none py-12 sm:py-16 cursor-grab active:cursor-grabbing"
      style={{ perspective: "1400px" }}
    >
      <motion.div
        className="flex -space-x-4 sm:-space-x-7 shrink-0 items-center"
        style={{
          x,
          rotateY: velocityTilt,
          skewX: velocitySkew,
          transformStyle: "preserve-3d",
        }}
        onPanStart={() => setIsDragging(true)}
        onPanEnd={() => setIsDragging(false)}
        onPan={(e, info) => {
          // Arrastar interativo com o mouse / touch
          baseX.set(baseX.get() + info.delta.x * 0.08);
        }}
      >
        {repeatedDecks.map((deck, idx) => {
          const energy = getMultiEnergyConfig(deck.tipoEnergia);
          const rot = ROTATIONS[idx % ROTATIONS.length];
          const yOff = Y_OFFSETS[idx % Y_OFFSETS.length];
          const scl = SCALES[idx % SCALES.length];
          const zIdx = Z_INDICES[idx % Z_INDICES.length];
          const isCurrentHovered = hoveredIdx === idx;

          return (
            <motion.div
              key={`${deck.nome}-${idx}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative shrink-0 transition-transform duration-500 ease-out"
              style={{
                zIndex: isCurrentHovered ? 60 : zIdx,
                transformStyle: "preserve-3d",
                transform: isCurrentHovered
                  ? `translateY(${yOff - 28}px) translateZ(90px) scale(1.14) rotate(0deg)`
                  : `translateY(${yOff}px) translateZ(0px) scale(${scl}) rotate(${rot}deg)`,
              }}
            >
              {/* Card Pokémon Físico Solto na Página */}
              <div
                className="relative aspect-[63/88] w-[175px] sm:w-[215px] md:w-[245px] rounded-2xl overflow-hidden border border-white/20 bg-slate-950 shadow-[0_25px_50px_rgba(0,0,0,0.9)] transition-all duration-300"
                style={{
                  boxShadow: isCurrentHovered
                    ? `0 35px 70px -10px rgba(0, 0, 0, 0.95), 0 0 35px rgba(59, 130, 246, 0.4)`
                    : `0 20px 45px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)`,
                }}
              >
                {/* Imagem da Carta */}
                {deck.imagem ? (
                  <img
                    src={deck.imagem}
                    alt={deck.nome}
                    className="w-full h-full object-cover object-center select-none filter brightness-95 hover:brightness-105 transition-all duration-300 pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center select-none">
                    <span className="text-4xl mb-2">⚡</span>
                    <span className="font-bold text-white text-xs leading-tight">
                      {deck.nome}
                    </span>
                  </div>
                )}

                {/* Efeito Foil Holográfico 3D */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 pointer-events-none bg-gradient-to-tr from-transparent via-white/25 to-transparent mix-blend-overlay ${
                    isCurrentHovered ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Badge Flutuante de Energia */}
                <div className="absolute top-2.5 right-2.5">
                  <div className="flex items-center -space-x-1 p-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-lg">
                    {energy.types.map((t, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full border border-black/60 shadow-sm"
                        style={{ backgroundColor: t.hex }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Faixa Inferior com Nome do Deck */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/85 to-transparent p-3 pt-8 flex flex-col justify-end">
                  <span className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-md">
                    {deck.nome}
                  </span>
                  {deck.count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {deck.count} aparições na temporada
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export function ScrollVelocityCards({
  decks = [],
  metagameEntries = [],
  decksInfo = [],
  baseVelocity = -2.5,
}: ScrollVelocityCardsProps) {
  // Cálculo das estatísticas do Metagame para a barra inferior
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
    <section className="relative w-full space-y-6">
      {/* 1. Header Sutil e Informativo da Galeria */}
      <div className="flex items-center justify-between px-1 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            Arquétipos em Destaque no Formato
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400 font-normal hidden sm:inline">
          ⚡ Arraste horizontalmente ou role a página para interagir
        </span>
      </div>

      {/* 2. Galeria Solta na Página (Extrapola e Flutua Livremente sem Caixa Enclausurante) */}
      <div className="relative w-full -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        {/* Marca d'água Tipográfica Editorial de Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center select-none pointer-events-none opacity-[0.035] overflow-hidden whitespace-nowrap z-0">
          <span className="text-7xl sm:text-9xl md:text-[11rem] font-black tracking-widest uppercase text-white font-mono">
            STANDARD FORMAT
          </span>
        </div>

        {/* Efeito 3D Planes de Cartas Soltas em Movimento Contínuo e Infinito */}
        <FreeFloating3DPlanes decks={validDecks} baseVelocity={baseVelocity} />
      </div>

      {/* 3. Barra Bento de Telemetria do Metagame (Cápsula Independente e Transparente) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-4 sm:p-5 rounded-3xl border border-white/[0.05] bg-slate-950/40 backdrop-blur-2xl shadow-xl items-center relative z-10">
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
