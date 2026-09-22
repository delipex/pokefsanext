import { getRanking, getEtapasWithSummary, getScoresAntigos } from "@/lib/queries";
import { RankingTable } from "@/components/ranking/RankingTable";
import { ScoresAntigosAccordion } from "@/components/ranking/ScoresAntigosAccordion";
import { Trophy } from "lucide-react";
import { PlayerModalData } from "@/components/ranking/PlayerModal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ranking & Etapas | Liga Atlântica TCG",
  description: "Tabela de classificação completa com seletor de etapas, histórico e scores antigos.",
};

export default async function RankingPage() {
  const [rankingRaw, etapas, scoresAntigos] = await Promise.all([
    getRanking(),
    getEtapasWithSummary(),
    getScoresAntigos(),
  ]);

  const ranking: PlayerModalData[] = rankingRaw.map((r) => ({
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
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
          <Trophy className="h-4 w-4" />
          Classificação Oficial • Temporada 5
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Tabela Geral de Classificação
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Consulte o ranking geral consolidado da temporada ou alterne entre as 21 etapas individuais do circuito oficial.
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
