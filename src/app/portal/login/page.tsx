"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, KeyRound, UserCheck, Sparkles, AlertCircle, ArrowRight, UserPlus, Phone, Calendar, MapPin, CheckCircle2 } from "lucide-react";

export default function PlayerLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "cadastro">("login");

  // Estado de Login
  const [loginPopId, setLoginPopId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Estado de Cadastro / Primeiro Acesso
  const [cadPopId, setCadPopId] = useState("");
  const [cadNome, setCadNome] = useState("");
  const [cadWhatsapp, setCadWhatsapp] = useState("");
  const [cadDataNasc, setCadDataNasc] = useState("");
  const [cadPin, setCadPin] = useState("");
  const [cadCidade, setCadCidade] = useState("Feira de Santana - BA");
  const [cadHoneypot, setCadHoneypot] = useState(""); // Anti-Bot
  const [cadError, setCadError] = useState("");
  const [cadSuccess, setCadSuccess] = useState("");
  const [cadLoading, setCadLoading] = useState(false);

  // Executar Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popId: loginPopId, pin: loginPin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/portal");
        router.refresh();
      } else {
        if (data.needActivation) {
          setTab("cadastro");
          setCadPopId(loginPopId);
          setCadError(data.error);
        } else {
          setLoginError(data.error || "POP ID ou PIN incorreto.");
        }
      }
    } catch (err: any) {
      setLoginError("Erro de conexão ao autenticar. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Executar Cadastro / Ativação
  const handleCadastroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCadError("");
    setCadSuccess("");
    setCadLoading(true);

    try {
      const res = await fetch("/api/portal/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          popId: cadPopId,
          nome: cadNome,
          whatsapp: cadWhatsapp,
          dataNascimento: cadDataNasc,
          pin: cadPin,
          cidade: cadCidade,
          honeypot: cadHoneypot,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCadSuccess("Cadastro realizado com sucesso! Redirecionando para seu painel...");
        setTimeout(() => {
          router.push("/portal");
          router.refresh();
        }, 1200);
      } else {
        setCadError(data.error || "Erro ao realizar cadastro.");
      }
    } catch (err: any) {
      setCadError("Erro de conexão ao processar cadastro.");
    } finally {
      setCadLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg relative">
        {/* Glow de fundo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-25"></div>

        <div className="relative rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Header do Card */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-inner">
              <UserCheck className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Portal do Treinador
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Área oficial dos competidores da Liga Atlântica TCG
              </p>
            </div>
          </div>

          {/* Seletor de Modo: Login vs Cadastro */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10">
            <button
              type="button"
              onClick={() => { setTab("login"); setLoginError(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Já sou Cadastrado
            </button>
            <button
              type="button"
              onClick={() => { setTab("cadastro"); setCadError(""); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                tab === "cadastro"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Primeiro Acesso / Novo
            </button>
          </div>

          {/* 1. ABA DE LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  POP ID Oficial (Apenas Números):
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 5685779"
                    value={loginPopId}
                    onChange={(e) => setLoginPopId(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm tabular-nums font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  PIN de Acesso (4 Dígitos):
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="DIGITE SEU PIN DE 4 DÍGITOS"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2.5 text-sm tabular-nums font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-sans"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-black text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Meu Perfil</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* 2. ABA DE CADASTRO / PRIMEIRO ACESSO */}
          {tab === "cadastro" && (
            <form onSubmit={handleCadastroSubmit} className="space-y-3.5">
              {cadError && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cadError}</span>
                </div>
              )}

              {cadSuccess && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{cadSuccess}</span>
                </div>
              )}

              {/* Honeypot Invisível Anti-Bot */}
              <input
                type="text"
                name="website_check"
                value={cadHoneypot}
                onChange={(e) => setCadHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    POP ID (Play! Pokémon):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 5685779"
                    value={cadPopId}
                    onChange={(e) => setCadPopId(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs tabular-nums font-semibold text-white focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    WhatsApp (com DDD):
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 75999999999"
                    value={cadWhatsapp}
                    onChange={(e) => setCadWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-300">
                  Nome Completo (Oficial):
                </label>
                <input
                  type="text"
                  placeholder="Nome e Sobrenome"
                  value={cadNome}
                  onChange={(e) => setCadNome(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    Data de Nascimento:
                  </label>
                  <input
                    type="date"
                    value={cadDataNasc}
                    onChange={(e) => setCadDataNasc(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Define automaticamente Master/Senior/Junior</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    Crie um PIN de 4 dígitos:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="CRIE UM PIN DE 4 DÍGITOS"
                    value={cadPin}
                    onChange={(e) => setCadPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs tabular-nums font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Ex: 1234 (apenas 4 números)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cadLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                {cadLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Concluir Cadastro & Acessar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Rodapé do Card */}
          <div className="border-t border-white/5 pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar para a Página Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
