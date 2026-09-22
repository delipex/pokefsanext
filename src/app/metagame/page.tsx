import { getMetagameData } from "@/lib/queries";
import { MetagameDashboard } from "@/components/metagame/MetagameDashboard";
import { MetagamePerformanceRadar } from "@/components/metagame/MetagamePerformanceRadar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Metagame | Liga Atlântica TCG",
  description: "Análise completa do Metagame: presença por etapa, arquétipos dominantes, taxas de vitória e listas de referência.",
};

export default async function MetagamePage() {
  const { metagameEntries, decksInfo, etapas, etapaResultados } = await getMetagameData();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Metagame da Temporada
        </h1>
        <p className="text-sm text-slate-400 font-normal mt-1">
          Distribuição de arquétipos, cartas em destaque e estatísticas de eficiência competitiva na liga.
        </p>
      </div>

      {/* 1. Visão Geral: Carrossel 3D e Gráfico Donut de Presença */}
      <MetagameDashboard
        metagameEntries={metagameEntries}
        decksInfo={decksInfo}
      />

      {/* 2. Visão Detalhada: Radar de Performance, Winrates, Títulos e Decks na Lanterna */}
      <MetagamePerformanceRadar
        metagameEntries={metagameEntries}
        decksInfo={decksInfo}
        etapaResultados={etapaResultados || []}
      />
    </div>
  );
}
