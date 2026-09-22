import { getCalendario } from "@/lib/queries";
import { Clock, MapPin, ExternalLink, CheckCircle2, CalendarDays, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendário Oficial de Torneios | Liga Atlântica TCG",
  description: "Cronograma e agenda oficial dos próximos torneios e sessões da Liga Atlântica em Feira de Santana.",
};

function parseEventDate(rawDate: string) {
  if (!rawDate) return { day: "--", weekday: "---", month: "---", full: rawDate };

  let year = 2026,
    month = 9,
    day = 1;
  const clean = rawDate.replace(/\//g, "-").trim();
  const parts = clean.split("-");

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }
  }

  const dateObj = new Date(year, month - 1, day);
  const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

  return {
    day: String(day).padStart(2, "0"),
    weekday: weekdays[dateObj.getDay()] || "---",
    month: months[month - 1] || "---",
    year: String(year),
    full: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
  };
}

function getEventTypeBadge(title: string) {
  const lower = (title || "").toLowerCase();
  if (lower.includes("cup")) {
    return { label: "League Cup", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" };
  }
  if (lower.includes("challenge")) {
    return { label: "League Challenge", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  }
  if (lower.includes("especial") || lower.includes("tbt")) {
    return { label: "Sessão Especial", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" };
  }
  return { label: "Sessão de Liga", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" };
}

export default async function CalendarioPage() {
  const eventos = await getCalendario();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Calendário de Torneios
        </h1>
      </div>

      {/* Lista / Linha do Tempo dos Eventos */}
      {eventos.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center text-slate-400">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum torneio agendado no momento</h3>
          <p className="text-xs text-slate-500 mt-1">Fique atento aos anúncios no grupo oficial da Liga.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((ev, idx) => {
            const dateBadge = parseEventDate(ev.data);
            const isConfirmed = ev.status?.toLowerCase() === "confirmado";
            const eventType = getEventTypeBadge(ev.evento);

            return (
              <div
                key={ev.id || idx}
                className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 p-4 sm:p-5 shadow-lg backdrop-blur-xl transition-all hover:border-blue-500/40 hover:shadow-blue-500/5 hover:-translate-y-0.5"
              >
                {/* Lado Esquerdo: Bloco de Data + Informações */}
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  {/* Bloco de Data Estilizado */}
                  <div className="flex flex-col items-center justify-center h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-2xl border border-white/15 bg-slate-800/80 shadow-inner text-center">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                      {dateBadge.weekday}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white leading-none my-0.5">
                      {dateBadge.day}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {dateBadge.month}
                    </span>
                  </div>

                  {/* Detalhes do Evento */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${eventType.color}`}>
                        {eventType.label}
                      </span>
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Confirmado
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <Clock className="h-3 w-3 text-blue-400" /> {ev.horario || "14:00"}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate">
                      {ev.evento}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">
                        {ev.local || "Livraria Atlântica +"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Ações */}
                <div className="shrink-0 flex items-center gap-2">
                  {ev.linkInscricao ? (
                    <a
                      href={ev.linkInscricao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-blue-600/30 transition-all"
                    >
                      Inscrição <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : ev.linkMaps ? (
                    <a
                      href={ev.linkMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-400" /> Como Chegar
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
