import { getCalendario } from "@/lib/queries";
import { Calendar, Clock, MapPin, ExternalLink, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendário Oficial de Eventos | Liga Atlântica TCG",
  description: "Confira as datas, locais e horários das próximas etapas, torneios e sessões da Liga Atlântica em Feira de Santana.",
};

export default async function CalendarioPage() {
  const eventos = await getCalendario();

  return (
    <div className="space-y-10">
      {/* Cabeçalho */}
      <div className="space-y-1.5 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Calendário de Torneios
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Datas e programações das sessões de liga semanais, League Challenges e League Cups.
        </p>
      </div>

      {/* Grid de Eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eventos.map((ev, idx) => {
          const isConfirmed = ev.status?.toLowerCase() === "confirmado";

          return (
            <div
              key={ev.id || idx}
              className={`flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-xl transition-all shadow-xl ${
                isConfirmed
                  ? "border-blue-500/40 bg-slate-900/75 shadow-blue-500/10 hover:border-blue-400"
                  : "border-white/10 bg-slate-900/60 opacity-80"
              }`}
            >
              <div className="space-y-4">
                {/* Topo: Data & Status */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-300 border border-blue-500/30">
                    <Calendar className="h-3.5 w-3.5" />
                    {ev.data}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isConfirmed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                    }`}
                  >
                    {isConfirmed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Confirmado
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Pendente
                      </>
                    )}
                  </span>
                </div>

                {/* Título do Evento */}
                <h3 className="text-xl font-black text-white">{ev.evento}</h3>

                {/* Local & Horário */}
                <div className="space-y-2 rounded-2xl border border-white/5 bg-slate-950/60 p-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Horário: <strong className="text-white">{ev.horario || "14:00"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>Local: <strong className="text-white">{ev.local || "Livraria Atlântica +"}</strong></span>
                  </div>
                </div>

                {ev.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{ev.descricao}</p>
                )}
              </div>

              {/* Ações */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                {ev.linkMaps && (
                  <a
                    href={ev.linkMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 py-2.5 px-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                  >
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    Ver Mapa
                  </a>
                )}
                {ev.linkInscricao && (
                  <a
                    href={ev.linkInscricao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 px-3 text-xs font-black text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/30"
                  >
                    Inscrição Online <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
