"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  KeyRound,
  UserCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
  UserPlus,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Check,
  ChevronLeft,
} from "lucide-react";

export default function PlayerLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "cadastro">("login");

  // Estado de Login
  const [loginPopId, setLoginPopId] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Estado de Ativação Instantânea (quando atleta oficial é reconhecido no login)
  const [activationData, setActivationData] = useState<{
    popId: string;
    nome: string;
    categoria: string;
    pinEntered: string;
    message?: string;
  } | null>(null);
  const [activationPin, setActivationPin] = useState("");
  const [activationConfirmPin, setActivationConfirmPin] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState("");

  // Estado de Cadastro / Primeiro Acesso Manual
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

  // Detecção de atleta oficial na aba de cadastro
  const [detectedRosterAthlete, setDetectedRosterAthlete] = useState<{
    nome: string;
    categoria: string;
    hasPin: boolean;
  } | null>(null);

  // Consulta automática ao digitar POP ID na aba de cadastro
  useEffect(() => {
    const clean = cadPopId.replace(/\D/g, "");
    if (clean.length < 5 || clean.length > 9) {
      setDetectedRosterAthlete(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/portal/login?popId=${clean}`);
        const data = await res.json();
        if (data.exists && data.athlete) {
          setDetectedRosterAthlete({
            nome: data.athlete.nome,
            categoria: data.athlete.categoria,
            hasPin: data.athlete.hasPin,
          });
          if (!cadNome) {
            setCadNome(data.athlete.nome);
          }
        } else {
          setDetectedRosterAthlete(null);
        }
      } catch {
        setDetectedRosterAthlete(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cadPopId]);

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
        window.location.href = "/portal";
      } else if (data.needActivation) {
        // Atleta oficial reconhecido! Abre tela de ativação instantânea sem mudar de aba
        setActivationData({
          popId: data.popId || loginPopId,
          nome: data.athlete?.nome || data.nome || "Treinador Oficial",
          categoria: data.athlete?.categoria || data.categoria || "Master",
          pinEntered: data.pinEntered || loginPin,
          message: data.message,
        });
        setActivationPin(data.pinEntered || loginPin);
        setActivationConfirmPin(data.pinEntered || loginPin);
        setActivationError("");
      } else {
        setLoginError(data.error || "POP ID ou PIN incorreto.");
      }
    } catch (err: any) {
      setLoginError("Erro de conexão ao autenticar. Tente novamente.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Executar Ativação Direta de PIN (1 clique)
  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationData) return;

    if (activationPin.length !== 4) {
      setActivationError("O PIN deve conter exatamente 4 números (Ex: 1234).");
      return;
    }

    if (activationPin !== activationConfirmPin) {
      setActivationError("Os PINs digitados não coincidem. Digite o mesmo PIN nos dois campos.");
      return;
    }

    setActivationError("");
    setActivationLoading(true);

    try {
      const res = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          popId: activationData.popId,
          pin: activationPin,
          confirmPin: activationConfirmPin,
          activate: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = "/portal";
      } else {
        setActivationError(data.error || "Erro ao ativar PIN.");
      }
    } catch (err: any) {
      setActivationError("Erro de conexão ao ativar PIN. Tente novamente.");
    } finally {
      setActivationLoading(false);
    }
  };

  // Executar Cadastro / Ativação na aba de cadastro
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
        setCadSuccess("Acesso ativado com sucesso! Entrando no seu perfil...");
        setTimeout(() => {
          window.location.href = "/portal";
        }, 600);
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-25"></div>

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

          {/* Seletor de Modo: Login vs Cadastro (esconde quando em fluxo de ativação) */}
          {!activationData && (
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setLoginError("");
                }}
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
                onClick={() => {
                  setTab("cadastro");
                  setCadError("");
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === "cadastro"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Primeiro Acesso / Novo
              </button>
            </div>
          )}

          {/* 1. MODO DE ATIVAÇÃO DE PRIMEIRO ACESSO (Atleta Oficial Reconhecido) */}
          {activationData ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 to-indigo-950/60 shadow-inner space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                      Atleta Oficial Reconhecido
                    </span>
                    <h3 className="text-sm font-black text-white">{activationData.nome}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-blue-300 font-bold">
                    POP ID: {activationData.popId}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10 text-emerald-400 font-bold">
                    {activationData.categoria}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Identificamos seu cadastro oficial na Liga! Como este é o seu primeiro acesso ao Portal, basta confirmar o PIN de 4 dígitos abaixo para ativar sua conta e entrar diretamente.
                </p>
              </div>

              {activationError && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{activationError}</span>
                </div>
              )}

              <form onSubmit={handleActivationSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-300">
                      PIN Escolhido (4 Dígitos):
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      value={activationPin}
                      onChange={(e) => setActivationPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm tabular-nums font-semibold text-white focus:border-blue-500 focus:outline-none font-sans"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase text-slate-300">
                      Confirme seu PIN:
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      value={activationConfirmPin}
                      onChange={(e) => setActivationConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm tabular-nums font-semibold text-white focus:border-blue-500 focus:outline-none font-sans"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activationLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {activationLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ativar Meu Perfil & Entrar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivationData(null);
                    setLoginError("");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Voltar ao Login</span>
                </button>
              </form>
            </div>
          ) : tab === "login" ? (
            /* 2. ABA DE LOGIN NORMAL */
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
                    placeholder="Ex: 5145513"
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
          ) : (
            /* 3. ABA DE CADASTRO / PRIMEIRO ACESSO MANUAL */
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

              {/* Destaque quando atleta oficial é detectado na base */}
              {detectedRosterAthlete && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold animate-in fade-in">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span>Atleta oficial localizado: </span>
                    <strong className="text-white">{detectedRosterAthlete.nome}</strong>{" "}
                    <span className="text-[11px] text-emerald-400">({detectedRosterAthlete.categoria})</span>
                    <span className="block font-normal text-[10px] text-slate-300 mt-0.5">
                      {detectedRosterAthlete.hasPin
                        ? "Você já possui um PIN. Acesse a aba 'Já sou Cadastrado'."
                        : "Basta definir seu PIN de 4 dígitos abaixo para ativar seu primeiro acesso."}
                    </span>
                  </div>
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
                    placeholder="Ex: 5145513"
                    value={cadPopId}
                    onChange={(e) => setCadPopId(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs tabular-nums font-semibold text-white focus:border-blue-500 focus:outline-none font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    WhatsApp {detectedRosterAthlete ? "(Opcional)" : "(com DDD)"}:
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 75999999999"
                    value={cadWhatsapp}
                    onChange={(e) => setCadWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans"
                    required={!detectedRosterAthlete}
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
                  readOnly={Boolean(detectedRosterAthlete)}
                  className={`w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans ${
                    detectedRosterAthlete ? "bg-slate-800/80 text-slate-300 cursor-not-allowed" : "bg-slate-950/80"
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    Data de Nascimento {detectedRosterAthlete ? "(Opcional)" : ""}:
                  </label>
                  <input
                    type="date"
                    value={cadDataNasc}
                    onChange={(e) => setCadDataNasc(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none font-sans"
                    required={!detectedRosterAthlete}
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {detectedRosterAthlete
                      ? `Categoria já definida como ${detectedRosterAthlete.categoria}`
                      : "Define automaticamente Master/Senior/Junior"}
                  </span>
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
                    <span>
                      {detectedRosterAthlete ? "Ativar Meu Perfil & Acessar" : "Concluir Cadastro & Acessar"}
                    </span>
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
