"use client";

import { useState, useEffect } from "react";
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
  Trophy,
  BookOpen,
  Gamepad2,
  ExternalLink,
  Shield,
  QrCode,
  Printer,
  Globe,
  GraduationCap,
  Building,
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
    subtitle: "Standard Play! Pokémon",
    format: "Fase Única (Regulamento Play! Pokémon)",
    tagColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/30",
    borderHover: "hover:border-amber-500/50",
    accentHex: "#f59e0b",
    description: "Torneio Standard oficial e bancadas práticas com decks guiados para iniciantes.",
  },
  {
    id: "yugioh",
    name: "Yu-Gi-Oh! TCG",
    subtitle: "Advanced Format Konami",
    format: "Fase Única (Advanced Format Konami)",
    tagColor: "text-purple-400",
    badgeBg: "bg-purple-500/10 border-purple-500/30",
    borderHover: "hover:border-purple-500/50",
    accentHex: "#a855f7",
    description: "Duelos avançados, mesas de treino e suporte técnico da Atlântica Mais.",
  },
  {
    id: "onepiece",
    name: "One Piece Card Game",
    subtitle: "Standard Oficial Bandai",
    format: "Fase Única (Standard Bandai)",
    tagColor: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/30",
    borderHover: "hover:border-rose-500/50",
    accentHex: "#f43f5e",
    description: "Batalhas com líderes e piratas, além de oficinas com regras básicas.",
  },
  {
    id: "digimon",
    name: "Digimon Card Game",
    subtitle: "Standard Digital Bandai",
    format: "Fase Única (Standard Digital)",
    tagColor: "text-blue-400",
    badgeBg: "bg-blue-500/10 border-blue-500/30",
    borderHover: "hover:border-blue-500/50",
    accentHex: "#3b82f6",
    description: "Partidas no Digi-World com árbitros dedicados e demonstrações de jogo.",
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
    description: "O novo card game estratégico de Runeterra com demonstrações guiadas.",
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
    descricao: "Início dos torneios e bancadas de oficinas didáticas",
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
    descricao: "Rodadas eliminatórias e oficinas para novos jogadores",
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
    descricao: "Finais dos torneios, premiações e encerramento",
    accentBorder: "border-amber-500/50",
    accentBg: "bg-amber-950/40",
    accentText: "text-amber-300",
  },
];

