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
  Layers,
  Download,
  Loader2,
} from "lucide-react";
import { EnergyBadge } from "@/components/ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import defaultDecks from "@/data/decks.json";
import { parsePTCGDecklist, ParsedDecklistResult } from "@/lib/decklist-parser";
import { DecklistVisualGallery } from "@/components/deck/DecklistVisualGallery";

// Catálogo padrão de baralhos cadastrados da Liga
const CATALOG_DECKS: string[] = Array.from(
  new Set(
    (defaultDecks as any[])
      .map((d) => (d.deck || d.nome || "").trim())
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b, "pt-BR"));

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
  const [dataNascimento, setDataNascimento] = useState("");
  const [categoria, setCategoria] = useState<"Master" | "Senior" | "Junior">("Master");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedDeck, setSelectedDeck] = useState("");
  const [customDeckNome, setCustomDeckNome] = useState("");
  const [deckCatalogList, setDeckCatalogList] = useState<string[]>(CATALOG_DECKS);
  const [decklistRaw, setDecklistRaw] = useState("");
  const [limitlessUrl, setLimitlessUrl] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"pix" | "presencial">("pix");
  const [isFetchingLimitless, setIsFetchingLimitless] = useState(false);
  const [limitlessFetchError, setLimitlessFetchError] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<{
    popId: string;
    nome: string;
    categoria?: string;
    whatsapp?: string;
    dataNascimento?: string;
    deckAtivoNome?: string;
    decklistTexto?: string;
    activeRegistration?: any;
  } | null>(null);
  const [existingRegistration, setExistingRegistration] = useState<any | null>(null);

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

  // Carrega configurações mais atualizadas da API, catálogo de decks e sessão ativa do atleta quando aberto
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

      fetch("/api/admin/decks")
        .then((res) => res.json())
        .then((data) => {
          if (data?.decks && Array.isArray(data.decks)) {
            const names = Array.from(
              new Set(data.decks.map((d: any) => (d.nome || d.deck || "").trim()).filter(Boolean))
            ).sort((a: any, b: any) => a.localeCompare(b, "pt-BR"));
            if (names.length > 0) setDeckCatalogList(names as string[]);
          }
        })
        .catch(() => {});

      // Auto-preenchimento para atletas logados no Portal
      fetch("/api/portal/me")
        .then((res) => res.json())
        .then((user) => {
          if (user && user.loggedIn && user.popId) {
            setLoggedInUser(user);
            setNome((prev) => (!prev ? user.nome || "" : prev));
            setPopId((prev) => (!prev ? String(user.popId) || "" : prev));
            if (user.categoria) {
              setCategoria(user.categoria);
            }
            if (user.dataNascimento) {
              setDataNascimento((prev) => (!prev ? user.dataNascimento : prev));
            }
            if (user.whatsapp) {
              setWhatsapp((prev) => (!prev ? user.whatsapp : prev));
            }
            if (user.activeRegistration) {
              setExistingRegistration(user.activeRegistration);
              setSelectedDeck(user.activeRegistration.deckNome || user.deckAtivoNome || "");
              setDecklistRaw(user.activeRegistration.decklistRaw || user.decklistTexto || "");
              if (
                user.activeRegistration.statusPix === "Pagar no Local" ||
                user.activeRegistration.statusPix === "Presencial"
              ) {
                setMetodoPagamento("presencial");
              }
            } else {
              if (user.deckAtivoNome) {
                setSelectedDeck((prev) => (!prev ? user.deckAtivoNome : prev));
              }
              if (user.decklistTexto) {
                setDecklistRaw((prev) => (!prev ? user.decklistTexto : prev));
              }
            }
          }
        })
        .catch(() => {});
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

  // Cálculo automático da categoria Play! Pokémon por data de nascimento (Temporada Oficial)
  const calculatePlayPokemonCategory = (val: string): "Master" | "Senior" | "Junior" => {
    if (!val) return "Master";
    const parts = val.split("-");
    if (parts.length === 3) {
      const yr = parseInt(parts[0], 10);
      if (!isNaN(yr) && yr > 1900) {
        if (yr >= 2014) return "Junior";
        if (yr >= 2010) return "Senior";
        return "Master";
      }
    }
    return "Master";
  };

  const handleBirthDateChange = (val: string) => {
    setDataNascimento(val);
    if (!val) return;
    const autoCat = calculatePlayPokemonCategory(val);
    setCategoria(autoCat);
  };


  // Parser visual e contador de cartas em tempo real
  const parsedDeckData: ParsedDecklistResult = useMemo(() => {
    return parsePTCGDecklist(decklistRaw);
  }, [decklistRaw]);

  const parsedCardsCount = parsedDeckData.totalCards;

  // Atualiza decklist de 60 cartas
  const handleDecklistChange = (val: string) => {
    setDecklistRaw(val);
  };

  // Puxar decklist automaticamente pelo link do Limitless
  const handleFetchLimitless = async (urlOverride?: string) => {
    const url = urlOverride || limitlessUrl;
    if (!url || !url.trim()) {
      setLimitlessFetchError("Cole um link válido do Limitless antes de buscar.");
      return;
    }
    if (!url.includes("limitlesstcg.com")) {
      setLimitlessFetchError("O link deve ser do site limitlesstcg.com (ex: https://limitlesstcg.com/decks/list/...)");
      return;
    }

    setIsFetchingLimitless(true);
    setLimitlessFetchError(null);

    try {
      const res = await fetch(`/api/deck/fetch-limitless?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Não foi possível puxar o baralho do Limitless.");
      }

      if (data.decklistRaw) {
        setDecklistRaw(data.decklistRaw);
      }
    } catch (err: any) {
      setLimitlessFetchError(err.message || "Erro ao conectar com o Limitless.");
    } finally {
      setIsFetchingLimitless(false);
    }
  };

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

    const finalDeckNome = selectedDeck === "Outro" ? customDeckNome.trim() : selectedDeck.trim();
    if (!finalDeckNome || finalDeckNome.toLowerCase() === "outro" || finalDeckNome.toLowerCase() === "outros") {
      setErrorMessage("Por favor, selecione ou digite o nome específico do baralho que irá jogar (a palavra 'Outro' não é permitida como nome de deck).");
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
          dataNascimento: dataNascimento.trim(),
          categoria,
          whatsapp: whatsapp.trim(),
          deckNome: finalDeckNome,
          tipoEnergia: "auto",
          decklistRaw: decklistRaw.trim(),
          limitlessUrl: limitlessUrl.trim(),
          metodoPagamento,
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

                {/* Card de Pagamento PIX ou Aviso Presencial */}
                {metodoPagamento === "pix" && successData.chavePix ? (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-emerald-400" />
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
                ) : (
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 text-blue-300">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Pagamento no Dia do Evento (Presencial)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Sua pré-inscrição foi registrada com sucesso! Por favor, apresente-se na recepção antes da Rodada 1 para efetuar o pagamento de <strong>R$ {successData.valor}</strong> e confirmar o seu check-in.
                    </p>
                  </div>
                )}

                {/* Visualizador Gráfico do Deck Submetido no Sucesso */}
                {parsedDeckData.totalCards > 0 && (
                  <div className="text-left space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                      Seu Baralho Registrado ({parsedDeckData.totalCards} Cartas)
                    </span>
                    <DecklistVisualGallery
                      parsedData={parsedDeckData}
                      deckName={selectedDeck === "Outro" ? customDeckNome || "Meu Baralho" : selectedDeck || "Meu Baralho"}
                      playerName={nome}
                      popId={popId}
                      protocolo={successData.protocolo}
                      eventName={config.premierNome || "Liga Atlântica TCG"}
                      rawText={decklistRaw}
                    />
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

                {/* Banner de Sessão Ativa / Auto-Preenchimento / Inscrição Existente */}
                {existingRegistration ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-3.5 text-xs text-blue-300 shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white flex flex-wrap items-center gap-1.5 truncate">
                        <span>Inscrição Existente Detectada</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                          {existingRegistration.protocolo || "Confirmada"}
                        </span>
                      </p>
                      <p className="text-[11px] text-blue-300/80 truncate">
                        Você já possui vaga garantida! Altere seu deck, lista ou dados e salve abaixo.
                      </p>
                    </div>
                  </div>
                ) : loggedInUser ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white flex flex-wrap items-center gap-1.5 truncate">
                        <span>{loggedInUser.nome}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                          POP ID: {loggedInUser.popId}
                        </span>
                      </p>
                      <p className="text-[11px] text-emerald-300/80 truncate">
                        Login ativo: seus dados foram carregados para facilitar sua inscrição ⚡
                      </p>
                    </div>
                  </div>
                ) : null}

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

                  {/* Data de Nascimento / Categoria & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Data de Nascimento *</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dataNascimento}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Categoria Play!</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Auto-definida</span>
                      </label>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as any)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="Master">Master (Nascidos até 2009)</option>
                        <option value="Senior">Senior (2010 a 2013)</option>
                        <option value="Junior">Junior (2014 ou posterior)</option>
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


                  {/* Baralho / Arquétipo do Deck (Menu de Escolha) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-blue-400" />
                        Baralho / Arquétipo do Deck *
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {deckCatalogList.length} opções disponíveis
                      </span>
                    </label>
                    <select
                      required
                      value={selectedDeck}
                      onChange={(e) => setSelectedDeck(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Selecione o Baralho / Deck --</option>
                      {deckCatalogList.map((deck) => (
                        <option key={deck} value={deck}>
                          {deck}
                        </option>
                      ))}
                      <option value="Outro">➕ Outro (Digitar manualmente...)</option>
                    </select>

                    {selectedDeck === "Outro" && (
                      <div className="pt-1.5">
                        <input
                          type="text"
                          required
                          value={customDeckNome}
                          onChange={(e) => setCustomDeckNome(e.target.value)}
                          placeholder="Digite o nome do baralho / arquétipo..."
                          className="w-full rounded-xl border border-blue-500/50 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>


                  {/* Link do Limitless (Importador Automático) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                        Importar via Link do Limitless (Opcional)
                      </span>
                      <span className="text-[10px] text-blue-400 font-semibold">Preenchimento Automático</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={limitlessUrl}
                        onChange={(e) => {
                          setLimitlessUrl(e.target.value);
                          if (e.target.value.includes("limitlesstcg.com/decks/list/")) {
                            handleFetchLimitless(e.target.value);
                          }
                        }}
                        placeholder="https://limitlesstcg.com/decks/list/..."
                        className="flex-1 rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchLimitless()}
                        disabled={isFetchingLimitless || !limitlessUrl.trim()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-md"
                      >
                        {isFetchingLimitless ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Puxando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Puxar 60 Cartas</span>
                          </>
                        )}
                      </button>
                    </div>
                    {limitlessFetchError && (
                      <p className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {limitlessFetchError}
                      </p>
                    )}
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
                      onChange={(e) => handleDecklistChange(e.target.value)}
                      placeholder={`Cole a lista exportada do Pokémon TCG Live ou Limitless:\nExemplo:\n4 Dragapult ex TWM 130\n2 Drakloak TWM 129\n4 Arven OBF 186\n...`}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Visualizador Gráfico de Cartas com Artes Oficiais em Tempo Real */}
                  {parsedDeckData.totalCards > 0 && (
                    <div className="space-y-1.5 pt-1 animate-fadeIn">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-300">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          Visualização Oficial do Baralho (60 Cartas)
                        </span>
                        <span className="text-[10px] text-slate-400">Artes oficiais carregadas</span>
                      </label>
                      <DecklistVisualGallery
                        parsedData={parsedDeckData}
                        deckName={selectedDeck === "Outro" ? customDeckNome || "Baralho Personalizado" : selectedDeck || "Baralho do Jogador"}
                        playerName={nome || "Treinador"}
                        popId={popId}
                        eventName={config.premierNome || "Liga Atlântica TCG"}
                        rawText={decklistRaw}
                      />
                    </div>
                  )}

                  {/* Escolha da Forma de Pagamento */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        Forma de Pagamento da Inscrição *
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {config.premierValor ? `R$ ${config.premierValor}` : "Escolha a opção"}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Opção 1: PIX Antecipado */}
                      <button
                        type="button"
                        onClick={() => setMetodoPagamento("pix")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          metodoPagamento === "pix"
                            ? "bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400"
                            : "bg-slate-900/80 border-white/10 hover:border-white/20 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QrCode className={`h-4 w-4 ${metodoPagamento === "pix" ? "text-emerald-400" : "text-slate-400"}`} />
                            <span className={`text-xs font-black ${metodoPagamento === "pix" ? "text-white" : "text-slate-300"}`}>
                              PIX Antecipado
                            </span>
                          </div>
                          <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                            metodoPagamento === "pix"
                              ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black"
                              : "border-white/20"
                          }`}>
                            {metodoPagamento === "pix" ? "✓" : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Pague online e envie o comprovante para garantir sua vaga de imediato.
                        </p>
                      </button>

                      {/* Opção 2: Pagar no Local */}
                      <button
                        type="button"
                        onClick={() => setMetodoPagamento("presencial")}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          metodoPagamento === "presencial"
                            ? "bg-blue-500/15 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400"
                            : "bg-slate-900/80 border-white/10 hover:border-white/20 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className={`h-4 w-4 ${metodoPagamento === "presencial" ? "text-blue-400" : "text-slate-400"}`} />
                            <span className={`text-xs font-black ${metodoPagamento === "presencial" ? "text-white" : "text-slate-300"}`}>
                              No Dia do Evento
                            </span>
                          </div>
                          <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                            metodoPagamento === "presencial"
                              ? "bg-blue-500 border-blue-400 text-white font-black"
                              : "border-white/20"
                          }`}>
                            {metodoPagamento === "presencial" ? "✓" : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Pague presencialmente na recepção antes do início da Rodada 1.
                        </p>
                      </button>
                    </div>
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
                      ) : existingRegistration ? (
                        <>
                          <Sparkles className="h-4 w-4 text-blue-300" />
                          <span>Salvar Alterações na Inscrição</span>
                        </>
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
