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
} from "framer-motion";
import { Sparkles, ExternalLink, Flame, ArrowRight, Layers, Swords } from "lucide-react";
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

// Utilitário de repetição matemática contínua sem saltos
function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

function ParallaxRow({
  decks,
  baseVelocity = 0.5,
  direction = 1,
}: {
  decks: DeckCardItem[];
  baseVelocity?: number;
  direction?: 1 | -1;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 300,
  });

  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3], {
    clamp: false,
  });

  const [isHovered, setIsHovered] = useState(false);
  const directionFactor = useRef<number>(direction);

  useAnimationFrame((t, delta) => {
    if (isHovered) {
      // Quando o mouse está sobre a esteira, desacelera ainda mais para contemplação
      const moveBy = directionFactor.current * (baseVelocity * 0.2) * (delta / 1000);
      baseX.set(baseX.get() + moveBy);
      return;
    }

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Reage suavemente à rolagem da página
    const currentVelocity = velocityFactor.get();
    if (currentVelocity < 0) {
      directionFactor.current = -1 * direction;
    } else if (currentVelocity > 0) {
      directionFactor.current = 1 * direction;
    }

    moveBy += directionFactor.current * moveBy * Math.abs(currentVelocity);
    baseX.set(baseX.get() + moveBy);
  });

  // Repetição contínua entre -50% e 0%
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  // Duplica a lista de decks para garantir looping fluido e ininterrupto
  const repeatedDecks = [...decks, ...decks, ...decks, ...decks];

  return (
    <div
      className="flex overflow-visible select-none py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div className="flex gap-4 sm:gap-6 shrink-0" style={{ x }}>
        {repeatedDecks.map((deck, idx) => {
          const energy = getMultiEnergyConfig(deck.tipoEnergia);

          return (
            <div
              key={`${deck.nome}-${idx}`}
              className="group relative w-[160px] sm:w-[195px] md:w-[220px] shrink-0 transition-all duration-500 hover:scale-105 hover:z-30 cursor-pointer"
            >
              {/* Card Pokémon com Proporção Oficial 63:88 */}
              <div
                className="relative aspect-[63/88] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-950/80 backdrop-blur-md shadow-2xl group-hover:border-white/30 transition-all duration-300"
                style={{
                  boxShadow: `0 12px 30px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
                }}
              >
                {/* Imagem da Carta */}
                {deck.imagem ? (
                  <img
                    src={deck.imagem}
                    alt={deck.nome}
                    className="w-full h-full object-cover object-center select-none filter brightness-95 group-hover:brightness-105 transition-all duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-3xl mb-2">⚡</span>
                    <span className="font-bold text-white text-xs leading-tight">
                      {deck.nome}
                    </span>
                  </div>
                )}

                {/* Efeito Foil Holográfico no Hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent mix-blend-overlay" />

                {/* Badge Flutuante de Energia */}
                <div className="absolute top-2.5 right-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center -space-x-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-md">
                    {energy.types.map((t, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full border border-black/50 shadow-sm"
                        style={{ backgroundColor: t.hex }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Faixa Inferior com Nome do Deck */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-3 pt-8 flex flex-col justify-end">
                  <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors drop-shadow-md">
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
      </motion.div>
    </div>
  );
}

export function ScrollVelocityCards({
  decks = [],
  metagameEntries = [],
  decksInfo = [],
  baseVelocity = 0.5,
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
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/[0.04] bg-white/[0.015] p-5 sm:p-7 backdrop-blur-2xl shadow-2xl space-y-6">
      {/* Luz ambiente de fundo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Topo Sutil da Esteira */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            Arquétipos em Destaque no Formato
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400 font-normal hidden sm:inline">
          ⚡ Role a página para acelerar a esteira
        </span>
      </div>

      {/* Esteira Conceitual Inclinada (-rotate-1 / -rotate-2) e Lenta */}
      <div className="relative w-full py-2 sm:py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="transform -rotate-1 sm:-rotate-2 scale-[1.02] sm:scale-[1.03] transition-transform duration-700">
          <ParallaxRow decks={validDecks} baseVelocity={baseVelocity} direction={1} />
        </div>
      </div>

      {/* Rodapé Bento Integrado com as Informações do Metagame */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-3 border-t border-white/[0.05] items-center">
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
