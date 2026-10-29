"use client";

import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center backdrop-blur-2xl shadow-2xl">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
            <RefreshCw className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-white">Liga Atlântica</h1>
          <p className="mt-2 text-sm text-slate-400">
            Ocorreu uma instabilidade no carregamento da aplicação.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-red-500 active:scale-95 transition-all cursor-pointer"
            >
              Recarregar Aplicação
            </button>
            <button
              onClick={() => reset()}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
