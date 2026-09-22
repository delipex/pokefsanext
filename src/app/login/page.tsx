"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Credenciais inválidas. Tente novamente.");
      }
    } catch (err: any) {
      setError("Erro de conexão ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative">
        {/* Glow de fundo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000"></div>

        <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Header do Card */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-inner">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                Painel do Organizador
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Acesso restrito para gestão de etapas TOM e configurações da Liga
              </p>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                PIN ou Senha de Acesso:
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Digite o PIN do Organizador..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé do Card */}
          <div className="border-t border-white/5 pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              ← Voltar para a Página Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
