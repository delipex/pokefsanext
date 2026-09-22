import { getScoresAntigos } from "@/lib/queries";
import { History, Trophy, Award } from "lucide-react";
import { ScoresAntigosClient } from "@/components/historico/ScoresAntigosClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scores Antigos (Era Legada) | Liga Atlântica TCG",
  description: "Histórico consolidado de pontuações e decks das Temporadas #1, #2, #3 e #4.",
};

export default async function ScoresAntigosPage() {
  const scores = await getScoresAntigos();

  return (
    <div className="space-y-10">
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold text-purple-400">
          <History className="h-4 w-4" />
          Memória Histórica da Liga
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Scores Antigos (Temporadas #1 a #4)
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Consolidação oficial de colocações, pontuações e decks utilizados pelos treinadores nas primeiras temporadas do circuito.
        </p>
      </div>

      <ScoresAntigosClient scores={scores} />
    </div>
  );
}
