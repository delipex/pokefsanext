import { getMetagameData } from "@/lib/queries";
import { MetagameDashboard } from "@/components/metagame/MetagameDashboard";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Decks & Metagame | Liga Atlântica TCG",
  description: "Análise completa do Metagame: presença por etapa, arquétipos dominantes e listas de referência.",
};

export default async function MetagamePage() {
  const { metagameEntries, decksInfo, etapas } = await getMetagameData();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
          <Flame className="h-4 w-4" />
          Análise Oficial de Metagame
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Metagame & Arquétipos
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Acompanhe a distribuição e frequência de cada deck utilizado pelos jogadores nas etapas oficiais,
          com filtros por sessão individual ou consolidado geral da temporada.
        </p>
      </div>

      <MetagameDashboard
        metagameEntries={metagameEntries}
        decksInfo={decksInfo}
      />
    </div>
  );
}
