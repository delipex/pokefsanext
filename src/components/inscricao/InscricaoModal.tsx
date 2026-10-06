"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Copy,
  Check,
  Trophy,
  Shield,
  Send,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Share2,
  FileText,
  User,
  Hash,
  CreditCard,
  QrCode,
} from "lucide-react";
import { EnergyBadge } from "@/components/ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

const ENERGY_OPTIONS = [
  { id: "lightning", label: "Elétrica", bg: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { id: "fire", label: "Fogo", bg: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  { id: "water", label: "Água", bg: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  { id: "grass", label: "Planta", bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { id: "psychic", label: "Psíquica", bg: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  { id: "darkness", label: "Escuridão", bg: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  { id: "dragon", label: "Dragão", bg: "bg-amber-600/20 text-amber-400 border-amber-600/40" },
  { id: "metal", label: "Metálica", bg: "bg-slate-400/20 text-slate-200 border-slate-400/40" },
  { id: "fighting", label: "Luta", bg: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  { id: "colorless", label: "Incolor", bg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
];

interface InscricaoModalProps {
  initialConfig?: Record<string, any>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function InscricaoModal({ initialConfig, isOpen: controlledIsOpen, onClose: controlledOnClose }: InscricaoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Record<string, any>>(initialConfig || {});
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [popId, setPopId] = useState("");
  const [anoNascimento, setAnoNascimento] = useState("");
  const [categoria, setCategoria] = useState<"Master" | "Senior" | "Junior">("Master");
  const [whatsapp, setWhatsapp] = useState("");
  const [deckNome, setDeckNome] = useState("");
  const [tipoEnergia, setTipoEnergia] = useState("lightning");
  const [decklistRaw, setDecklistRaw] = useState("");
  const [limitlessUrl, setLimitlessUrl] = useState("");

  // UI / Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    protocolo: string;
    waUrl: string;
    chavePix: string;
    titularPix: string;
    valor: string;
    item?: any;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedProtocolo, setCopiedProtocolo] = useState(false);

  // Listeners para abrir o modal via Hash (#inscricao), Search Param ou Custom Event
  useEffect(() => {
    const checkOpenTriggers = () => {
      if (typeof window === "undefined") return;
      const hasHash = window.location.hash.toLowerCase() === "#inscricao";
      const hasParam = new URLSearchParams(window.location.search).get("inscricao") === "true";
      if (hasHash || hasParam) {
        setIsOpen(true);
      }
    };

    checkOpenTriggers();

    const handleHashChange = () => checkOpenTriggers();
    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("open-inscricao-modal", handleCustomOpen);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("open-inscricao-modal", handleCustomOpen);
    };
  }, []);

  // Sync com controlled isOpen prop
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Carrega configurações mais atualizadas da API quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsLoadingConfig(true);
      fetch("/api/inscricao")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.config) {
            setConfig(data.config);
            setTotalInscritos(data.totalInscritos || 0);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingConfig(false));
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    if (window.location.hash.toLowerCase() === "#inscricao") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setIsOpen(false);
    setSuccessData(null);
    setErrorMessage(null);
    controlledOnClose?.();
  };

  // Cálculo automático da categoria Play! Pokémon por ano de nascimento
  const handleBirthYearChange = (val: string) => {
    setAnoNascimento(val);
    const yr = parseInt(val, 10);
    if (!isNaN(yr) && yr > 1900 && yr <= new Date().getFullYear()) {
      if (yr >= 2013) {
        setCategoria("Junior");
      } else if (yr >= 2009) {
        setCategoria("Senior");
      } else {
        setCategoria("Master");
      }
    }
  };

  // Contador de cartas em tempo real
  const parsedCardsCount = useMemo(() => {
    if (!decklistRaw.trim()) return 0;
    const lines = decklistRaw.split(/\r?\n/);
    let total = 0;
    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+/);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count < 60) total += count;
      }
    }
    return total;
  }, [decklistRaw]);

  const isAbertas = config.premierAbertas === "true" || config.premierAbertas === true;
  const isDlExigida = config.premierExigirDecklist === "true" || config.premierExigirDecklist === true;
  const maxVagas = parseInt(config.premierVagas || "32", 10);
  const vagasRestantes = Math.max(0, maxVagas - totalInscritos);
  const tema = config.premierTema || "lightning";

  const handleCopyPix = () => {
    const key = successData?.chavePix || config.premierPix || "";
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyProtocolo = () => {
    if (!successData?.protocolo) return;
    navigator.clipboard.writeText(successData.protocolo);
    setCopiedProtocolo(true);
    setTimeout(() => setCopiedProtocolo(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage("Por favor, preencha seu Nome Completo de competidor.");
      return;
    }

    const cleanPopId = popId.replace(/\D/g, "");
    if (!cleanPopId || cleanPopId.length < 5 || cleanPopId.length > 9) {
      setErrorMessage("Informe um POP ID oficial válido (entre 5 e 9 dígitos numéricos).");
      return;
    }

    if (!deckNome.trim()) {
      setErrorMessage("Informe o Arquétipo / Nome do seu baralho.");
      return;
    }

    if (isDlExigida && parsedCardsCount !== 60 && !limitlessUrl.trim()) {
      const confirmed = window.confirm(
        `Aviso: A decklist inserida possui ${parsedCardsCount}/60 cartas. Deseja submeter mesmo assim e regularizar antes da Rodada 1?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/inscricao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jogadorNome: nome.trim(),
          jogadorId: cleanPopId,
          anoNascimento: anoNascimento.trim(),
          categoria,
          whatsapp: whatsapp.trim(),
          deckNome: deckNome.trim(),
          tipoEnergia,
          decklistRaw: decklistRaw.trim(),
          limitlessUrl: limitlessUrl.trim(),
          eventoNome: config.premierNome || "Torneio Oficial Liga Atlântica",
          etapaData: config.premierData || new Date().toISOString().split("T")[0],
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Erro ao processar inscrição. Tente novamente.");
        setIsSubmitting(false);
        return;
      }

      setSuccessData({
        protocolo: data.protocolo,
        waUrl: data.waUrl,
        chavePix: data.chavePix || config.premierPix || "",
        titularPix: data.titularPix || config.premierTitular || "",
        valor: data.valor || config.premierValor || "0,00",
        item: data.item,
      });
      setTotalInscritos((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Falha na conexão com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop Escuro Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#050811]/85 backdrop-blur-xl transition-opacity"
          />

          {/* Container Modal com Efeito de Card Premium */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0c1222]/95 p-5 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-3xl z-10 space-y-6 text-slate-100"
          >
            {/* Botão Fechar Flutuante */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* =========================================================
                TELA DE SUCESSO / CONFIRMAÇÃO DE INSCRIÇÃO
               ========================================================= */}
            {successData ? (
              <div className="space-y-6 py-2 text-center">
                {/* Ícone de Sucesso Animado */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="h-9 w-9 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-300 uppercase tracking-wider">
                    Inscrição Registrada!
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Tudo Pronto, Treinador!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    Sua vaga foi pré-reservada com sucesso. Guarde o protocolo e finalize a confirmação enviando o comprovante via PIX.
                  </p>
                </div>

                {/* Card do Protocolo Oficial */}
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 backdrop-blur-md flex items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Protocolo de Inscrição
                    </span>
                    <div className="font-mono text-lg sm:text-xl font-black text-white">
                      #{successData.protocolo}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyProtocolo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-3 py-2 text-xs font-bold text-amber-300 transition-all cursor-pointer"
                  >
                    {copiedProtocolo ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedProtocolo ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>

                {/* Card de Pagamento PIX */}
                {successData.chavePix && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Dados para Pagamento PIX
                        </span>
                      </div>
                      <span className="text-sm font-black text-emerald-400">
                        R$ {successData.valor}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Titular:</span>
                        <span className="text-slate-200 font-semibold">{successData.titularPix}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-black/40 rounded-xl p-2.5 border border-white/5">
                        <span className="font-mono text-xs text-amber-300 truncate max-w-[280px]">
                          {successData.chavePix}
                        </span>
                        <button
                          onClick={handleCopyPix}
                          className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition-all shrink-0 cursor-pointer"
                        >
                          {copiedPix ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedPix ? "Copiada" : "Copiar Chave"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões de Ação do Sucesso */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href={successData.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 p-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Enviar Comprovante no WhatsApp
                  </a>
                  <button
                    onClick={handleClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              /* =========================================================
                  TELA DO FORMULÁRIO DE INSCRIÇÃO
                 ========================================================= */
              <div className="space-y-6">
                {/* Header do Torneio */}
                <div className="space-y-2 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-black uppercase tracking-wider ${
                        isAbertas
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                          : "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isAbertas ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                      {isAbertas ? "Inscrições Abertas" : "Inscrições Fechadas"}
                    </span>
                    <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                      {config.premierTipo || "League Challenge"}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                    {config.premierNome || "League Challenge — Liga Atlântica"}
                  </h1>

                  {config.premierSubtitulo && (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {config.premierSubtitulo}
                    </p>
                  )}

                  {/* Detalhes Rápidos em Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] p-2 border border-white/5">
                      <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="truncate">{config.premierData || "A definir"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] p-2 border border-white/5">
                      <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="truncate">{config.premierHorario || "14:00"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] p-2 border border-white/5">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                      <span className="truncate">{config.premierLocal || "Livraria Atlântica"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-white/[0.03] p-2 border border-white/5">
                      <CreditCard className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate font-bold text-white">R$ {config.premierValor || "35,00"}</span>
                    </div>
                  </div>

                  {/* Barra de Vagas Disponíveis */}
                  <div className="pt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Vagas Preenchidas</span>
                      <span className="text-white tabular-nums">
                        {totalInscritos} / {maxVagas} ({vagasRestantes} restantes)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (totalInscritos / maxVagas) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Alerta de Erro */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 font-semibold"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Formulário Interativo */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome Completo & POP ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-amber-400" /> Nome Completo do Jogador *
                      </label>
                      <input
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Felipe Damasceno"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-blue-400" /> Play! Pokémon ID (POP ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={popId}
                        onChange={(e) => setPopId(e.target.value)}
                        placeholder="Ex: 1234567"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Ano de Nascimento / Categoria & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Ano de Nasc.</label>
                      <input
                        type="number"
                        min="1950"
                        max="2026"
                        value={anoNascimento}
                        onChange={(e) => handleBirthYearChange(e.target.value)}
                        placeholder="Ex: 1998"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Categoria Play!</label>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as any)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Master">Master (16+ anos)</option>
                        <option value="Senior">Senior (12 a 15 anos)</option>
                        <option value="Junior">Junior (&lt;12 anos)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">WhatsApp (DDD + Número)</label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ex: (75) 99999-9999"
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Nome do Deck & Tipo de Energia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Arquétipo / Nome do Deck *</label>
                      <input
                        type="text"
                        required
                        value={deckNome}
                        onChange={(e) => setDeckNome(e.target.value)}
                        placeholder="Ex: Dragapult Dusknoir, Lugia VSTAR..."
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Tipo de Energia Principal</label>
                      <select
                        value={tipoEnergia}
                        onChange={(e) => setTipoEnergia(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                      >
                        {ENERGY_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Decklist de 60 Cartas (Textarea + Card Counter) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-purple-400" /> Decklist de 60 Cartas{" "}
                        <span className="text-slate-400 font-normal">
                          {isDlExigida ? "(Obrigatória)" : "(Opcional no envio)"}
                        </span>
                      </label>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${
                          parsedCardsCount === 60
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        }`}
                      >
                        {parsedCardsCount} / 60 Cartas {parsedCardsCount === 60 ? "✅" : ""}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={decklistRaw}
                      onChange={(e) => setDecklistRaw(e.target.value)}
                      placeholder={`Cole a lista exportada do Pokémon TCG Live ou Limitless:\nExemplo:\n4 Dragapult ex TWM 130\n2 Drakloak TWM 129\n4 Arven OBF 186\n...`}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Link do Limitless (Opcional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5 text-blue-400" /> Link da Lista no Limitless (Opcional)
                    </label>
                    <input
                      type="url"
                      value={limitlessUrl}
                      onChange={(e) => setLimitlessUrl(e.target.value)}
                      placeholder="https://limitlesstcg.com/decks/list/..."
                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Observações / Regras do Organizador */}
                  {config.premierObs && (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{config.premierObs}</p>
                    </div>
                  )}

                  {/* Botão de Submissão */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isAbertas}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl p-4 text-sm sm:text-base font-black text-white shadow-xl transition-all cursor-pointer ${
                        !isAbertas
                          ? "bg-slate-700 opacity-50 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processando Inscrição...</span>
                        </>
                      ) : !isAbertas ? (
                        <span>Inscrições Encerradas para este Torneio</span>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-amber-300" />
                          <span>Confirmar Inscrição & Obter Protocolo</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
