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
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Hall da Fama & Campeões
        </h1>
      </div>

      <ChampionsClient
        champions={champions}
        gallery={gallery}
        legacyScores={legacyScores}
      />
    </div>
  );
}
