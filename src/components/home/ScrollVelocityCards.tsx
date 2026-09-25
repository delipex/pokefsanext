"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame, ArrowRight, X, ExternalLink, Trophy, Swords, Zap } from "lucide-react";
import { EnergyBadge } from "@/components/ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

export interface DeckCardItem {
  nome: string;
  tipoEnergia: string;
  imagem?: string | null;
  limitless?: string | null;
  icone?: string | null;
  count?: number;
  vitorias?: number;
  empates?: number;
  derrotas?: number;
  totalPartidas?: number;
  winRate?: number;
  titulos?: number;
  podios?: number;
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
const ROTATIONS = [-4, 3, -2, 5, -3, 3, -5, 4, -2, 3, -4, 4, -3, 2, -4];
const Y_OFFSETS = [-8, 10, -4, 12, -6, 8, -10, 8, -4, 10, -6, 8, -5, 9, -7];
const SCALES = [1.01, 0.98, 1.02, 0.98, 1.01, 0.97, 1.02, 0.98, 1.01, 0.98, 1.02, 0.98, 1.01, 0.97, 1.0];
const Z_INDICES = [10, 25, 15, 30, 20, 35, 12, 28, 18, 32, 14, 26, 16, 29, 22];

function GpuMarqueeCards({
  decks,
  baseVelocity = -28,
  onSelectDeck,
  isPausedExternal = false,
}: {
  decks: DeckCardItem[];
  baseVelocity?: number;
  onSelectDeck: (deck: DeckCardItem) => void;
  isPausedExternal?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  // 1. Limita rigorosamente aos 15 decks passados como prop
  const topDecks = useMemo(() => {
    if (decks.length === 0) return [];
    let list = decks.slice(0, 15);
    // Garante no mínimo 6 itens no conjunto base para telas ultrawide
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

  // Duração da animação calculada com base na quantidade de cartas
  const durationSeconds = Math.max(30, Math.min(75, Math.round(topDecks.length * 4.0)));
  const isPaused = !isVisible || isTouching || isPausedExternal;

  return (
    <div
      ref={containerRef}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
      onTouchCancel={() => setIsTouching(false)}
      className="marquee-container relative w-full overflow-hidden select-none py-6 sm:py-10 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]"
    >
      <div
        className={`animate-marquee-gpu ${isPaused ? "paused" : ""}`}
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
                  className="relative aspect-[63/88] w-[148px] sm:w-[185px] md:w-[215px] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-xl transition-all duration-200 group cursor-pointer"
                  onClick={() => onSelectDeck(deck)}
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

                  {/* Badge Superior Esquerdo: Posição no Top 15 & Taxa de Vitória */}
                  <div className="absolute top-2 left-2 z-20">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/90 border border-emerald-500/50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-emerald-400 shadow-lg backdrop-blur-md">
                      #{deck.origIdx + 1} • {deck.winRate ?? 0}% WR
                    </span>
                  </div>

                  {/* Badge Superior Direito: Energia do Deck */}
                  <div className="absolute top-2 right-2 z-20">
                    <div className="flex items-center -space-x-1 p-1 rounded-full bg-black/80 border border-white/20 shadow-sm">
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

                  {/* Botão de Ação ao Hover (Desktop) */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-150 pointer-events-none ${
                      isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 border border-blue-400 px-3 py-1.5 text-[11px] font-black text-white shadow-2xl whitespace-nowrap">
                      <span>Inspecionar Deck</span>
                      <Zap className="h-3 w-3" />
                    </span>
                  </div>

                  {/* Faixa Inferior com Nome do Deck e Métricas Oficiais */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/98 via-slate-950/85 to-transparent p-2.5 pt-7 flex flex-col justify-end z-20">
                    <span className="text-xs sm:text-sm font-black text-white truncate drop-shadow-sm">
                      {deck.nome}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium mt-0.5">
                      <span>{deck.count || 0} aparições</span>
                      {deck.vitorias !== undefined && (
                        <span className="font-bold text-emerald-400">
                          {deck.vitorias}V-{deck.derrotas}D
                        </span>
                      )}
                    </div>
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
  const [selectedDeckForModal, setSelectedDeckForModal] = useState<DeckCardItem | null>(null);

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

      {/* 1. Topo Informativo da Caixa com Indicadores Responsivos */}
      <div className="flex items-center justify-between px-1 relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Top 15 Decks com Maior Winrate
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-400 font-medium">
          <span className="hidden sm:inline">⚡ Passe o mouse para pausar • Clique para inspecionar</span>
          <span className="sm:hidden inline">⚡ Toque na carta para ver estatísticas e lista</span>
        </div>
      </div>

      {/* 2. Esteira GPU Ultraleve com Toque Interativo para Mobile */}
      <div className="relative w-full overflow-hidden z-10">
        <GpuMarqueeCards
          decks={validDecks}
          baseVelocity={baseVelocity}
          onSelectDeck={setSelectedDeckForModal}
          isPausedExternal={Boolean(selectedDeckForModal)}
        />
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
                  Líder em Aparições
                </span>
                <EnergyBadge energyRaw={metaStats.topDeck.tipoEnergia} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-black text-white truncate">
                  {metaStats.topDeck.nome}
                </span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">
                  {metaStats.topDeck.percentage.toFixed(1)}% do meta
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
        <Link
          href="/metagame"
          className="md:col-span-4 flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-500/30 transition-all group cursor-pointer"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Estatísticas
            </span>
            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
              Ver Metagame Completo
            </span>
          </div>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] group-hover:bg-amber-500/20 border border-white/10 group-hover:border-amber-500/40 text-slate-300 group-hover:text-amber-400 transition-all">
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL / BOTTOM SHEET DE INSPEÇÃO DO DECK (INTERAÇÃO PREMIUM MOBILE/PC) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedDeckForModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop com Blur Profundo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeckForModal(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-xl"
            />

            {/* Modal Box: Bottom Sheet no Celular e Bento Card Horizontal no Desktop (Nunca Corta no PC) */}
            <motion.div
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="relative w-full sm:max-w-2xl md:max-w-3xl bg-slate-950/95 border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-slate-100 z-10 max-h-[88vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iOS Handle Indicator (Apenas Celular) */}
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-3 sm:hidden" />

              {/* Botão Fechar no Canto Superior Direito */}
              <button
                type="button"
                onClick={() => setSelectedDeckForModal(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-20"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Grid Responsivo: Coluna Única no Celular / 2 Colunas Lado a Lado no PC */}
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-7">
                {/* Lado Esquerdo: Arte da Carta com Proporções Clássicas de TCG */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  {selectedDeckForModal.imagem ? (
                    <div className="relative aspect-[63/88] w-[130px] sm:w-[185px] md:w-[210px] rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
                      <img
                        src={selectedDeckForModal.imagem}
                        alt={selectedDeckForModal.nome}
                        className="w-full h-full object-cover select-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent mix-blend-overlay pointer-events-none" />
                    </div>
                  ) : (
                    <div className="aspect-[63/88] w-[130px] sm:w-[185px] md:w-[210px] rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/15 shadow-2xl flex flex-col items-center justify-center text-center p-4">
                      <span className="text-3xl mb-2">⚡</span>
                      <span className="text-xs font-bold text-white">{selectedDeckForModal.nome}</span>
                    </div>
                  )}
                </div>

                {/* Lado Direito: Informações Oficiais, Estatísticas e Ações */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4 w-full pr-0 sm:pr-6">
                  {/* Cabeçalho do Deck com Badge de Posição no Top 15 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        🔥 #{validDecks.findIndex((d) => d.nome.toLowerCase() === selectedDeckForModal.nome.toLowerCase()) + 1} no Ranking de Winrate
                      </span>
                      <EnergyBadge energyRaw={selectedDeckForModal.tipoEnergia} size="sm" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight break-words">
                      {selectedDeckForModal.nome}
                    </h3>
                  </div>

                  {/* Grid de Estatísticas Chave de Rendimento */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                        Taxa de Vitória
                      </span>
                      <span className="text-2xl font-black text-emerald-400 tabular-nums">
                        {selectedDeckForModal.winRate !== undefined ? `${selectedDeckForModal.winRate}%` : "—"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Aproveitamento</span>
                    </div>

                    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        Recorde Oficial
                      </span>
                      <div className="text-2xl font-black text-white tabular-nums">
                        <span className="text-emerald-400">{selectedDeckForModal.vitorias ?? 0}V</span>
                        <span className="text-slate-500 font-normal"> - </span>
                        <span className="text-rose-400">{selectedDeckForModal.derrotas ?? 0}D</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                        {selectedDeckForModal.empates ? `${selectedDeckForModal.empates}E • ` : ""}
                        {selectedDeckForModal.totalPartidas ?? 0} partidas
                      </span>
                    </div>
                  </div>

                  {/* Pódios e Títulos se houver */}
                  {(Number(selectedDeckForModal.podios) > 0 || Number(selectedDeckForModal.titulos) > 0) && (
                    <div className="flex items-center justify-around p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-bold">
                      {Number(selectedDeckForModal.titulos) > 0 && (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                          {selectedDeckForModal.titulos}x Campeão
                        </span>
                      )}
                      {Number(selectedDeckForModal.podios) > 0 && (
                        <span className="flex items-center gap-1">
                          <Swords className="h-3.5 w-3.5 text-amber-400" />
                          {selectedDeckForModal.podios}x Top 4
                        </span>
                      )}
                    </div>
                  )}

                  {/* Botões de Ação para Celular e Desktop */}
                  <div className="space-y-2 pt-1">
                    {selectedDeckForModal.limitless && (
                      <a
                        href={selectedDeckForModal.limitless}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        <span>Ver Lista de 60 Cartas (Limitless)</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/metagame"
                        onClick={() => setSelectedDeckForModal(null)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 hover:text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        <Flame className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Metagame</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedDeckForModal(null)}
                        className="py-2.5 px-3 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
