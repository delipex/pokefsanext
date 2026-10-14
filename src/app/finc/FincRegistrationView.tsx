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
  Users,
  Trophy,
  BookOpen,
  Gamepad2,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
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

export function FincRegistrationView({ initialProtocol }: { initialProtocol?: string }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [tipoParticipante, setTipoParticipante] = useState<"externo" | "unef" | "unifan" | "outra">("externo");
  
  // TORNEIOS: Opção 1, 2 e 3 (por ordem de preferência)
  const [torneioOp1, setTorneioOp1] = useState("pokemon");
  const [torneioOp2, setTorneioOp2] = useState("");
  const [torneioOp3, setTorneioOp3] = useState("");
  const [termosTorneio, setTermosTorneio] = useState<Record<string, boolean>>({
    pokemon: false,
  });

  // OFICINAS: Opção 1, 2 e 3 (por ordem de preferência)
  const [oficinaOp1, setOficinaOp1] = useState("");
  const [oficinaOp2, setOficinaOp2] = useState("");
  const [oficinaOp3, setOficinaOp3] = useState("");

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

  const handleToggleTermo = (tcgId: string) => {
    setTermosTorneio((prev) => ({
      ...prev,
      [tcgId]: !prev[tcgId],
    }));
  };

  const handleTorneioOp1Change = (val: string) => {
    setTorneioOp1(val);
    if (val && termosTorneio[val] === undefined) {
      setTermosTorneio((prev) => ({ ...prev, [val]: false }));
    }
    if (val && torneioOp2 === val) setTorneioOp2("");
    if (val && torneioOp3 === val) setTorneioOp3("");
  };

  const handleTorneioOp2Change = (val: string) => {
    setTorneioOp2(val);
    if (val && termosTorneio[val] === undefined) {
      setTermosTorneio((prev) => ({ ...prev, [val]: false }));
    }
    if (val && torneioOp3 === val) setTorneioOp3("");
  };

  const handleTorneioOp3Change = (val: string) => {
    setTorneioOp3(val);
    if (val && termosTorneio[val] === undefined) {
      setTermosTorneio((prev) => ({ ...prev, [val]: false }));
    }
  };

  const handleOficinaOp1Change = (val: string) => {
    setOficinaOp1(val);
    if (val && oficinaOp2 === val) setOficinaOp2("");
    if (val && oficinaOp3 === val) setOficinaOp3("");
  };

  const handleOficinaOp2Change = (val: string) => {
    setOficinaOp2(val);
    if (val && oficinaOp3 === val) setOficinaOp3("");
  };

  const handleOficinaOp3Change = (val: string) => {
    setOficinaOp3(val);
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
            let torneioJogos: string[] = [];
            let oficinaJogos: string[] = [];
            let parsedDays: string[] = [];
            try {
              const parsed = JSON.parse(ins.jogos || "[]");
              if (Array.isArray(parsed)) {
                parsedGames = parsed;
              } else if (parsed && typeof parsed === "object") {
                torneioJogos = parsed.torneio || [];
                oficinaJogos = parsed.oficinas || [];
                parsedGames = parsed.lista || [...torneioJogos, ...oficinaJogos];
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
              torneioJogos,
              oficinaJogos,
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

    const cleanTorneio = [torneioOp1, torneioOp2, torneioOp3].filter((t) => t && t.trim() !== "");
    const cleanOficina = [oficinaOp1, oficinaOp2, oficinaOp3].filter((o) => o && o.trim() !== "");

    if (cleanTorneio.length === 0 && cleanOficina.length === 0) {
      setErrorMessage("Por favor, selecione ao menos uma opção de Torneio ou de Oficina.");
      return;
    }

    // Validação OBRIGATÓRIA do termo de responsabilidade de cada torneio selecionado:
    for (const tcg of cleanTorneio) {
      if (!termosTorneio[tcg]) {
        setErrorMessage(
          `Termo Obrigatório Não Assinado: Para participar do torneio de ${getGameName(
            tcg
          )}, você deve assinar o termo de responsabilidade atestando que possui deck montado no formato padrão. Sem este termo sua inscrição é invalidada.`
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
          jogosTorneio: cleanTorneio,
          jogosOficina: cleanOficina,
          termosTorneio,
          jogos: [...new Set([...cleanTorneio, ...cleanOficina])],
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
        jogos: [...new Set([...cleanTorneio, ...cleanOficina])],
        torneioJogos: cleanTorneio,
        oficinaJogos: cleanOficina,
        turnos: selectedTurnos,
        tipoParticipante,
        intencao: cleanTorneio.length > 0 && cleanOficina.length > 0 ? "ambos" : cleanTorneio.length > 0 ? "torneio" : "oficina_aprender",
        possuiDeck: cleanTorneio.length > 0 ? "sim" : "nao",
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
        <section className="relative overflow-hidden rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Inscrição Homologada com Sucesso!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Passaporte do Jogador • Arena Geek
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
              Parabéns, <strong>{confirmedData.nome}</strong>! Sua presença está pré-reservada no Espaço TCG da FINC 2026.
            </p>
          </div>

          {/* CREDENCIAL FÍSICA DIGITALIZADA (ESTILO CRACHÁ VIP DE EVENTO) */}
          <div className="mx-auto max-w-md rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-7 text-left space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            {/* Efeito Glow e Furo do Cordão (Lanyard Slot) */}
            <div className="w-16 h-2.5 rounded-full bg-slate-950 border border-white/20 mx-auto -mt-2 mb-2 shadow-inner" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-fuchsia-600/20 blur-2xl" />

            {/* Cabeçalho da Credencial: Logos Oficiais */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-7 w-auto">
                  <Image
                    src="/finc/finc-logo.png"
                    alt="FINC 2026"
                    width={90}
                    height={30}
                    className="h-full w-auto object-contain"
                  />
                </div>
                <span className="text-white/20">•</span>
                <div className="relative h-8 w-auto">
                  <Image
                    src="/finc/arena-geek-logo.png"
                    alt="Arena Geek"
                    width={110}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
              <span className="text-[10px] uppercase font-black text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full tracking-wider">
                TCG VIP PASS
              </span>
            </div>

            {/* BADGE DESTACADA DO TIPO DE PARTICIPANTE (EXTERNO vs ALUNOS) */}
            <div>
              {confirmedData.tipoParticipante === "externo" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 px-3.5 py-2 text-xs font-black text-cyan-200 uppercase tracking-wide shadow-sm">
                  <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Participante Externo • Comunidade Geek</span>
                </div>
              ) : confirmedData.tipoParticipante === "unef" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 border border-blue-400/50 px-3.5 py-2 text-xs font-black text-blue-200 uppercase tracking-wide shadow-sm">
                  <GraduationCap className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Comunidade Acadêmica • UNEF</span>
                </div>
              ) : confirmedData.tipoParticipante === "unifan" ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 border border-purple-400/50 px-3.5 py-2 text-xs font-black text-purple-200 uppercase tracking-wide shadow-sm">
                  <GraduationCap className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>Comunidade Acadêmica • UNIFAN</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-white/20 px-3.5 py-2 text-xs font-black text-slate-200 uppercase tracking-wide shadow-sm">
                  <Building className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Visitante • Outra Instituição</span>
                </div>
              )}
            </div>

            {/* Nome do Participante */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                Nome do Jogador / Atleta
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {confirmedData.nome}
              </h3>
            </div>

            {/* QR CODE + CÓDIGO ÚNICO DE PROTOCOLO */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 flex flex-col sm:flex-row items-center gap-4">
              {/* QR Code Real Gerado para Leitura por Câmera */}
              <div className="bg-white p-2 rounded-xl shadow-lg shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    `https://pokefsa.vercel.app/finc?protocolo=${confirmedData.protocolo}`
                  )}`}
                  alt={`QR Code ${confirmedData.protocolo}`}
                  className="w-28 h-28 object-contain"
                />
              </div>

              {/* Informações de Validação & Protocolo */}
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Código Único de Protocolo</span>
                  <div className="text-lg font-black font-mono text-cyan-300 tracking-wider">
                    {confirmedData.protocolo}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  Apresente este QR Code ou protocolo na recepção do Espaço TCG para liberar seu acesso às mesas.
                </p>

                <button
                  onClick={handleCopyProtocol}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Protocolo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dados do Acesso: Turnos e Jogos */}
            <div className="space-y-3 text-xs border-t border-white/10 pt-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Turnos Autorizados:</span>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {confirmedData.turnos.map((tid) => {
                    const match = TURNOS_OPTIONS.find((t) => t.id === tid);
                    return (
                      <div
                        key={tid}
                        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-slate-200"
                      >
                        <span className="font-bold text-white">{match?.dataExtenso || tid}</span>
                        <span className="text-cyan-300 font-mono text-[11px] font-semibold">{match?.horario} ({match?.turnoNome})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Torneios com Termo Homologado */}
              {confirmedData.torneioJogos && confirmedData.torneioJogos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    Torneios Inscritos (Ordem de Preferência):
                  </span>
                  <div className="flex flex-col gap-1">
                    {confirmedData.torneioJogos.map((j, idx) => {
                      const match = TCG_OPTIONS.find((t) => t.id === j);
                      return (
                        <div
                          key={j}
                          className="flex items-center justify-between rounded-lg bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 text-xs"
                        >
                          <span className="font-bold text-amber-200">
                            {idx + 1}ª Opção: {match?.name || j}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                            Deck Próprio Homologado ✅
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Oficinas Didáticas */}
              {confirmedData.oficinaJogos && confirmedData.oficinaJogos.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-cyan-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                    Oficinas Didáticas (Ordem de Preferência):
                  </span>
                  <div className="flex flex-col gap-1">
                    {confirmedData.oficinaJogos.map((j, idx) => {
                      const match = TCG_OPTIONS.find((t) => t.id === j);
                      return (
                        <div
                          key={j}
                          className="flex items-center justify-between rounded-lg bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 text-xs"
                        >
                          <span className="font-bold text-cyan-200">
                            {idx + 1}ª Opção: {match?.name || j}
                          </span>
                          <span className="text-[10px] text-cyan-300 font-medium bg-cyan-950/60 border border-cyan-500/20 px-2 py-0.5 rounded">
                            Decks da Organização
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!confirmedData.torneioJogos || confirmedData.torneioJogos.length === 0) &&
                (!confirmedData.oficinaJogos || confirmedData.oficinaJogos.length === 0) && (
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider">Card Games Inscritos:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {confirmedData.jogos.map((j) => {
                        const match = TCG_OPTIONS.find((t) => t.id === j);
                        return (
                          <span
                            key={j}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 uppercase"
                          >
                            {match?.name || j}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Informações Adicionais */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Modalidade:</span>
                  <span className="text-white font-semibold">
                    {confirmedData.intencao === "torneio" ? "Torneio Oficial" : confirmedData.intencao === "casual" ? "Free Play / Casual" : "Oficina Didática"}
                  </span>
                </div>
                <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Deck:</span>
                  <span className="text-white font-semibold">
                    {confirmedData.possuiDeck === "sim" ? "Deck Próprio" : "Precisa Emprestado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé da Credencial */}
            <div className="border-t border-white/10 pt-3 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Cajueiro Convenções • FSA</span>
              <span className="text-cyan-400 font-semibold">Gestão: Atlântica Mais</span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO DO JOGADOR */}
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
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-slate-800 hover:bg-slate-700 px-5 py-3.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Salvar / Imprimir Passaporte</span>
            </button>

            <button
              onClick={() => {
                setConfirmedData(null);
                setNome("");
                setWhatsapp("");
                setEmail("");
                setObservacoes("");
              }}
              className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-3.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
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
            {/* ETAPA 1: TORNEIOS COMPETITIVOS */}
            <div className="space-y-5 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-slate-950 p-5 sm:p-7 shadow-xl">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                  <Trophy className="h-4 w-4" />
                  Modalidade Competitiva Oficial
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex flex-wrap items-center gap-2">
                  <span>1. Torneios Competitivos</span>
                  <span className="text-[11px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    Até 3 Opções
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Exclusivo para quem possui <strong>deck próprio regulamentado no formato padrão</strong> de cada jogo.
                </p>
              </div>

              {/* AVISO OBRIGATÓRIO DE CRONOGRAMA */}
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso Oficial de Cronograma:</strong> A escolha dos torneios é por <strong>ordem de preferência (1ª, 2ª e 3ª opção)</strong>, pois a grade oficial poderá passar por alterações e remanejamentos de horário conforme a quantidade de participantes e fluxo das mesas.
                </span>
              </div>

              {/* OPÇÃO 1 DE TORNEIO */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">1</span>
                    1ª Opção de Torneio (Principal)
                  </label>
                  {torneioOp1 && (
                    <button
                      type="button"
                      onClick={() => handleTorneioOp1Change("")}
                      className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Limpar escolha
                    </button>
                  )}
                </div>

                <select
                  value={torneioOp1}
                  onChange={(e) => handleTorneioOp1Change(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="">-- Não desejo participar de Torneio como 1ª opção --</option>
                  {TCG_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.format})
                    </option>
                  ))}
                </select>

                {/* TERMO OBRIGATÓRIO RADIO BOX / CHECKBOX */}
                {torneioOp1 && (
                  <div
                    onClick={() => handleToggleTermo(torneioOp1)}
                    className={`rounded-xl border p-3.5 cursor-pointer select-none transition-all flex items-start gap-3 ${
                      termosTorneio[torneioOp1]
                        ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30"
                        : "border-rose-500/60 bg-rose-950/20 text-rose-200 hover:bg-rose-950/30 ring-1 ring-rose-500/30"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                        termosTorneio[torneioOp1]
                          ? "bg-emerald-500 border-emerald-400 text-slate-950"
                          : "border-rose-400 bg-slate-900"
                      }`}
                    >
                      {termosTorneio[torneioOp1] && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <div className="text-xs leading-snug space-y-1">
                      <span className="font-black uppercase tracking-wider block text-white">
                        Termo de Responsabilidade Obrigatório • 1ª Opção ({getGameName(torneioOp1)}) *
                      </span>
                      <p className="text-[11px] opacity-90">
                        Declaro e assumo total responsabilidade de que <strong>possuo deck próprio montado no formato padrão oficial de {getGameName(torneioOp1)}</strong> para jogar o torneio. Estou ciente de que sem este deck minha inscrição no torneio é sumariamente invalidada e não receberei deck da organização.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* OPÇÃO 2 DE TORNEIO */}
              {torneioOp1 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black flex items-center justify-center">2</span>
                      2ª Opção de Torneio (Secundária - Opcional)
                    </label>
                    {torneioOp2 && (
                      <button
                        type="button"
                        onClick={() => handleTorneioOp2Change("")}
                        className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Limpar escolha
                      </button>
                    )}
                  </div>

                  <select
                    value={torneioOp2}
                    onChange={(e) => handleTorneioOp2Change(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">-- Nenhuma 2ª opção de torneio --</option>
                    {TCG_OPTIONS.filter((g) => g.id !== torneioOp1).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.format})
                      </option>
                    ))}
                  </select>

                  {torneioOp2 && (
                    <div
                      onClick={() => handleToggleTermo(torneioOp2)}
                      className={`rounded-xl border p-3.5 cursor-pointer select-none transition-all flex items-start gap-3 ${
                        termosTorneio[torneioOp2]
                          ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30"
                          : "border-rose-500/60 bg-rose-950/20 text-rose-200 hover:bg-rose-950/30 ring-1 ring-rose-500/30"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                          termosTorneio[torneioOp2]
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-rose-400 bg-slate-900"
                        }`}
                      >
                        {termosTorneio[torneioOp2] && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div className="text-xs leading-snug space-y-1">
                        <span className="font-black uppercase tracking-wider block text-white">
                          Termo de Responsabilidade Obrigatório • 2ª Opção ({getGameName(torneioOp2)}) *
                        </span>
                        <p className="text-[11px] opacity-90">
                          Declaro e assumo total responsabilidade de que <strong>possuo deck próprio montado no formato padrão oficial de {getGameName(torneioOp2)}</strong> para jogar o torneio. Estou ciente de que sem este deck minha inscrição no torneio é sumariamente invalidada.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OPÇÃO 3 DE TORNEIO */}
              {torneioOp1 && torneioOp2 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black flex items-center justify-center">3</span>
                      3ª Opção de Torneio (Terceira - Opcional)
                    </label>
                    {torneioOp3 && (
                      <button
                        type="button"
                        onClick={() => handleTorneioOp3Change("")}
                        className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Limpar escolha
                      </button>
                    )}
                  </div>

                  <select
                    value={torneioOp3}
                    onChange={(e) => handleTorneioOp3Change(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="">-- Nenhuma 3ª opção de torneio --</option>
                    {TCG_OPTIONS.filter((g) => g.id !== torneioOp1 && g.id !== torneioOp2).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.format})
                      </option>
                    ))}
                  </select>

                  {torneioOp3 && (
                    <div
                      onClick={() => handleToggleTermo(torneioOp3)}
                      className={`rounded-xl border p-3.5 cursor-pointer select-none transition-all flex items-start gap-3 ${
                        termosTorneio[torneioOp3]
                          ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30"
                          : "border-rose-500/60 bg-rose-950/20 text-rose-200 hover:bg-rose-950/30 ring-1 ring-rose-500/30"
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                          termosTorneio[torneioOp3]
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-rose-400 bg-slate-900"
                        }`}
                      >
                        {termosTorneio[torneioOp3] && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                      <div className="text-xs leading-snug space-y-1">
                        <span className="font-black uppercase tracking-wider block text-white">
                          Termo de Responsabilidade Obrigatório • 3ª Opção ({getGameName(torneioOp3)}) *
                        </span>
                        <p className="text-[11px] opacity-90">
                          Declaro e assumo total responsabilidade de que <strong>possuo deck próprio montado no formato padrão oficial de {getGameName(torneioOp3)}</strong> para jogar o torneio. Estou ciente de que sem este deck minha inscrição no torneio é sumariamente invalidada.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ETAPA 2: OFICINAS DIDÁTICAS */}
            <div className="space-y-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-slate-900/60 to-slate-950 p-5 sm:p-7 shadow-xl">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
                  <BookOpen className="h-4 w-4" />
                  Iniciação & Oficinas Práticas
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex flex-wrap items-center gap-2">
                  <span>2. Oficinas Didáticas de Iniciação</span>
                  <span className="text-[11px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                    Até 3 Opções
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Aprenda a jogar do zero! A organização fornecerá <strong>decks didáticos de demonstração</strong> e monitores.
                </p>
              </div>

              {/* AVISO OBRIGATÓRIO DE CRONOGRAMA */}
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/40 p-3.5 text-xs text-cyan-200 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso Oficial de Cronograma:</strong> A escolha das oficinas é por <strong>ordem de preferência (1ª, 2ª e 3ª opção)</strong>, pois as bancadas didáticas poderão passar por alterações de cronograma conforme a lotação das mesas.
                </span>
              </div>

              {/* OPÇÃO 1 DE OFICINA */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">1</span>
                    1ª Opção de Oficina (Principal)
                  </label>
                  {oficinaOp1 && (
                    <button
                      type="button"
                      onClick={() => handleOficinaOp1Change("")}
                      className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Limpar escolha
                    </button>
                  )}
                </div>

                <select
                  value={oficinaOp1}
                  onChange={(e) => handleOficinaOp1Change(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="">-- Não desejo participar de Oficina como 1ª opção --</option>
                  {TCG_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.subtitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* OPÇÃO 2 DE OFICINA */}
              {oficinaOp1 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black flex items-center justify-center">2</span>
                      2ª Opção de Oficina (Secundária - Opcional)
                    </label>
                    {oficinaOp2 && (
                      <button
                        type="button"
                        onClick={() => handleOficinaOp2Change("")}
                        className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Limpar escolha
                      </button>
                    )}
                  </div>

                  <select
                    value={oficinaOp2}
                    onChange={(e) => handleOficinaOp2Change(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="">-- Nenhuma 2ª opção de oficina --</option>
                    {TCG_OPTIONS.filter((g) => g.id !== oficinaOp1).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} - {g.subtitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* OPÇÃO 3 DE OFICINA */}
              {oficinaOp1 && oficinaOp2 && (
                <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-black flex items-center justify-center">3</span>
                      3ª Opção de Oficina (Terceira - Opcional)
                    </label>
                    {oficinaOp3 && (
                      <button
                        type="button"
                        onClick={() => handleOficinaOp3Change("")}
                        className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Limpar escolha
                      </button>
                    )}
                  </div>

                  <select
                    value={oficinaOp3}
                    onChange={(e) => handleOficinaOp3Change(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="">-- Nenhuma 3ª opção de oficina --</option>
                    {TCG_OPTIONS.filter((g) => g.id !== oficinaOp1 && g.id !== oficinaOp2).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} - {g.subtitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ETAPA 3: SEPARAÇÃO DE TURNOS NAS DATAS */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-sm font-black text-white uppercase tracking-wider">
                  3. Em quais turnos você comparecerá? *
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
                Inscrição 100% gratuita. Ao enviar, seu <strong>Passaporte Digital com Protocolo Oficial</strong> é gerado na hora aqui na tela.
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
              Torneios Oficiais (Deck Próprio)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Disputas competitivas sob diretrizes oficiais. <strong>Exclusivo para quem possuir deck próprio no formato padrão de cada jogo.</strong> Rodadas e cortes definidos pela coordenação técnica.
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
