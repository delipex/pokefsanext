import {
  BookOpen,
  ShieldCheck,
  Award,
  Trophy,
  Scale,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { getConfigMap } from "@/lib/queries";
import { DEFAULT_REGRAS_DATA, RegraSection } from "@/components/admin/AdminRegrasManager";

export const revalidate = 60;

export const metadata = {
  title: "Regulamento Oficial | Liga Atlântica TCG",
  description: "Regras do circuito, formato dos torneios, sistema de pontuação e código de conduta.",
};

const ICONS_MAP: Record<string, any> = {
  ShieldCheck,
  Trophy,
  Award,
  Scale,
  BookOpen,
  FileText,
  Sparkles,
};

const COLORS_MAP: Record<string, string> = {
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export default async function RegrasPage() {
  let config: Record<string, any> = {};
  try {
    config = await getConfigMap();
  } catch (err) {
    console.error("Erro ao carregar configurações na página de regras:", err);
  }

  let sections: RegraSection[] = DEFAULT_REGRAS_DATA;

  if (config && config.regras) {
    if (Array.isArray(config.regras)) {
      sections = config.regras;
    } else if (typeof config.regras === "string") {
      try {
        const parsed = JSON.parse(config.regras);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sections = parsed;
        }
      } catch {
        // fallback
      }
    }
  }

  const nomeLiga = config?.nomeLiga || "Liga Atlântica";

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Regulamento da {nomeLiga}
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">
          Diretrizes oficiais, formato do circuito, sistema de pontuação e código de conduta.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {sections.map((section, idx) => {
          const IconComp = ICONS_MAP[section.icon] || BookOpen;
          const colorClass = COLORS_MAP[section.color] || COLORS_MAP.blue;
          const contentList = Array.isArray(section.content) ? section.content : [];

          return (
            <div
              key={idx}
              className="rounded-3xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${colorClass}`}>
                  <IconComp className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-black text-white">{section.title}</h3>
              </div>

              <div className="space-y-3 pl-1">
                {contentList.map((p, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed font-normal">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
