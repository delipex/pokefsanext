"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from "framer-motion";
import { Sparkles, ExternalLink, Flame } from "lucide-react";
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
  baseVelocity?: number;
}

// Utilitário de repetição matemática infinita sem saltos
function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

function ParallaxRow({
  decks,
  baseVelocity = 1.2,
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

  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], {
    clamp: false,
  });

  const [isHovered, setIsHovered] = useState(false);
  const directionFactor = useRef<number>(direction);

  useAnimationFrame((t, delta) => {
    if (isHovered) {
      // Quando o mouse está sobre a esteira, desacelera suavemente para permitir visualização
      const moveBy = directionFactor.current * (baseVelocity * 0.25) * (delta / 1000);
      baseX.set(baseX.get() + moveBy);
      return;
    }

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    // Reage à aceleração da rolagem da página
    const currentVelocity = velocityFactor.get();
    if (currentVelocity < 0) {
      directionFactor.current = -1 * direction;
    } else if (currentVelocity > 0) {
      directionFactor.current = 1 * direction;
    }

    moveBy += directionFactor.current * moveBy * Math.abs(currentVelocity);
    baseX.set(baseX.get() + moveBy);
  });

  // Repetição infinita entre -50% e 0%
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  // Duplica a lista de decks para criar o looping contínuo sem cortes
  const repeatedDecks = [...decks, ...decks, ...decks, ...decks];

  return (
    <div
      className="flex overflow-hidden select-none py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div className="flex gap-4 sm:gap-6 shrink-0" style={{ x }}>
        {repeatedDecks.map((deck, idx) => {
          const energy = getMultiEnergyConfig(deck.tipoEnergia);
          const primaryHex = energy.types[0]?.hex || "#3b82f6";

          return (
            <div
              key={`${deck.nome}-${idx}`}
              className="group relative w-[160px] sm:w-[190px] md:w-[210px] shrink-0 transition-all duration-300 hover:scale-105 hover:z-20 cursor-pointer"
            >
              {/* Card Container com Proporção Oficial Pokémon 63:88 */}
              <div
                className="relative aspect-[63/88] w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-950/80 backdrop-blur-md shadow-xl group-hover:border-white/30 transition-all duration-300"
                style={{
                  boxShadow: `0 8px 24px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
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
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent mix-blend-overlay"
                />

                {/* Badge Flutuante de Energia no Topo */}
                <div className="absolute top-2 right-2 opacity-90 group-hover:opacity-100 transition-opacity">
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
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-2.5 pt-6 flex flex-col justify-end">
                  <span className="text-[11px] sm:text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors drop-shadow-md">
                    {deck.nome}
                  </span>
                  {deck.count !== undefined && (
                    <span className="text-[9px] text-slate-400 font-medium">
                      {deck.count} aparições na liga
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
  baseVelocity = 1.2,
}: ScrollVelocityCardsProps) {
  if (!decks || decks.length === 0) return null;

  // Filtra apenas decks válidos com imagens prioritárias
  const validDecks = decks.filter(
    (d) =>
      d.nome &&
      d.nome.toLowerCase() !== "outros" &&
      d.nome.toLowerCase() !== "sem deck registrado"
  );

  if (validDecks.length < 3) return null;

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/[0.04] bg-white/[0.015] py-5 sm:py-7 backdrop-blur-2xl shadow-xl">
      {/* Luz ambiente de fundo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header Sutil da Esteira */}
      <div className="flex items-center justify-between px-5 sm:px-7 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
            Arquétipos em Destaque no Formato
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400 font-normal">
          ⚡ Deslize a página para acelerar
        </span>
      </div>

      {/* Esteira com Scroll Velocity Parallax */}
      <div className="relative w-full overflow-hidden mask-fade-edges">
        <ParallaxRow decks={validDecks} baseVelocity={baseVelocity} direction={1} />
      </div>
    </section>
  );
}
