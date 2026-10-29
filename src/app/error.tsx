"use client";

import { useEffect } from "react";
import { RefreshCw, RotateCcw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error("[Liga Atlântica Error Boundary]:", error);

    // Recuperação automática e transparente para erros de deploy/chunk desatualizado (ChunkLoadError)
    const errorMsg = error?.message || "";
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      errorMsg.includes("Loading chunk") ||
      errorMsg.includes("Failed to fetch") ||
      errorMsg.includes("NetworkError") ||
      errorMsg.includes("dynamically imported module");

    if (isChunkError && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("app_chunk_reload_ts");
      const now = Date.now();
      // Se não tentou recarregar nos últimos 15 segundos, recarrega automaticamente
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem("app_chunk_reload_ts", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/85 p-8 text-center backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Ícone Pokémon / Alerta */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
            <AlertTriangle className="h-8 w-8 animate-pulse" />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Ops! Algo oscilou
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Uma atualização no sistema ou oscilação na conexão impediu a renderização completa desta página.
          </p>

          {error?.digest && (
            <p className="mt-2 text-[11px] font-mono text-slate-500">
              Código: {error.digest}
            </p>
          )}

          {/* Botões de Ação */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={handleHardReload}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar Página
            </button>
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Tentar Novamente
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Voltar para o Início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
