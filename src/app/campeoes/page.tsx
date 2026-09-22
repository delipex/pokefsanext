import { getCampeoes, getGaleria, getScoresAntigos } from "@/lib/queries";
import { Trophy, Award, Camera, History, Sparkles, ExternalLink } from "lucide-react";
import { ChampionsClient } from "@/components/campeoes/ChampionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hall dos Campeões & Galeria | Liga Atlântica TCG",
  description: "Conheça todos os campeões históricos, fotos dos eventos e pontuações da era legada da Liga Atlântica.",
};

export default async function CampeoesPage() {
  const [champions, gallery, legacyScores] = await Promise.all([
    getCampeoes(),
    getGaleria(),
    getScoresAntigos(),
  ]);

  return (
    <div className="space-y-12">
      {/* Cabeçalho */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3.5 py-1 text-xs font-bold text-yellow-400">
          <Trophy className="h-4 w-4" />
          Hall da Fama & Memória Histórica
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Campeões, Galeria & Histórico
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          A consagração dos grandes vencedores de todas as temporadas da Liga Atlântica,
          nossa galeria de eventos e o registro histórico das temporadas passadas.
        </p>
      </div>

      <ChampionsClient
        champions={champions}
        gallery={gallery}
        legacyScores={legacyScores}
      />
    </div>
  );
}
