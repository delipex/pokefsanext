import { getRanking, getTop4Podium, getMetagameData, getEtapasWithSummary, getConfigMap, getNextEvent, getSeasonAwards } from "@/lib/queries";
import { HeroSeasonHub } from "@/components/home/HeroSeasonHub";
import { ScrollVelocityCards } from "@/components/home/ScrollVelocityCards";
import { SeasonAwardsSection } from "@/components/ranking/SeasonAwardsSection";
import { PlayerModalData } from "@/components/ranking/PlayerModal";

export const revalidate = 60;

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

  // 1. Mapeamento de decks por etapa e jogador
  const matchDeckMap = new Map<string, string>();
  metaData.metagameEntries.forEach((entry: any) => {
    if (entry.jogadorNome && entry.deckNome) {
      matchDeckMap.set(`${entry.etapaData}_${entry.jogadorNome.trim().toLowerCase()}`, entry.deckNome.trim());
    }
  });

  // 2. Acumuladores de estatísticas por deck
  const deckStats = new Map<string, {
    vitorias: number;
    empates: number;
    derrotas: number;
    titulos: number;
    podios: number;
    totalAparicoes: number;
  }>();

  const getOrInit = (dName: string) => {
    if (!deckStats.has(dName)) {
      deckStats.set(dName, { vitorias: 0, empates: 0, derrotas: 0, titulos: 0, podios: 0, totalAparicoes: 0 });
    }
    return deckStats.get(dName)!;
  };

  metaData.metagameEntries.forEach((entry: any) => {
    const dName = entry.deckNome?.trim();
    if (!dName || dName.toLowerCase() === "outros" || dName.toLowerCase() === "sem deck registrado") return;
    getOrInit(dName).totalAparicoes += 1;
  });

  metaData.etapaResultados.forEach((res: any) => {
    const key = `${res.etapaData}_${(res.jogadorNome || "").trim().toLowerCase()}`;
    const dName = res.deckNome?.trim() || matchDeckMap.get(key);
    if (!dName || dName.toLowerCase() === "outros" || dName.toLowerCase() === "sem deck registrado") return;

    const s = getOrInit(dName);
    const v = Number(res.vitorias) || 0;
    const e = Number(res.empates) || 0;
    const d = Number(res.derrotas) || 0;
    s.vitorias += v;
    s.empates += e;
    s.derrotas += d;
    if (res.colocacao === 1) s.titulos += 1;
    if (res.colocacao <= 4) s.podios += 1;
  });

  // 3. Montar Top 15 Decks com maior Winrate (amostra de pelo menos 2 partidas para relevância competitiva)
  const allDecksWithWinrate = Array.from(deckStats.entries())
    .map(([nome, stats]) => {
      const info = metaData.decksInfo.find((d: any) => d.nome.toLowerCase() === nome.toLowerCase());
      const totalPartidas = stats.vitorias + stats.empates + stats.derrotas;
      const winRate = totalPartidas > 0 ? (stats.vitorias / totalPartidas) * 100 : 0;
      return {
        nome,
        tipoEnergia: info?.tipoEnergia || "colorless",
        imagem: info?.imagem || null,
        limitless: info?.limitless || null,
        icone: info?.icone || null,
        count: stats.totalAparicoes,
        vitorias: stats.vitorias,
        empates: stats.empates,
        derrotas: stats.derrotas,
        totalPartidas,
        winRate: Number(winRate.toFixed(1)),
        titulos: stats.titulos,
        podios: stats.podios,
      };
    })
    .filter((d) => d.totalPartidas >= 2)
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      return b.totalPartidas - a.totalPartidas;
    });

  const velocityDeckList = allDecksWithWinrate.slice(0, 15);

  const totalMetaEntries = metaData.metagameEntries.length;
  let topDeckName = "";
  let topDeckMax = 0;
  for (const [d, s] of deckStats.entries()) {
    if (s.totalAparicoes > topDeckMax) {
      topDeckMax = s.totalAparicoes;
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

  const exibirCarrossel = config.exibirCarrosselDecksHome !== "false";
  const velocidade = Number(config.velocidadeCarrossel) || -28;
  const exibirPodio = config.exibirPodioHome !== "false";
  const exibirProximoEvento = config.exibirProximoEventoHome !== "false";
  const exibirPremiacoes = config.exibirPremiacoesHome !== "false";

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 1. Galeria Flutuante Editorial de Cartas com Telemetria Integrada no Rodapé */}
      {exibirCarrossel && (
        <ScrollVelocityCards
          decks={velocityDeckList}
          metagameEntries={metaData.metagameEntries}
          decksInfo={metaData.decksInfo}
          baseVelocity={velocidade}
        />
      )}

      {/* 2. Pódio da Temporada + Próximo Evento (Bento 5x7) */}
      {(exibirPodio || exibirProximoEvento) && (
        <HeroSeasonHub
          temporada={Number(config.temporadaAtual) || 5}
          totalEtapas={etapas.length}
          totalJogadores={rankingRaw.length}
          top4={top4}
          lider={lider}
          topDeck={topDeck}
          awards={awards}
          nextEvent={nextEvent}
          exibirPodio={exibirPodio}
          exibirProximoEvento={exibirProximoEvento}
        />
      )}

      {/* 3. Premiações Projetadas da Temporada (Bento Quad) */}
      {exibirPremiacoes && <SeasonAwardsSection awards={awards} />}
    </div>
  );
}
