"use client";

import { Sparkles, Trophy } from "lucide-react";

interface TopBannerProps {
  avisoTopo?: string | null;
  linkWhatsApp?: string | null;
  ativo?: boolean | string;
  premierAbertas?: boolean;
  premierNome?: string | null;
}

export function TopBanner({
  avisoTopo,
  linkWhatsApp,
  ativo = true,
  premierAbertas = false,
  premierNome,
}: TopBannerProps) {
  const isEnabled = ativo === true || ativo === "true" || ativo === "1";
  const cleanAviso = avisoTopo?.trim();

  // Se não estiver ativo e não houver inscrições abertas, oculta a barra completamente
  if ((!isEnabled || !cleanAviso) && !premierAbertas) return null;

  const handleOpenInscricao = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "inscricao";
      window.dispatchEvent(new CustomEvent("open-inscricao-modal"));
    }
  };

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 px-4 py-2 text-center text-xs font-medium text-slate-200 border-b border-white/10 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 flex-wrap">
        {premierAbertas && (
          <button
            onClick={handleOpenInscricao}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-[11px] font-black text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/20 animate-pulse"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>⚡ Inscrições Abertas{premierNome ? `: ${premierNome}` : "!"}</span>
          </button>
        )}

        {cleanAviso && (
          <>
            <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Aviso da Liga:
            </span>
            <span>{cleanAviso}</span>
          </>
        )}

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

