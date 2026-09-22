import { getRanking, getTop4Podium, getMetagameData, getEtapasWithSummary, getConfigMap, getNextEvent, getSeasonAwards } from "@/lib/queries";
import { PodiumSection } from "@/components/ranking/PodiumSection";
import { MetagameDashboard } from "@/components/metagame/MetagameDashboard";
import { NextEventCard } from "@/components/home/NextEventCard";
import { SeasonAwardsSection } from "@/components/ranking/SeasonAwardsSection";
import { Flame, ShieldCheck, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerModalData } from "@/components/ranking/PlayerModal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rankingRaw, top4Raw, metaData, etapas, config, nextEvent, awards] = await Promise.all([
    getRanking(),
    getTop4Podium(),
    getMetagameData(),
    getEtapasWithSummary(),
    getConfigMap(),
    getNextEvent(),
    getSeasonAwards(),
  ]);

  const top4: PlayerModalData[] = top4Raw.map((r) => ({
    jogadorNome: r.jogadorNome,
    jogadorId: r.jogadorId,
    categoria: r.categoria,
    pontos: r.pontos,
    vitorias: r.vitorias,
    empates: r.empates,
    derrotas: r.derrotas,
    podios: r.podios,
    mediaColocacao: r.mediaColocacao,
    participacoes: r.participacoes,
    historicoColocacoes: r.historicoColocacoes || "",
  }));

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section Limpo e Elegante */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-950/80 p-6 sm:p-10 backdrop-blur-2xl shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            Circuito Oficial Pokémon TCG • Feira de Santana
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Liga Atlântica <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Temporada {config.temporadaAtual || 5}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Acompanhe a classificação dos competidores, as premiações da temporada, o metagame dos torneios e as datas dos próximos confrontos oficiais.
          </p>
        </div>
      </section>

      {/* 1. Card de Próximo Evento Conectado ao Calendário */}
      <NextEventCard event={nextEvent} />

      {/* 2. Top 4 Podium */}
      <PodiumSection top4={top4} />

      {/* 3. Premiações Projetadas da Temporada */}
      <SeasonAwardsSection awards={awards} />

      {/* 4. Metagame Atual (Donut + Carrossel 3D) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="h-4 w-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Metagame Atual
            </h2>
          </div>
          <Link
            href="/metagame"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver Detalhes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <MetagameDashboard
          metagameEntries={metaData.metagameEntries}
          decksInfo={metaData.decksInfo}
        />
      </section>
    </div>
  );
}
