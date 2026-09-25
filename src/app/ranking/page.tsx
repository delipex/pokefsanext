import { getRanking, getEtapasWithSummary, getAllDecks } from "@/lib/queries";
import { RankingTable } from "@/components/ranking/RankingTable";
import { PlayerModalData } from "@/components/ranking/PlayerModal";

export const revalidate = 60;

export const metadata = {
  title: "Ranking & Etapas | Liga Atlântica TCG",
  description: "Tabela de classificação completa com seletor de etapas e histórico de desempenho.",
};

export default async function RankingPage() {
  const [rankingRaw, etapas, allDecks] = await Promise.all([
    getRanking(),
    getEtapasWithSummary(),
    getAllDecks(),
  ]);

  const ranking: PlayerModalData[] = rankingRaw.map((r, idx) => {
    const deckInfo = allDecks.find(
      (d) => d.nome.toLowerCase() === r.ultimoDeck?.toLowerCase()
    );
    return {
      posicaoOficial: idx + 1,
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
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Classificação Oficial • Temporada 5
        </h1>
      </div>

      {/* Tabela Interativa de Ranking com Seletor de Etapas Integrado */}
      <RankingTable initialPlayers={ranking} etapas={etapas} allDecks={allDecks} />
    </div>
  );
}

