import { getEtapasWithSummary } from "@/lib/queries";
import { EtapasTimeline } from "@/components/etapas/EtapasTimeline";
import { Calendar, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendário de Etapas | Liga Atlântica TCG",
  description: "Histórico completo e calendário de todas as etapas e torneios oficiais da Liga Atlântica.",
};

export default async function EtapasPage() {
  const etapas = await getEtapasWithSummary();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
          <Calendar className="h-4 w-4" />
          Circuito Competitivo
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Calendário & Histórico de Etapas
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Todas as rodadas realizadas na temporada atual, incluindo League Challenges e eventos especiais com multiplicadores de pontos.
        </p>
      </div>

      <EtapasTimeline etapas={etapas} />
    </div>
  );
}
