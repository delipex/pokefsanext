import { getRanking, getTop4Podium, getMetagameData, getEtapasWithSummary, getConfigMap, getNextEvent, getSeasonAwards } from "@/lib/queries";
import { HeroSeasonHub } from "@/components/home/HeroSeasonHub";
import { MetagameBanner } from "@/components/home/MetagameBanner";
import { ScrollVelocityCards } from "@/components/home/ScrollVelocityCards";
import { SeasonAwardsSection } from "@/components/ranking/SeasonAwardsSection";
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

  // Top Deck calculation & Decks with counts for Scroll Velocity Marquee
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

  // Lista de cartas enriquecida para a esteira Scroll Velocity
  const velocityDeckList = metaData.decksInfo
    .map((d) => ({
      nome: d.nome,
      tipoEnergia: d.tipoEnergia,
      imagem: d.imagem,
      limitless: d.limitless,
      count: deckCounts[d.nome] || 0,
    }))
    .sort((a, b) => b.count - a.count);

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
    <div className="space-y-8 sm:space-y-12">
      {/* 1. Radar Panorâmico de Metagame Bento (Logo abaixo da Navbar) */}
      <MetagameBanner
        metagameEntries={metaData.metagameEntries}
        decksInfo={metaData.decksInfo}
      />

      {/* 2. Esteira Interativa de Cartas com Scroll Velocity Parallax */}
      <ScrollVelocityCards decks={velocityDeckList} baseVelocity={1.2} />

      {/* 3. Pódio da Temporada + Próximo Evento (Bento 5x7) */}
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

      {/* 4. Premiações Projetadas da Temporada (Bento Quad) */}
      <SeasonAwardsSection awards={awards} />
    </div>
  );
}
