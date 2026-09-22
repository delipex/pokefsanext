"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flame, ArrowRight, Sparkles, PieChart, Layers, Swords } from "lucide-react";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface MetagameBannerProps {
  metagameEntries: Array<{
    etapaId?: number;
    jogadorId?: string;
    jogadorNome?: string;
    deckNome?: string;
    colocacao?: number;
  }>;
  decksInfo: Array<{
    id: number;
    nome: string;
    tipoEnergia?: string | null;
    icone?: string | null;
    imagem?: string | null;
    limitless?: string | null;
    ativo?: boolean;
  }>;
}

export function MetagameBanner({ metagameEntries = [], decksInfo = [] }: MetagameBannerProps) {
  const stats = useMemo(() => {
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
          imagem: info?.imagem || null,
          limitless: info?.limitless || null,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalPlays: totalValid,
      archetypesCount: sorted.length,
      topDeck: sorted[0] || null,
      topContenders: sorted.slice(1, 5),
    };
  }, [metagameEntries, decksInfo]);

  if (!stats.topDeck) return null;

  const dominantEnergy = getMultiEnergyConfig(stats.topDeck.tipoEnergia);

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/90 via-[#0b1329]/95 to-slate-950/90 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl">
      {/* Brilho decorativo no canto */}
      <div
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: dominantEnergy.types[0]?.hex || "#3b82f6" }}
      />

      {/* Header do Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm">
            <Flame className="h-5 w-5 fill-orange-400/80" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              Radar do Metagame da Temporada
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              {stats.archetypesCount} arquétipos mapeados • {stats.totalPlays} partidas registradas
            </p>
          </div>
        </div>

        <Link
          href="/metagame"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm group"
        >
          <span>Explorar Metagame Completo</span>
          <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Conteúdo Panorâmico: Card Dominante + Grid de Desafiantes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Lado Esquerdo: Destaque do Deck Dominante (5 Colunas) */}
        <div className="lg:col-span-5 relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-slate-950/70 p-5 backdrop-blur-xl shadow-lg overflow-hidden group hover:border-white/20 transition-all">
          {/* Tag de Líder do Meta */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-400" /> Deck Dominante
            </span>
            <div className="flex items-center -space-x-1">
              {dominantEnergy.types.map((t, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full border border-black/60 shadow-sm"
                  style={{ backgroundColor: t.hex, boxShadow: `0 0 6px ${t.hex}` }}
                  title={t.label}
                />
              ))}
            </div>
          </div>

          {/* Nome e Porcentagem */}
          <div className="my-4 space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
              {stats.topDeck.nome}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                {stats.topDeck.percentage.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-medium">
                de presença ({stats.topDeck.count} aparições)
              </span>
            </div>
          </div>

          {/* Barra de Força / Presença */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Share da Liga</span>
              <span className="tabular-nums font-semibold text-slate-200">
                1º Lugar no Meta
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(15, stats.topDeck.percentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Top 4 Arquétipos Desafiantes (7 Colunas) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.topContenders.map((deck, idx) => {
            const energy = getMultiEnergyConfig(deck.tipoEnergia);
            const rank = idx + 2;

            return (
              <div
                key={deck.nome}
                className="relative flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-slate-950/50 p-3.5 sm:p-4 backdrop-blur-xl hover:border-white/15 hover:bg-slate-950/70 transition-all group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-300 tabular-nums">
                      {rank}º
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {deck.nome}
                    </h4>
                  </div>
                  <div className="flex items-center -space-x-1 shrink-0">
                    {energy.types.map((t, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full border border-black/60 shadow-sm"
                        style={{ backgroundColor: t.hex }}
                        title={t.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 mt-auto">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="tabular-nums font-medium">
                      {deck.count} aparições
                    </span>
                    <span className="tabular-nums font-bold text-slate-200">
                      {deck.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(8, deck.percentage))}%`,
                        backgroundColor: energy.types[0]?.hex || "#94a3b8",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
