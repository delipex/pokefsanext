"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Users,
  Trophy,
  BookOpen,
  Gamepad2,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";

interface TcgGameOption {
  id: string;
  name: string;
  subtitle: string;
  format: string;
  tagColor: string;
  badgeBg: string;
  borderHover: string;
  accentHex: string;
  description: string;
}

const TCG_OPTIONS: TcgGameOption[] = [
  {
    id: "pokemon",
    name: "Pokémon TCG",
    subtitle: "Standard Oficial & Oficinas",
    format: "Fase Única (Regulamento Play! Pokémon)",
    tagColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30",
    borderHover: "hover:border-amber-500/50",
    accentHex: "#f59e0b",
    description: "Torneio Standard oficial e bancadas de oficinas práticas para iniciantes com decks guiados.",
  },
  {
    id: "yugioh",
    name: "Yu-Gi-Oh! TCG",
    subtitle: "Formato Avançado & Iniciação",
    format: "Fase Única (Advanced Format Konami)",
    tagColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/30",
    borderHover: "hover:border-purple-500/50",
    accentHex: "#a855f7",
    description: "Mesas de duelo avançado, partidas casuais e suporte técnico da Atlântica Mais.",
  },
  {
    id: "onepiece",
    name: "One Piece Card Game",
    subtitle: "Formato Oficial Bandai",
    format: "Fase Única (Standard Bandai)",
    tagColor: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/30",
    borderHover: "hover:border-rose-500/50",
    accentHex: "#f43f5e",
    description: "Duelos na Grand Line com líderes e piratas, além de espaço para aprender as regras básicas.",
  },
  {
    id: "digimon",
    name: "Digimon Card Game",
    subtitle: "Formato Oficial Bandai",
    format: "Fase Única (Standard Digital)",
    tagColor: "text-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    borderHover: "hover:border-blue-500/50",
    accentHex: "#3b82f6",
    description: "Evolua seus monstros no Digi-World com árbitros dedicados e partidas empolgantes.",
  },
  {
    id: "riftbound",
    name: "Riftbound TCG",
    subtitle: "League of Legends TCG",
    format: "Fase Única (Oficial)",
    tagColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30",
    borderHover: "hover:border-emerald-500/50",
    accentHex: "#10b981",
    description: "O novo card game estratégico de Runeterra com demonstrações guiadas e partidas abertas.",
  },
];

interface TurnoItem {
  id: string;
  diaNumero: string;
  diaSemana: string;
  dataExtenso: string;
  turnoNome: string;
  horario: string;
  descricao: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
}

const TURNOS_OPTIONS: TurnoItem[] = [
  {
    id: "21_noite",
    diaNumero: "21",
    diaSemana: "Quarta-feira",
    dataExtenso: "21 de Outubro",
    turnoNome: "Turno Noite",
    horario: "17:00 às 22:00",
    descricao: "Início dos torneios oficiais e bancadas de oficinas didáticas",
    accentBorder: "border-cyan-500/50",
    accentBg: "bg-cyan-950/40",
    accentText: "text-cyan-300",
  },
  {
    id: "22_tarde",
    diaNumero: "22",
    diaSemana: "Quinta-feira",
    dataExtenso: "22 de Outubro",
    turnoNome: "Turno Tarde",
    horario: "14:00 às 18:00",
    descricao: "Rodadas eliminatórias, free play e demonstrações para novatos",
    accentBorder: "border-fuchsia-500/50",
    accentBg: "bg-fuchsia-950/40",
    accentText: "text-fuchsia-300",
  },
  {
    id: "22_noite",
    diaNumero: "22",
    diaSemana: "Quinta-feira",
    dataExtenso: "22 de Outubro",
    turnoNome: "Turno Noite",
    horario: "18:00 às 20:00",
    descricao: "Finais dos torneios, premiações e encerramento da Arena Geek",
    accentBorder: "border-amber-500/50",
    accentBg: "bg-amber-950/40",
    accentText: "text-amber-300",
  },
];