export function FincRegistrationView({ initialProtocol }: { initialProtocol?: string }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [tipoParticipante, setTipoParticipante] = useState<"externo" | "unef" | "unifan" | "outra">("externo");

  // Torneios selecionados por ordem de clique (máx 3): 1ª, 2ª e 3ª opção
  const [torneioJogos, setTorneioJogos] = useState<string[]>(["pokemon"]);
  // Termo de responsabilidade obrigatório para cada torneio selecionado
  const [termosTorneio, setTermosTorneio] = useState<Record<string, boolean>>({
    pokemon: false,
  });

  // Oficinas selecionadas por ordem de clique (máx 3): 1ª, 2ª e 3ª opção
  const [oficinaJogos, setOficinaJogos] = useState<string[]>([]);

  const [selectedTurnos, setSelectedTurnos] = useState<string[]>(["21_noite", "22_tarde", "22_noite"]);
  const [observacoes, setObservacoes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedData, setConfirmedData] = useState<{
    protocolo: string;
    nome: string;
    whatsappLink: string;
    jogos: string[];
    torneioJogos?: string[];
    oficinaJogos?: string[];
    turnos: string[];
    tipoParticipante: "externo" | "unef" | "unifan" | "outra";
    intencao?: string;
    possuiDeck?: string;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const getGameName = (id: string) => {
    const match = TCG_OPTIONS.find((t) => t.id === id);
    return match ? match.name : id;
  };

  // Alterna jogo de Torneio (adiciona ou remove, limite de 3)
  const toggleTorneioGame = (id: string) => {
    setErrorMessage("");
    if (torneioJogos.includes(id)) {
      setTorneioJogos((prev) => prev.filter((g) => g !== id));
      setTermosTorneio((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      if (torneioJogos.length >= 3) {
        setErrorMessage("Você já selecionou o limite de 3 opções para torneios. Desmarque uma para escolher outra.");
        return;
      }
      setTorneioJogos((prev) => [...prev, id]);
      setTermosTorneio((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Alterna o termo de responsabilidade de um jogo de torneio
  const handleToggleTermo = (tcgId: string) => {
    setErrorMessage("");
    setTermosTorneio((prev) => ({
      ...prev,
      [tcgId]: !prev[tcgId],
    }));
  };

  // Alterna jogo de Oficina (adiciona ou remove, limite de 3)
  const toggleOficinaGame = (id: string) => {
    setErrorMessage("");
    if (oficinaJogos.includes(id)) {
      setOficinaJogos((prev) => prev.filter((g) => g !== id));
    } else {
      if (oficinaJogos.length >= 3) {
        setErrorMessage("Você já selecionou o limite de 3 opções para oficinas. Desmarque uma para escolher outra.");
        return;
      }
      setOficinaJogos((prev) => [...prev, id]);
    }
  };

  // Carrega protocolo caso venha via URL (ex: scan do QR code ou link direto)
  useEffect(() => {
    if (initialProtocol && initialProtocol.trim() !== "") {
      fetch(`/api/finc?protocolo=${encodeURIComponent(initialProtocol.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.inscricao) {
            const ins = data.inscricao;
            let parsedGames: string[] = [];
            let tJogos: string[] = [];
            let oJogos: string[] = [];
            let parsedDays: string[] = [];
            try {
              const parsed = JSON.parse(ins.jogos || "[]");
              if (Array.isArray(parsed)) {
                parsedGames = parsed;
              } else if (parsed && typeof parsed === "object") {
                tJogos = parsed.torneio || [];
                oJogos = parsed.oficinas || [];
                parsedGames = parsed.lista || [...tJogos, ...oJogos];
              }
            } catch {
              parsedGames = [ins.jogos];
            }
            try {
              parsedDays = JSON.parse(ins.dias || "[]");
            } catch {
              parsedDays = [ins.dias];
            }

            setConfirmedData({
              protocolo: ins.protocolo,
              nome: ins.nome,
              whatsappLink: `https://wa.me/5575992683072?text=${encodeURIComponent(
                `Olá! Segue minha credencial confirmada da Arena Geek TCG (FINC 2026):\n\n🎫 *Protocolo:* ${ins.protocolo}\n👤 *Nome:* ${ins.nome}`
              )}`,
              jogos: parsedGames,
              torneioJogos: tJogos,
              oficinaJogos: oJogos,
              turnos: parsedDays,
              tipoParticipante: (ins.tipoParticipante as any) || "externo",
              intencao: ins.intencao || "torneio",
              possuiDeck: ins.possuiDeck || "sim",
            });
          }
        })
        .catch(() => {});
    }
  }, [initialProtocol]);

  const formatPhoneInput = (val: string) => {
    const numbers = val.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhoneInput(e.target.value));
  };

  const toggleTurno = (id: string) => {
    setSelectedTurnos((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id]
    );
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

    if (torneioJogos.length === 0 && oficinaJogos.length === 0) {
      setErrorMessage("Por favor, selecione ao menos um Card Game em Torneio ou Oficina.");
      return;
    }

    // Validação estrita do termo de responsabilidade de cada torneio selecionado:
    for (const tcg of torneioJogos) {
      if (!termosTorneio[tcg]) {
        setErrorMessage(
          `Termo Obrigatório: Assine a confirmação de deck próprio no card de ${getGameName(
            tcg
          )} para homologar sua vaga no torneio.`
        );
        return;
      }
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
          jogosTorneio: torneioJogos,
          jogosOficina: oficinaJogos,
          termosTorneio,
          jogos: [...new Set([...torneioJogos, ...oficinaJogos])],
          dias: selectedTurnos,
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
        jogos: [...new Set([...torneioJogos, ...oficinaJogos])],
        torneioJogos,
        oficinaJogos,
        turnos: selectedTurnos,
        tipoParticipante,
        intencao: torneioJogos.length > 0 && oficinaJogos.length > 0 ? "ambos" : torneioJogos.length > 0 ? "torneio" : "oficina_aprender",
        possuiDeck: torneioJogos.length > 0 ? "sim" : "nao",
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
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* 1. HERO BANNER PRINCIPAL (DIRETO E SEM REDUNDÂNCIAS) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          {/* Marcas Principais: FINC 2026 + Arena Geek */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pb-1">
            <div className="relative h-11 sm:h-13 w-auto">
              <Image
                src="/finc/finc-logo.png"
                alt="Marca Oficial FINC 2026"
                width={240}
                height={80}
                className="h-full w-auto object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                priority
              />
            </div>
            <div className="h-7 w-px bg-white/20 hidden sm:block" />
            <div className="relative h-14 sm:h-16 w-auto">
              <Image
                src="/finc/arena-geek-logo.png"
                alt="Marca Oficial Arena Geek"
                width={340}
                height={130}
                className="h-full w-auto object-contain drop-shadow-[0_0_16px_rgba(168,85,247,0.45)]"
                priority
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Inscrições Abertas • Espaço TCG Arena Geek
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              TORNEIOS & OFICINAS DE{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">
                CARD GAMES
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-normal">
              Disputas oficiais e oficinas didáticas de Pokémon TCG, Yu-Gi-Oh!, One Piece, Digimon e Riftbound.
            </p>
          </div>

          {/* Local e Realização */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 pt-2 text-xs text-slate-300 border-t border-white/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>21 e 22 de Outubro de 2026</span>
            </div>
            <span className="text-white/20 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>Cajueiro Convenções (Feira de Santana - BA)</span>
            </div>
            <span className="text-white/20 hidden sm:inline-block">•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Shield className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Gestão Técnica: <strong className="text-white">Atlântica Mais</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* CASO JÁ TENHA ENVIADO A INSCRIÇÃO: MOSTRA O PASSAPORTE DIGITAL */}
      {confirmedData ? (
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Inscrição Confirmada!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Passaporte do Jogador • Arena Geek
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Parabéns, <strong>{confirmedData.nome}</strong>! Sua presença está pré-reservada no Espaço TCG da FINC 2026.
            </p>
          </div>

          {/* CREDENCIAL FÍSICA DIGITALIZADA (CRACHÁ VIP) */}
          <div className="mx-auto max-w-md rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 text-left space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            <div className="w-16 h-2 rounded-full bg-slate-950 border border-white/20 mx-auto -mt-2 mb-2 shadow-inner" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-fuchsia-600/20 blur-2xl" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative h-6 w-auto">
                  <Image
                    src="/finc/finc-logo.png"
                    alt="FINC 2026"
                    width={80}
                    height={26}
                    className="h-full w-auto object-contain"
                  />
                </div>
                <span className="text-white/20">•</span>
                <div className="relative h-7 w-auto">
                  <Image
                    src="/finc/arena-geek-logo.png"
                    alt="Arena Geek"
                    width={100}
                    height={36}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
              <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full tracking-wider">
                TCG VIP PASS
              </span>
            </div>

            {/* BADGE TIPO DE PARTICIPANTE */}
            <div>
              {confirmedData.tipoParticipante === "externo" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 px-3 py-1.5 text-xs font-black text-cyan-200 uppercase tracking-wide">
                  <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Participante Externo • Comunidade</span>
                </div>
              ) : confirmedData.tipoParticipante === "unef" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 border border-blue-400/50 px-3 py-1.5 text-xs font-black text-blue-200 uppercase tracking-wide">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>Comunidade Acadêmica • UNEF</span>
                </div>
              ) : confirmedData.tipoParticipante === "unifan" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 border border-purple-400/50 px-3 py-1.5 text-xs font-black text-purple-200 uppercase tracking-wide">
                  <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Comunidade Acadêmica • UNIFAN</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-white/20 px-3 py-1.5 text-xs font-black text-slate-200 uppercase tracking-wide">
                  <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Visitante • Outra Instituição</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Nome do Jogador
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {confirmedData.nome}
              </h3>
            </div>

            {/* QR CODE + PROTOCOLO */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-3.5 flex flex-col sm:flex-row items-center gap-3.5">
              <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                    `https://pokefsa.vercel.app/finc?protocolo=${confirmedData.protocolo}`
                  )}`}
                  alt={`QR Code ${confirmedData.protocolo}`}
                  className="w-24 h-24 object-contain"
                />
              </div>

              <div className="flex-1 space-y-1.5 text-center sm:text-left w-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Protocolo de Acesso</span>
                <div className="text-lg font-black font-mono text-cyan-300 tracking-wider">
                  {confirmedData.protocolo}
                </div>
                <button
                  onClick={handleCopyProtocol}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DADOS DE TORNEIOS E TURNOS */}
            <div className="space-y-3 text-xs border-t border-white/10 pt-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Turnos Autorizados:</span>
                <div className="flex flex-col gap-1 mt-1">
                  {confirmedData.turnos.map((tid) => {
                    const match = TURNOS_OPTIONS.find((t) => t.id === tid);
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-slate-200"
                      >
                        <span className="font-bold text-white text-[11px]">{match?.dataExtenso || tid}</span>
                        <span className="text-cyan-300 font-mono text-[11px]">{match?.horario} ({match?.turnoNome})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Torneios com Termo Homologado */}
              {confirmedData.torneioJogos && confirmedData.torneioJogos.length > 0 && (
                <div className="space-y-1">
                  <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-400" />
                    Torneios (Ordem de Preferência):
                  </span>
                  <div className="flex flex-col gap-1">
                    {confirmedData.torneioJogos.map((j, idx) => {
                      const match = TCG_OPTIONS.find((t) => t.id === j);
                      return (
                        <div
                          key={j}
                          className="flex items-center justify-between rounded-lg bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 text-xs"
                        >
                          <span className="font-bold text-amber-200">
                            {idx + 1}ª Opção: {match?.name || j}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            Deck Homologado ✅
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Oficinas Didáticas */}
              {confirmedData.oficinaJogos && confirmedData.oficinaJogos.length > 0 && (
                <div className="space-y-1">
                  <span className="text-cyan-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-cyan-400" />
                    Oficinas (Ordem de Preferência):
                  </span>
                  <div className="flex flex-col gap-1">
                    {confirmedData.oficinaJogos.map((j, idx) => {
                      const match = TCG_OPTIONS.find((t) => t.id === j);
                      return (
                        <div
                          key={j}
                          className="flex items-center justify-between rounded-lg bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 text-xs"
                        >
                          <span className="font-bold text-cyan-200">
                            {idx + 1}ª Opção: {match?.name || j}
                          </span>
                          <span className="text-[10px] text-cyan-300 font-medium bg-cyan-950/60 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                            Decks no Local
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 pt-2 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Cajueiro Convenções • FSA</span>
              <span className="text-cyan-400 font-semibold">Gestão: Atlântica Mais</span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <a
              href={confirmedData.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Confirmar Presença no WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Salvar Passaporte</span>
            </button>

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
              Nova Inscrição
            </button>
          </div>
        </section>
      ) : (
        /* 2. FORMULÁRIO DE INSCRIÇÃO COM CAIXINHAS INTERATIVAS */
        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 sm:space-y-8">
          <div className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
              <Gamepad2 className="h-4 w-4" />
              Credenciamento Oficial
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Selecione suas preferências e turnos
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* ETAPA 1: TORNEIOS COMPETITIVOS (CAIXINHAS COM 1ª, 2ª E 3ª OPÇÃO) */}
            <div className="space-y-3.5 rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-slate-950 p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                    <Trophy className="h-4 w-4" />
                    <span>1. Torneios Competitivos (Até 3 Opções)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Exclusivo para quem possui <strong>deck próprio no formato padrão</strong>. A ordem do clique define sua 1ª, 2ª e 3ª preferência.
                  </p>
                </div>
                <span className="text-[11px] text-amber-300/80 font-medium whitespace-nowrap">
                  ⚠️ Sujeito a ajustes no cronograma
                </span>
              </div>

              {/* GRID DAS CAIXINHAS DE TORNEIO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TCG_OPTIONS.map((game) => {
                  const idx = torneioJogos.indexOf(game.id);
                  const isSelected = idx !== -1;
                  const isSigned = !!termosTorneio[game.id];

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleTorneioGame(game.id)}
                      className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 border-amber-400/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                          : `bg-slate-950/70 border-white/10 ${game.borderHover} hover:bg-slate-800/40`
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-200"}`}>
                              {game.name}
                            </h4>
                            <span className={`text-[11px] font-bold ${game.tagColor}`}>
                              {game.subtitle}
                            </span>
                          </div>

                          {isSelected ? (
                            <span className="shrink-0 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-sm">
                              {idx === 0 ? "🥇 1ª Opção" : idx === 1 ? "🥈 2ª Opção" : "🥉 3ª Opção"}
                            </span>
                          ) : (
                            <div className="h-5 w-5 rounded-md border border-white/20 bg-slate-800/40 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {game.description}
                        </p>
                      </div>

                      {/* TERMO OBRIGATÓRIO DENTRO DA CAIXINHA */}
                      {isSelected && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTermo(game.id);
                          }}
                          className={`mt-3 flex items-center gap-2 rounded-xl border p-2 text-xs transition-all cursor-pointer ${
                            isSigned
                              ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-300"
                              : "border-rose-500/70 bg-rose-950/40 text-rose-200 hover:bg-rose-950/60 ring-1 ring-rose-500/40"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-all ${
                              isSigned
                                ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                : "border-rose-400 bg-slate-900"
                            }`}
                          >
                            {isSigned && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] font-bold leading-tight">
                            {isSigned ? "Termo assinado: Tenho deck padrão ✅" : "Assinar termo: Tenho deck padrão *"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETAPA 2: OFICINAS DIDÁTICAS (CAIXINHAS COM 1ª, 2ª E 3ª OPÇÃO) */}
            <div className="space-y-3.5 rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-cyan-950/20 via-slate-900/60 to-slate-950 p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
                    <BookOpen className="h-4 w-4" />
                    <span>2. Oficinas Didáticas (Até 3 Opções)</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Para novatos ou sem deck próprio. <strong>Decks de demonstração e monitores disponíveis no local.</strong>
                  </p>
                </div>
                <span className="text-[11px] text-cyan-300/80 font-medium whitespace-nowrap">
                  ⚠️ Sujeito a ajustes no cronograma
                </span>
              </div>

              {/* GRID DAS CAIXINHAS DE OFICINAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {TCG_OPTIONS.map((game) => {
                  const idx = oficinaJogos.indexOf(game.id);
                  const isSelected = idx !== -1;

                  return (
                    <div
                      key={game.id}
                      onClick={() => toggleOficinaGame(game.id)}
                      className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 border-cyan-400/90 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50"
                          : `bg-slate-950/70 border-white/10 ${game.borderHover} hover:bg-slate-800/40`
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={`text-sm font-black ${isSelected ? "text-white" : "text-slate-200"}`}>
                              {game.name}
                            </h4>
                            <span className={`text-[11px] font-bold ${game.tagColor}`}>
                              {game.subtitle}
                            </span>
                          </div>

                          {isSelected ? (
                            <span className="shrink-0 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-sm">
                              {idx === 0 ? "1ª Opção" : idx === 1 ? "2ª Opção" : "3ª Opção"}
                            </span>
                          ) : (
                            <div className="h-5 w-5 rounded-md border border-white/20 bg-slate-800/40 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {game.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded-xl">
                          <Sparkles className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span>Decks da organização disponíveis</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ETAPA 3: TURNOS DE PRESENÇA (CAIXINHAS) */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-sm font-black text-white uppercase tracking-wider">
                  3. Em quais turnos você comparecerá? *
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique diretamente nas caixinhas para marcar ou desmarcar seus turnos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TURNOS_OPTIONS.map((turno) => {
                  const isSelected = selectedTurnos.includes(turno.id);
                  return (
                    <div
                      key={turno.id}
                      onClick={() => toggleTurno(turno.id)}
                      className={`rounded-2xl border p-4 cursor-pointer transition-all flex flex-col justify-between gap-2.5 select-none ${
                        isSelected
                          ? `${turno.accentBorder} ${turno.accentBg} text-white ring-1 ring-cyan-400/40 shadow-lg`
                          : "border-white/10 bg-slate-950/60 text-slate-400 hover:bg-slate-800/30"
                      }`}
                    >
                      <div className="space-y-1">
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

            {/* ETAPA 4: DADOS DE CONTATO */}
            <div className="space-y-3.5 pt-2 border-t border-white/10">
              <label className="block text-sm font-black text-white uppercase tracking-wider">
                4. Seus Dados de Identificação
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">WhatsApp (com DDD) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(75) 99999-9999"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vínculo / Tipo de Participante</label>
                  <select
                    value={tipoParticipante}
                    onChange={(e: any) => setTipoParticipante(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="externo">Público Externo / Comunidade Geral</option>
                    <option value="unef">Aluno(a) ou Egresso(a) UNEF</option>
                    <option value="unifan">Aluno(a) ou Egresso(a) UNIFAN</option>
                    <option value="outra">Estudante de outra Instituição</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Observações adicionais (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Alguma dúvida ou informação sobre seu deck..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none"
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
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 py-3.5 px-6 text-sm sm:text-base font-black text-white shadow-xl shadow-cyan-600/20 transition-all transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gerando passaporte...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Confirmar Inscrição na Arena Geek TCG</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Inscrição 100% gratuita. Seu passaporte e QR Code são gerados na hora.
              </p>
            </div>
          </form>
        </section>
      )}

      {/* FOOTER EXCLUSIVO DA ARENA GEEK & FINC */}
      <footer className="border-t border-white/10 pt-5 pb-8 text-center space-y-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 font-semibold">
          <span>FINC 2026 • Feira Internacional do Conhecimento</span>
          <span className="text-white/20">•</span>
          <span>Arena Geek • Espaço TCG</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Realização: UNEF & UNIFAN (Grupo Nobre) • Gestão Técnica: Atlântica Mais
        </p>
      </footer>
    </div>
  );
}
