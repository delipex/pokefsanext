import { getRanking, getTop4Podium, getMetagameData, getEtapasWithSummary, getConfigMap, getNextEvent, getSeasonAwards } from "@/lib/queries";
import { HeroSeasonHub } from "@/components/home/HeroSeasonHub";
import { MetagameDashboard } from "@/components/metagame/MetagameDashboard";
import { SeasonAwardsSection } from "@/components/ranking/SeasonAwardsSection";
import { ArrowRight } from "lucide-react";
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

  // Top Deck calculation
  const deckCounts: Record<string, number> = {};
  metaData.metagameEntries.forEach((m) => {
    const d = m.deckNome?.trim();
    if (d && d.toLowerCase() !== "outros") {
      deckCounts[d] = (deckCounts[d] || 0) + 1;
    }
  });
  const totalMetaEntries = metaData.metagameEntries.length;
  let topDeckName = "";
  let topDeckMax = 0;
  for (const [d, count] of Object.entries(deckCounts)) {
    if (count > topDeckMax) {
      topDeckMax = count;
      topDeckName = d;
    }
  }
  const topDeck = topDeckName
    ? {
        nome: topDeckName,
        porcentagem: totalMetaEntries > 0 ? `${((topDeckMax / totalMetaEntries) * 100).toFixed(0)}%` : "0%",
      }
    : null;

  const lider = rankingRaw[0]
    ? {
        nome: rankingRaw[0].jogadorNome,
        pontos: rankingRaw[0].pontos,
      }
    : null;

  const top4: PlayerModalData[] = top4Raw.map((r) => {
    const deckInfo = metaData.decksInfo.find(
      (d) => d.nome.toLowerCase() === r.ultimoDeck?.toLowerCase()
    );
    return {
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
      ultimoDeck: r.ultimoDeck || null,
      ultimoDeckEnergia: deckInfo?.tipoEnergia || null,
      ultimoDeckIcone: deckInfo?.icone || null,
    };
  });

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Banner Principal: Top 4 da Temporada + Próximo Evento */}
      <HeroSeasonHub
        temporada={Number(config.temporadaAtual) || 5}
        totalEtapas={etapas.length}
        totalJogadores={rankingRaw.length}
        top4={top4}
        lider={lider}
        topDeck={topDeck}
        awards={awards}
        nextEvent={nextEvent}
      />

      {/* 2. Premiações Projetadas da Temporada */}
      <SeasonAwardsSection awards={awards} />

      {/* 4. Metagame Atual (Donut + Carrossel 3D) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Metagame Atual
          </h2>
          <Link
            href="/metagame"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl"
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
