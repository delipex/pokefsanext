import { Calendar, Clock, MapPin, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";

export interface EventItem {
  id: number;
  data: string;
  evento: string;
  local: string | null;
  horario: string | null;
  status: string | null;
  descricao: string | null;
  linkMaps: string | null;
  linkInscricao: string | null;
  foto: string | null;
}

interface NextEventCardProps {
  event: EventItem | null;
}

export function NextEventCard({ event }: NextEventCardProps) {
  if (!event) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 p-6 backdrop-blur-2xl shadow-2xl shadow-blue-500/10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Lado Esquerdo: Info Principal */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-300 border border-yellow-500/30 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              PRÓXIMO EVENTO OFICIAL
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30 capitalize">
              {event.status || "Confirmado"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {event.evento}
          </h2>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Calendar className="h-4 w-4" /> {event.data}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-4 w-4 text-slate-400" /> {event.horario || "14:00"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="h-4 w-4 text-rose-400" /> {event.local || "Livraria Atlântica +"}
            </span>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {event.linkMaps && (
            <a
              href={event.linkMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md"
            >
              <MapPin className="h-4 w-4 text-rose-400" />
              Como Chegar
            </a>
          )}
          {event.linkInscricao ? (
            <a
              href={event.linkInscricao}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white hover:opacity-90 transition-all shadow-lg shadow-blue-500/30"
            >
              Inscrever-se <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <span className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600/30 px-5 py-3 text-xs font-bold text-blue-300 border border-blue-500/40">
              Inscrição no Local
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
