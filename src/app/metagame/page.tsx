import { getMetagameData } from "@/lib/queries";
import { MetagameDashboard } from "@/components/metagame/MetagameDashboard";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Metagame | Liga Atlântica TCG",
  description: "Análise completa do Metagame: presença por etapa, arquétipos dominantes e listas de referência.",
};

export default async function MetagamePage() {
  const { metagameEntries, decksInfo, etapas } = await getMetagameData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Metagame da Temporada
        </h1>
      </div>

      <MetagameDashboard
        metagameEntries={metagameEntries}
        decksInfo={decksInfo}
      />
    </div>
  );
}