export function FincRegistrationView() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [tipoParticipante, setTipoParticipante] = useState<"externo" | "unef" | "unifan" | "outra">("externo");
  const [selectedGames, setSelectedGames] = useState<string[]>(["pokemon"]);
  const [selectedTurnos, setSelectedTurnos] = useState<string[]>(["21_noite", "22_tarde", "22_noite"]);
  const [intencao, setIntencao] = useState<"torneio" | "casual" | "oficina_aprender">("torneio");
  const [possuiDeck, setPossuiDeck] = useState<"sim" | "nao" | "preciso_demo">("sim");
  const [observacoes, setObservacoes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedData, setConfirmedData] = useState<{
    protocolo: string;
    nome: string;
    whatsappLink: string;
    jogos: string[];
    turnos: string[];
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const formatPhoneInput = (val: string) => {
    const numbers = val.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhoneInput(e.target.value));
  };

  const toggleGame = (id: string) => {
    setSelectedGames((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((g) => g !== id) : prev) : [...prev, id]
    );
  };

  const toggleTurno = (id: string) => {
    setSelectedTurnos((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id]
    );
  };

  const selectAllTurnos = () => {
    setSelectedTurnos(["21_noite", "22_tarde", "22_noite"]);
  };

  const selectOnly21 = () => {
    setSelectedTurnos(["21_noite"]);
  };

  const selectOnly22 = () => {
    setSelectedTurnos(["22_tarde", "22_noite"]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!nome.trim() || nome.trim().length < 3) {
      setErrorMessage("Por favor, preencha seu nome completo.");
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Por favor, digite um WhatsApp válido com DDD.");
      return;
    }

    if (selectedGames.length === 0) {
      setErrorMessage("Selecione ao menos um Card Game de seu interesse.");
      return;
    }

    if (selectedTurnos.length === 0) {
      setErrorMessage("Selecione ao menos um turno de participação.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: cleanPhone,
          email: email.trim(),
          tipoParticipante,
          jogos: selectedGames,
          dias: selectedTurnos,
          intencao,
          possuiDeck,
          observacoes: observacoes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao realizar inscrição.");
      }

      setConfirmedData({
        protocolo: data.protocolo,
        nome: nome.trim(),
        whatsappLink: data.whatsappLink,
        jogos: selectedGames,
        turnos: selectedTurnos,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyProtocol = () => {
    if (!confirmedData) return;
    navigator.clipboard.writeText(confirmedData.protocolo);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
      {/* 1. HERO BANNER PRINCIPAL (CENTRALIZADO, SEM DUPLICIDADE) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
        {/* Efeitos de Luz Atmosférica Neon */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          {/* Marcas Principais em Destaque Central */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pb-2">
            <div className="relative h-12 sm:h-14 w-auto">
              <Image
                src="/finc/finc-logo.png"
                alt="Marca Oficial FINC 2026"
                width={260}
                height={85}
                className="h-full w-auto object-contain drop-shadow-[0_0_14px_rgba(6,182,212,0.45)]"
                priority
              />
            </div>
            <div className="h-8 w-px bg-white/20 hidden sm:block" />
            <div className="relative h-16 sm:h-20 w-auto">
              <Image
                src="/finc/arena-geek-logo.png"
                alt="Marca Oficial Arena Geek"
                width={380}
                height={150}
                className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(168,85,247,0.5)]"
                priority
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-300 shadow-sm">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Inscrições Abertas • Espaço TCG Atlântica +Mais
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
              TORNEIOS & OFICINAS DE{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
                CARD GAMES
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              Participe das disputas e oficinas de <strong>Pokémon TCG, Yu-Gi-Oh!, One Piece, Digimon e Riftbound</strong> no 
              Espaço TCG da Arena Geek durante a <strong>FINC 2026</strong>.
            </p>
          </div>

          {/* Informações Centrais de Local, Data e Realização */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-xs text-slate-300 border-t border-white/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>21 e 22 de Outubro de 2026</span>
            </div>
            <span className="text-white/20 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Arena Geek • Cajueiro Convenções (Feira de Santana - BA)</span>
            </div>
            <span className="text-white/20 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Shield className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Gestão Técnica & Arbitragem: <strong className="text-white">Atlântica Mais</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* CASO JÁ TENHA ENVIADO A INSCRIÇÃO: MOSTRA O PASSAPORTE DIGITAL */}
      {confirmedData ? (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-2">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-black">
              Inscrição Homologada com Sucesso!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Passaporte do Jogador • Arena Geek
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Parabéns, <strong>{confirmedData.nome}</strong>! Sua presença está pré-reservada no Espaço TCG da FINC 2026.
            </p>
          </div>

          {/* Ticket Visual */}
          <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-cyan-500/40 bg-slate-900/90 p-5 text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/finc/finc-logo.png"
                  alt="FINC"
                  width={80}
                  height={26}
                  className="h-6 w-auto object-contain"
                />
                <span className="text-white/20">•</span>
                <Image
                  src="/finc/arena-geek-logo.png"
                  alt="Arena Geek"
                  width={100}
                  height={35}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                Credencial
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Protocolo Oficial</span>
                <div className="text-lg font-black font-mono text-cyan-300">{confirmedData.protocolo}</div>
              </div>
              <button
                onClick={handleCopyProtocol}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
              >
                {hasCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Turnos Selecionados:</span>
                <div className="flex flex-col gap-1 mt-1">
                  {confirmedData.turnos.map((tid) => {
                    const match = TURNOS_OPTIONS.find((t) => t.id === tid);
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-slate-200"
                      >
                        <span className="font-bold">{match?.dataExtenso || tid}</span>
                        <span className="text-cyan-300 font-mono text-[11px]">{match?.horario} ({match?.turnoNome})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Card Games:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {confirmedData.jogos.map((j) => {
                    const match = TCG_OPTIONS.find((t) => t.id === j);
                    return (
                      <span
                        key={j}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      >
                        {match?.name || j}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={confirmedData.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Confirmar Presença no WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>

            <button
              onClick={() => {
                setConfirmedData(null);
                setNome("");
                setWhatsapp("");
                setEmail("");
                setObservacoes("");
              }}
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              Fazer outra inscrição
            </button>
          </div>
        </section>
      ) : (
        /* 2. FORMULÁRIO DE INSCRIÇÃO */
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
          <div className="border-b border-white/10 pb-5">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
              <Gamepad2 className="h-4 w-4" />
              Formulário Oficial de Credenciamento
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Escolha seus Card Games e Turnos de Presença
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Preencha os dados abaixo. O número de mesas e vagas dos torneios será dimensionado por demanda de inscritos pela equipe da Atlântica Mais.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ETAPA 1: ESCOLHA DOS JOGOS (TCGS) */}
            <div className="space-y-4">
              <label className="block text-sm font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>1. Quais TCGs você tem interesse em participar? *</span>
                <span className="text-xs text-slate-400 normal-case font-normal">(Pode marcar mais de um)</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {TCG_OPTIONS.map((game) => {
                  const isSelected = selectedGames.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleGame(game.id)}
                      className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? `bg-slate-800/90 border-cyan-400/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40`
                          : `bg-slate-950/60 border-white/10 ${game.borderHover} hover:bg-slate-800/40`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-200"}`}>
                            {game.name}
                          </h3>
                          <span className={`text-[11px] font-bold ${game.tagColor}`}>
                            {game.subtitle}
                          </span>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? "bg-cyan-500 border-cyan-400 text-slate-950 font-black"
                              : "border-white/20 bg-slate-800/40"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                        {game.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETAPA 2: SEPARAÇÃO DE TURNOS NAS DATAS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-sm font-black text-white uppercase tracking-wider">
                  2. Em quais turnos você comparecerá? *
                </label>

                {/* Atalhos de Seleção Rápida */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={selectAllTurnos}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
                  >
                    Todos os Turnos
                  </button>
                  <button
                    type="button"
                    onClick={selectOnly21}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 cursor-pointer transition-colors"
                  >
                    Apenas 21 (Noite)
                  </button>
                  <button
                    type="button"
                    onClick={selectOnly22}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/40 hover:bg-fuchsia-900/40 text-fuchsia-300 cursor-pointer transition-colors"
                  >
                    Apenas 22 (Tarde/Noite)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TURNOS_OPTIONS.map((turno) => {
                  const isSelected = selectedTurnos.includes(turno.id);
                  return (
                    <div
                      key={turno.id}
                      onClick={() => toggleTurno(turno.id)}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between gap-3 select-none ${
                        isSelected
                          ? `${turno.accentBorder} ${turno.accentBg} text-white ring-1 ring-cyan-400/40 shadow-lg`
                          : "border-white/10 bg-slate-950/60 text-slate-400 hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">{turno.diaSemana}</span>
                          <div
                            className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                              isSelected
                                ? "bg-cyan-500 border-cyan-400 text-slate-950 font-black"
                                : "border-white/20 bg-slate-800/40"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="font-black text-sm text-white">
                          {turno.dataExtenso}
                        </div>

                        <div className={`text-xs font-bold ${turno.accentText} flex items-center gap-1`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{turno.turnoNome} ({turno.horario})</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-snug border-t border-white/5 pt-2">
                        {turno.descricao}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETAPA 3: MODALIDADE & SITUAÇÃO DO DECK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Qual é o seu objetivo no evento?
                </label>
                <select
                  value={intencao}
                  onChange={(e: any) => setIntencao(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="torneio">Quero disputar o Torneio Competitivo</option>
                  <option value="casual">Jogar Free Play / Casual com outros players</option>
                  <option value="oficina_aprender">Quero aprender a jogar do zero (Oficinas Práticas)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">
                  Você já possui Deck montado?
                </label>
                <select
                  value={possuiDeck}
                  onChange={(e: any) => setPossuiDeck(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="sim">Sim, levarei meu próprio deck</option>
                  <option value="nao">Não tenho deck (vou para aprender / demonstração)</option>
                  <option value="preciso_demo">Preciso de deck emprestado / oficina didática</option>
                </select>
              </div>
            </div>

            {/* ETAPA 4: DADOS DE CONTATO */}
            <div className="space-y-4 pt-2 border-t border-white/10">
              <label className="block text-sm font-black text-white uppercase tracking-wider">
                3. Seus Dados de Identificação
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">WhatsApp (com DDD) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(75) 99999-9999"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Vínculo / Tipo de Participante</label>
                  <select
                    value={tipoParticipante}
                    onChange={(e: any) => setTipoParticipante(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="externo">Público Externo / Comunidade Geral</option>
                    <option value="unef">Aluno(a) ou Egresso(a) UNEF</option>
                    <option value="unifan">Aluno(a) ou Egresso(a) UNIFAN</option>
                    <option value="outra">Estudante de outra Instituição</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Observações adicionais (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Alguma dúvida, necessidade especial ou informação sobre seu deck..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
                />
              </div>
            </div>

            {/* FEEDBACK DE ERRO */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* BOTÃO SUBMIT */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 py-4 px-6 text-sm sm:text-base font-black text-white shadow-xl shadow-cyan-600/20 transition-all transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando sua credencial...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Garantir Minha Vaga na Arena Geek TCG</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2.5">
                Inscrição 100% gratuita. Ao enviar, você receberá um protocolo oficial e confirmação imediata.
              </p>
            </div>
          </form>
        </section>
      )}

      {/* 3. INFORMAÇÕES E REGULAMENTO OFICIAL */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="h-4 w-4" />
          Regulamento & Gestão Oficial
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white">
          Como funcionará o Espaço TCG na FINC 2026
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-1.5 text-cyan-300">
              <Trophy className="h-4 w-4 text-amber-400" />
              Torneios em Fase Única
            </div>
            <p className="text-slate-400 leading-relaxed">
              Disputas oficiais sob diretrizes oficiais de cada TCG. O número de rodadas e corte de mesas será ajustado dinamicamente para acomodar todos os inscritos.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-1.5 text-cyan-300">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              Oficinas de Iniciação
            </div>
            <p className="text-slate-400 leading-relaxed">
              Nunca jogou? Não tem deck? Sem problemas! Monitores e juízes da Atlântica Mais ensinarão do zero com decks de demonstração para novatos e curiosos.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-2">
            <div className="font-bold text-white text-sm flex items-center gap-1.5 text-cyan-300">
              <Shield className="h-4 w-4 text-emerald-400" />
              Arbitragem Oficial
            </div>
            <p className="text-slate-400 leading-relaxed">
              Gestão técnica e arbitragem geral conduzida por <strong>Lucas Araújo</strong> (CEO Atlântica Mais) e representantes técnicos oficiais para cada modalidade.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FOOTER EXCLUSIVO DA FINC • ARENA GEEK (SEM REFERÊNCIAS APENAS A POKÉMON) */}
      <footer className="border-t border-white/10 pt-6 pb-10 text-center space-y-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 font-semibold">
          <span>FINC 2026 • Feira Internacional do Conhecimento</span>
          <span className="text-white/20">•</span>
          <span>Arena Geek • Espaço TCG</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Realização: Centro Universitário UNEF & UNIFAN (Grupo Nobre) • Gestão Técnica: Atlântica Mais (Livraria Atlântica)
        </p>
      </footer>
    </div>
  );
}
