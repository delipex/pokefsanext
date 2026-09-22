import { getRanking, getEtapasWithSummary, getScoresAntigos, getAllDecks } from "@/lib/queries";
import { RankingTable } from "@/components/ranking/RankingTable";
import { ScoresAntigosAccordion } from "@/components/ranking/ScoresAntigosAccordion";
import { PlayerModalData } from "@/components/ranking/PlayerModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ranking & Etapas | Liga Atlântica TCG",
  description: "Tabela de classificação completa com seletor de etapas, histórico e scores antigos.",
};

export default async function RankingPage() {
  const [rankingRaw, etapas, scoresAntigos, allDecks] = await Promise.all([
    getRanking(),
    getEtapasWithSummary(),
    getScoresAntigos(),
    getAllDecks(),
  ]);

  const ranking: PlayerModalData[] = rankingRaw.map((r) => {
    const deckInfo = allDecks.find(
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
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-1.5">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Classificação Oficial • Temporada 5
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Ranking consolidado da temporada e resultados oficiais das etapas disputadas no circuito.
        </p>
      </div>

      {/* Tabela Interativa de Ranking com Seletor de Etapas Integrado */}
      <RankingTable initialPlayers={ranking} etapas={etapas} />

      {/* Rodapé: Consulta de Scores Antigos (#1 a #4) */}
      <section className="pt-4">
        <ScoresAntigosAccordion scores={scoresAntigos} />
      </section>
    </div>
  );
}
