import { Sparkles } from "lucide-react";

interface TopBannerProps {
  avisoTopo?: string | null;
  linkWhatsApp?: string | null;
  ativo?: boolean | string;
}

export function TopBanner({ avisoTopo, linkWhatsApp, ativo = true }: TopBannerProps) {
  const isEnabled = ativo === true || ativo === "true" || ativo === "1";
  const cleanAviso = avisoTopo?.trim();

  // Se não estiver ativo ou se o texto do aviso estiver vazio, oculta a barra completamente
  if (!isEnabled || !cleanAviso) return null;

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 px-4 py-2 text-center text-xs font-medium text-slate-200 border-b border-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          Aviso da Liga:
        </span>
        <span>{cleanAviso}</span>
        {linkWhatsApp && linkWhatsApp.trim() !== "" && (
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all ml-1"
          >
            Entrar no Grupo VIP
          </a>
        )}
      </div>
    </div>
  );
}
