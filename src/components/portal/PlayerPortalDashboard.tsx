"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Send,
  LogOut,
  Sparkles,
  User,
  Award,
  Copy,
  Check,
  CheckCircle2,
  Plus,
  X,
  Layers,
  HelpCircle,
  TrendingUp,
  ExternalLink,
  Flame,
  Shield,
  Swords,
  Target,
  BarChart3,
  History,
  Medal,
  ChevronRight,
  Zap,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";
import { CategoryBadge } from "../ui/CategoryBadge";
import { PokeballIcon } from "../ui/BrandLogo";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface PlayerPortalDashboardProps {
  player: any;
  rankingItem: any | null;
  stageResults: any[];
  allDecks: any[];
  nextEvent: any | null;
  submittedDecklist?: any | null;
  exigirDecklist?: boolean;
  deckRequests?: any[];
  posicaoGeral?: number | null;
  posicaoCategoria?: number | null;
  totalAtletas?: number;
  historicoTemporadas?: any[];
  titulos?: any[];
}

export function PlayerPortalDashboard({
  player,
  rankingItem,
  stageResults,
  allDecks,
  nextEvent,
  submittedDecklist,
  exigirDecklist = false,
  deckRequests = [],
  posicaoGeral = null,
  posicaoCategoria = null,
  totalAtletas = 0,
  historicoTemporadas = [],
  titulos = [],
}: PlayerPortalDashboardProps) {
  const router = useRouter();

  // Estado da Decklist
  const [selectedDeck, setSelectedDeck] = useState(
    submittedDecklist?.deckNome || player.deckAtivoNome || allDecks[0]?.nome || "Dragapult Ex"
  );
  const [decklistText, setDecklistText] = useState(
    submittedDecklist?.decklistRaw || player.decklistTexto || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [cardStats, setCardStats] = useState<any>(
    submittedDecklist
      ? { total: submittedDecklist.totalCartas || 60, pokemon: 0, trainers: 0, energy: 0 }
      : null
  );
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Estado de Escolha Rápida de Arquétipo
  const [isSavingArchetype, setIsSavingArchetype] = useState(false);
  const [archetypeMessage, setArchetypeMessage] = useState("");

  // Estado de Solicitação de Deck em Partidas
  const [localRequests, setLocalRequests] = useState<any[]>(deckRequests || []);
  const [selectedStageForDeck, setSelectedStageForDeck] = useState<string | null>(null);
  const [requestDeckName, setRequestDeckName] = useState<string>(allDecks[0]?.nome || "");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState("");

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/portal/logout", { method: "POST" });
      router.push("/portal/login");
      router.refresh();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  // Salvar Arquétipo Principal Rápido
  const handleSaveQuickArchetype = async () => {
    setIsSavingArchetype(true);
    setArchetypeMessage("");

    const foundDeck = allDecks.find((d) => d.nome.toLowerCase() === selectedDeck.toLowerCase());
    const tipoEnergia = foundDeck?.tipoEnergia || "colorless";

    try {
      const res = await fetch("/api/portal/decklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckNome: selectedDeck,
          decklistRaw: "",
          tipoEnergia,
        }),
      });

      if (res.ok) {
        setArchetypeMessage(`✅ Arquétipo "${selectedDeck}" salvo como seu deck oficial!`);
      } else {
        setArchetypeMessage("❌ Não foi possível salvar o arquétipo.");
      }
    } catch {
      setArchetypeMessage("❌ Erro de conexão.");
    } finally {
      setIsSavingArchetype(false);
    }
  };

  // Envio de Decklist com Validação (Quando exigido)
  const handleSubmitDecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitErrors([]);

    const foundDeck = allDecks.find((d) => d.nome.toLowerCase() === selectedDeck.toLowerCase());
    const tipoEnergia = foundDeck?.tipoEnergia || "colorless";

    try {
      const res = await fetch("/api/portal/decklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckNome: selectedDeck,
          decklistRaw: decklistText,
          tipoEnergia,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitMessage("✅ Sua Decklist oficial de 60 cartas foi validada e registrada com sucesso!");
        setCardStats({
          total: data.totalCards,
          pokemon: data.pokemonCount,
          trainers: data.trainerCount,
          energy: data.energyCount,
        });
        if (data.warnings && data.warnings.length > 0) {
          setSubmitErrors(data.warnings);
        }
      } else {
        setSubmitMessage(`❌ Erro: ${data.error}`);
        if (data.warnings) setSubmitErrors(data.warnings);
      }
    } catch (err: any) {
      setSubmitMessage(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar solicitação de deck jogado na etapa
  const handleSubmitDeckRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStageForDeck || !requestDeckName) return;

    setIsSendingRequest(true);
    setRequestFeedback("");

    try {
      const res = await fetch("/api/portal/deck-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          etapaData: selectedStageForDeck,
          deckNome: requestDeckName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLocalRequests((prev) => [
          ...prev.filter((item) => item.etapaData !== selectedStageForDeck),
          {
            etapaData: selectedStageForDeck,
            deckNome: requestDeckName,
            status: "pendente",
          },
        ]);
        setRequestFeedback("✅ Solicitação enviada! O organizador validará o deck.");
        setTimeout(() => {
          setSelectedStageForDeck(null);
          setRequestFeedback("");
        }, 1500);
      } else {
        setRequestFeedback(`❌ Erro: ${data.error || "Não foi possível enviar."}`);
      }
    } catch (err: any) {
      setRequestFeedback(`❌ Erro: ${err.message}`);
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Helper de energia para decks da tabela
  const getDeckEnergy = (deckName?: string | null) => {
    if (!deckName) return "colorless";
    const found = allDecks.find((d) => d.nome.toLowerCase() === deckName.toLowerCase());
    return found?.tipoEnergia || "colorless";
  };

  // Helper para buscar dados de deck
  const getDeckInfo = (deckName?: string | null) => {
    if (!deckName) return null;
    return allDecks.find((d) => d.nome.toLowerCase() === deckName.toLowerCase()) || null;
  };

  // --- ANÁLISE DE PERFORMANCE & DECKS ---

  // 1. Agrupamento por Deck a partir das etapas jogadas
  const deckStatsList = useMemo(() => {
    const map: Record<
      string,
      {
        deckNome: string;
        tipoEnergia: string;
        imagem: string | null;
        icone: string | null;
        limitless: string | null;
        etapasCount: number;
        vitorias: number;
        derrotas: number;
        empates: number;
        pontosTotal: number;
        melhorColocacao: number;
        podiosCount: number;
      }
    > = {};

    const invalidNames = [
      "sem deck",
      "sem deck registrado",
      "não registrado",
      "outros",
      "",
    ];

    for (const r of stageResults) {
      const rawName = (r.deckNome || "").trim();
      if (!rawName || invalidNames.includes(rawName.toLowerCase())) continue;

      if (!map[rawName]) {
        const foundDeck = allDecks.find(
          (d) => d.nome.toLowerCase() === rawName.toLowerCase()
        );
        map[rawName] = {
          deckNome: rawName,
          tipoEnergia: foundDeck?.tipoEnergia || "colorless",
          imagem: foundDeck?.imagem || null,
          icone: foundDeck?.icone || null,
          limitless: foundDeck?.limitless || null,
          etapasCount: 0,
          vitorias: 0,
          derrotas: 0,
          empates: 0,
          pontosTotal: 0,
          melhorColocacao: 999,
          podiosCount: 0,
        };
      }

      const item = map[rawName];
      item.etapasCount += 1;
      item.vitorias += Number(r.vitorias) || 0;
      item.derrotas += Number(r.derrotas) || 0;
      item.empates += Number(r.empates) || 0;
      const pts = r.pontosFinal ?? (Number(r.pontos) || 0);
      item.pontosTotal += pts;
      const col = Number(r.colocacao) || 999;
      if (col < item.melhorColocacao) item.melhorColocacao = col;
      if (col <= 4) item.podiosCount += 1;
    }

    const list = Object.values(map).map((d) => {
      const totalPartidas = d.vitorias + d.derrotas + d.empates;
      const winRate = totalPartidas > 0 ? (d.vitorias / totalPartidas) * 100 : 0;
      return {
        ...d,
        totalPartidas,
        winRate: Number(winRate.toFixed(1)),
        pontosTotal: Number(d.pontosTotal.toFixed(1)),
      };
    });

    // Ordenação de destaque: 1º Pontos Totais, 2º Melhor Colocação, 3º Win Rate
    list.sort((a, b) => {
      if (b.pontosTotal !== a.pontosTotal) return b.pontosTotal - a.pontosTotal;
      if (a.melhorColocacao !== b.melhorColocacao) return a.melhorColocacao - b.melhorColocacao;
      return b.winRate - a.winRate;
    });

    return list;
  }, [stageResults, allDecks]);

  // Estatísticas Gerais de Partidas
  const totalMatches = (rankingItem?.vitorias || 0) + (rankingItem?.derrotas || 0) + (rankingItem?.empates || 0);
  const winRate = totalMatches > 0 ? (((rankingItem?.vitorias || 0) / totalMatches) * 100).toFixed(1) : "0.0";
  const lethalityRate = totalMatches > 0 ? (((rankingItem?.vitorias || 0) / totalMatches) * 100).toFixed(1) : "0.0";
  const undefeatedRate = totalMatches > 0 ? ((((rankingItem?.vitorias || 0) + (rankingItem?.empates || 0)) / totalMatches) * 100).toFixed(1) : "0.0";

  const participacoes = rankingItem?.participacoes || stageResults.length || 0;
  const podiumConversion = participacoes > 0 ? (((rankingItem?.podios || 0) / participacoes) * 100).toFixed(0) : "0";
  const pointsPerStage = participacoes > 0 ? ((rankingItem?.pontos || 0) / participacoes).toFixed(1) : "0.0";

  // Identificação do "Melhor Deck"
  const melhorDeck = useMemo(() => {
    if (deckStatsList.length > 0) {
      return deckStatsList[0];
    }
    const activeDeckName = selectedDeck || player.deckAtivoNome || allDecks[0]?.nome || "Mewtwo Ex";
    const foundDeck = allDecks.find(
      (d) => d.nome.toLowerCase() === activeDeckName.toLowerCase()
    );
    return {
      deckNome: activeDeckName,
      tipoEnergia: foundDeck?.tipoEnergia || "colorless",
      imagem: foundDeck?.imagem || null,
      icone: foundDeck?.icone || null,
      limitless: foundDeck?.limitless || null,
      etapasCount: 0,
      vitorias: rankingItem?.vitorias || 0,
      derrotas: rankingItem?.derrotas || 0,
      empates: rankingItem?.empates || 0,
      totalPartidas: totalMatches,
      winRate: Number(winRate),
      pontosTotal: rankingItem ? Math.round(rankingItem.pontos) : 0,
      melhorColocacao: rankingItem?.podios > 0 ? 1 : 4,
      podiosCount: rankingItem?.podios || 0,
    };
  }, [deckStatsList, selectedDeck, player, allDecks, rankingItem, totalMatches, winRate]);

  // Estilo temático da energia do Melhor Deck
  const melhorDeckEnergyConfig = useMemo(() => {
    return getMultiEnergyConfig(melhorDeck.tipoEnergia);
  }, [melhorDeck.tipoEnergia]);

  // Percentual dos pontos gerados pelo melhor deck
  const percentualPontosMelhorDeck = useMemo(() => {
    const totalPts = rankingItem ? Number(rankingItem.pontos) : 0;
    if (totalPts <= 0 || melhorDeck.pontosTotal <= 0) return 0;
    return Math.min(100, Math.round((melhorDeck.pontosTotal / totalPts) * 100));
  }, [rankingItem, melhorDeck]);

  // Trajetória de etapas em ordem cronológica para forma recente
  const chronologicalStages = useMemo(() => {
    return [...stageResults].sort((a, b) => a.etapaData.localeCompare(b.etapaData));
  }, [stageResults]);

  // Helper de badges de colocação
  const getPlacementBadge = (colocacao: number) => {
    if (colocacao === 1) {
      return {
        label: "🏆 1º Lugar",
        short: "1º",
        bg: "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 font-black",
        border: "border-amber-400/50",
        text: "text-amber-400",
      };
    }
    if (colocacao === 2) {
      return {
        label: "🥈 2º Lugar",
        short: "2º",
        bg: "bg-slate-200 text-slate-950 shadow-md shadow-white/20 font-black",
        border: "border-slate-300/50",
        text: "text-slate-200",
      };
    }
    if (colocacao === 3) {
      return {
        label: "🥉 3º Lugar",
        short: "3º",
        bg: "bg-amber-700 text-white shadow-md shadow-amber-700/20 font-black",
        border: "border-amber-600/50",
        text: "text-amber-500",
      };
    }
    if (colocacao === 4) {
      return {
        label: "⭐ 4º Lugar (Top 4)",
        short: "4º",
        bg: "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold",
        border: "border-purple-500/50",
        text: "text-purple-400",
      };
    }
    return {
      label: `${colocacao}º Lugar`,
      short: `${colocacao}º`,
      bg: "bg-slate-800 text-slate-300 font-bold",
      border: "border-white/10",
      text: "text-slate-400",
    };
  };

  const activeDeckObj = allDecks.find((d) => d.nome.toLowerCase() === selectedDeck.toLowerCase());

  return (
    <div className="max-w-5xl mx-auto py-6 px-3 space-y-6">
      {/* ========================================================================= */}
      {/* 1. PASSAPORTE OFICIAL PLAY! POKÉMON (CRACHÁ DO COMPETIDOR) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl p-6 sm:p-8">
        {/* Marca d'água oficial & Glow holográfico */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none">
          <PokeballIcon className="w-40 h-40" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-5">
            {/* Badge de Avatar & Categoria */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-950 border-2 border-amber-400/40 text-amber-400 shadow-inner">
              <User className="h-10 w-10 text-slate-300" />
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 rounded-full p-1 shadow">
                <Award className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  PLAY! POKÉMON COMPETITOR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Temporada 5
                </span>
                {posicaoGeral && (
                  <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full">
                    #{posicaoGeral}º Geral {totalAtletas > 0 && `(de ${totalAtletas})`}
                  </span>
                )}
                {posicaoCategoria && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    #{posicaoCategoria}º na Divisão
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap mt-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {player.nome}
                </h1>
                <CategoryBadge category={player.categoria} />
              </div>

              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2.5 flex-wrap">
                <span>POP ID: <strong className="text-white tabular-nums font-bold">{player.id}</strong></span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{player.categoria.toUpperCase()} DIVISION</span>
                <span>•</span>
                <span>{player.cidade || "Feira de Santana - BA"}</span>
              </p>

              {titulos.length > 0 && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/40 text-amber-300 text-xs font-black shadow-sm">
                  <span>👑</span>
                  <span>
                    Campeão da Liga Atlântica ({titulos.map((t) => t.Temporada || t.temporada).join(", ")})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botão Encerrar Sessão */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>

        {/* Métricas e Carimbos Oficiais gravados no Passaporte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="border-l-2 border-amber-500/40 pl-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pontuação Oficial</span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {rankingItem ? Math.round(rankingItem.pontos) : 0} <span className="text-xs font-bold text-amber-300">PTS</span>
            </span>
          </div>

          <div className="border-l-2 border-emerald-500/40 pl-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Retrospecto (V-D-E)</span>
            <span className="text-2xl font-black text-white tracking-tight">
              <span className="text-emerald-400">{rankingItem?.vitorias || 0}V</span>{" "}
              <span className="text-rose-400">{rankingItem?.derrotas || 0}D</span>
            </span>
            <span className="text-[10px] text-slate-400 block">{rankingItem?.empates || 0} empates</span>
          </div>

          <div className="border-l-2 border-blue-500/40 pl-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Aproveitamento</span>
            <span className="text-2xl font-black text-blue-400 tracking-tight">
              {winRate}%
            </span>
          </div>

          <div className="border-l-2 border-purple-500/40 pl-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pódios Conquistados</span>
            <span className="text-2xl font-black text-purple-300 tracking-tight">
              {rankingItem?.podios || 0}x <span className="text-xs text-purple-400 font-bold">Top 4</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PANORAMA DO MELHOR DECK ("DECK ASSINATURA & CARRO-CHEFE") */}
      {/* ========================================================================= */}
      <div
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl shadow-2xl transition-all"
        style={{
          background: melhorDeckEnergyConfig.gradientBg,
          borderColor: `${melhorDeckEnergyConfig.primaryColor}55`,
          boxShadow: `0 15px 35px -10px ${melhorDeckEnergyConfig.glowColor}`,
        }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Visual da Carta / Foto do Deck */}
          <div className="shrink-0 relative group">
            {melhorDeck.imagem ? (
              <div
                className="relative w-36 h-48 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 bg-slate-950 shadow-2xl transition-transform duration-300 group-hover:scale-105"
                style={{
                  borderColor: `${melhorDeckEnergyConfig.primaryColor}88`,
                  boxShadow: `0 0 25px ${melhorDeckEnergyConfig.glowColor}`,
                }}
              >
                {/* Imagem oficial da carta Pokémon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={melhorDeck.imagem}
                  alt={melhorDeck.deckNome}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 pointer-events-none" />
              </div>
            ) : (
              <div
                className="w-36 h-48 sm:w-44 sm:h-60 rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 bg-slate-950/80 shadow-2xl"
                style={{
                  borderColor: `${melhorDeckEnergyConfig.primaryColor}66`,
                }}
              >
                {melhorDeck.icone ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={melhorDeck.icone} alt="" className="w-20 h-20 object-contain drop-shadow" />
                ) : (
                  <Flame className="w-16 h-16 text-amber-400" />
                )}
                <span className="text-xs font-black text-white mt-2 leading-tight">{melhorDeck.deckNome}</span>
              </div>
            )}

            {/* Selo no canto da carta */}
            <div className="absolute -top-2.5 -left-2.5 bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>CARRO-CHEFE</span>
            </div>
          </div>

          {/* Dados & Estatísticas de Desempenho do Melhor Deck */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  ⚡ PANORAMA DO MELHOR DECK
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-full">
                  Maior Eficiência na Temporada
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {melhorDeck.deckNome}
                  </h2>
                  <EnergyBadge energyRaw={melhorDeck.tipoEnergia} size="md" />
                </div>

                {melhorDeck.limitless && (
                  <a
                    href={melhorDeck.limitless}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-white bg-blue-600/15 hover:bg-blue-600 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-all"
                  >
                    <span>Metagame Limitless</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-1">
                Arquétipo de maior rendimento competitivo do atleta.
                {percentualPontosMelhorDeck > 0 && (
                  <span className="text-amber-300 font-bold ml-1">
                    Gerou {percentualPontosMelhorDeck}% de todos os seus pontos oficiais nesta edição.
                  </span>
                )}
              </p>
            </div>

            {/* Pilares Bento do Melhor Deck */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3.5 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Melhor Resultado
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xl font-black text-white">
                    {melhorDeck.melhorColocacao !== 999 ? `${melhorDeck.melhorColocacao}º` : "-"}
                  </span>
                  {melhorDeck.melhorColocacao <= 4 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                      PÓDIO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Colocação Máxima</span>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3.5 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Aproveitamento
                </span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {melhorDeck.winRate}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Win Rate com o Deck</span>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3.5 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Recorde Oficial
                </span>
                <div className="text-xl font-black text-white mt-1">
                  <span className="text-emerald-400">{melhorDeck.vitorias}V</span>{" "}
                  <span className="text-rose-400">{melhorDeck.derrotas}D</span>
                  {melhorDeck.empates > 0 && <span className="text-slate-400 text-xs font-bold"> {melhorDeck.empates}E</span>}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {melhorDeck.etapasCount} torneio(s) jogado(s)
                </span>
              </div>

              <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-3.5 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Pontos Gerados
                </span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {melhorDeck.pontosTotal} <span className="text-xs font-bold text-amber-300">PTS</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Acumulado no Circuito</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ARSENAL DE DECKS NA TEMPORADA (Se pilotou mais de um arquétipo) */}
      {/* ========================================================================= */}
      {deckStatsList.length > 1 && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Arsenal de Arquétipos Disputados ({deckStatsList.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Distribuição ao longo das etapas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deckStatsList.map((d, idx) => {
              const energyCfg = getMultiEnergyConfig(d.tipoEnergia);
              return (
                <div
                  key={idx}
                  className="rounded-2xl border p-4 bg-slate-950/80 transition-all hover:border-white/20 space-y-3"
                  style={{
                    borderColor: idx === 0 ? `${energyCfg.primaryColor}55` : "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <EnergyBadge energyRaw={d.tipoEnergia} size="sm" showLabel={false} />
                      <span className="font-bold text-white text-sm truncate max-w-[170px]">
                        {d.deckNome}
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        TOP 1
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Torneios Disputados:</span>
                      <strong className="text-white">{d.etapasCount} etapa(s)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Score com o Deck:</span>
                      <strong className="text-white">
                        <span className="text-emerald-400">{d.vitorias}V</span> -{" "}
                        <span className="text-rose-400">{d.derrotas}D</span> - {d.empates}E
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Melhor Colocação:</span>
                      <strong className="text-amber-400">
                        {d.melhorColocacao !== 999 ? `${d.melhorColocacao}º Lugar` : "-"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pontos Conquistados:</span>
                      <strong className="text-white font-bold">{d.pontosTotal} PTS</strong>
                    </div>
                  </div>

                  {/* Barra de Win Rate */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Win Rate:</span>
                      <span className="font-bold text-emerald-400">{d.winRate}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, d.winRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RAIO-X DE DESEMPENHO & PILARES DE EFICIÊNCIA */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Raio-X de Desempenho & Pilares de Eficiência
              </h3>
              <p className="text-xs text-slate-400">
                Diagnóstico estatístico da performance do competidor no circuito
              </p>
            </div>
          </div>
        </div>

        {/* 4A. Forma Recente (Linha do Tempo de Colocações Etapa a Etapa) */}
        {chronologicalStages.length > 0 && (
          <div className="rounded-2xl bg-slate-950 p-4 sm:p-5 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <span>Forma Recente (Trajetória Etapa a Etapa)</span>
              </span>
              <span className="text-[11px] text-slate-400">Cronológico</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto py-2">
              {chronologicalStages.map((stg, i) => {
                const badge = getPlacementBadge(Number(stg.colocacao) || 999);
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-white/10 shrink-0 min-w-[110px] space-y-1.5"
                  >
                    <span className="text-[10px] font-bold text-slate-400">{stg.etapaData}</span>
                    <span className={`px-2.5 py-1 rounded-xl text-xs ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="text-[11px] text-slate-300 font-semibold">
                      <span>{stg.pontosFinal ?? stg.pontos} PTS</span>
                    </div>
                    {stg.deckNome && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={stg.deckNome}>
                        {stg.deckNome}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4B. Os 4 Pilares de Eficiência Competitiva */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <Swords className="h-3.5 w-3.5" />
              <span>Taxa de Letalidade</span>
            </div>
            <div className="text-2xl font-black text-white">{lethalityRate}%</div>
            <p className="text-[10px] text-slate-400">Vitórias puras em partidas oficiais</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>Invencibilidade</span>
            </div>
            <div className="text-2xl font-black text-white">{undefeatedRate}%</div>
            <p className="text-[10px] text-slate-400">Partidas sem sofrer derrota (V + E)</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
              <Target className="h-3.5 w-3.5" />
              <span>Conversão em Pódio</span>
            </div>
            <div className="text-2xl font-black text-white">{podiumConversion}%</div>
            <p className="text-[10px] text-slate-400">Torneios que resultaram em Top 4</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <Award className="h-3.5 w-3.5" />
              <span>Eficiência por Etapa</span>
            </div>
            <div className="text-2xl font-black text-white">{pointsPerStage} <span className="text-xs text-amber-300">PTS</span></div>
            <p className="text-[10px] text-slate-400">Média de pontos conquistados por evento</p>
          </div>
        </div>

        {/* 4C. Balanço de Partidas (Distribuição Visual) */}
        {totalMatches > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Balanço Global de Partidas ({totalMatches} disputadas)</span>
              <span className="text-slate-400">
                <span className="text-emerald-400 font-bold">{rankingItem?.vitorias || 0}V</span> •{" "}
                <span className="text-amber-400 font-bold">{rankingItem?.empates || 0}E</span> •{" "}
                <span className="text-rose-400 font-bold">{rankingItem?.derrotas || 0}D</span>
              </span>
            </div>

            <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-white/10">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all"
                style={{ width: `${((rankingItem?.vitorias || 0) / totalMatches) * 100}%` }}
                title={`${rankingItem?.vitorias || 0} Vitórias`}
              />
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${((rankingItem?.empates || 0) / totalMatches) * 100}%` }}
                title={`${rankingItem?.empates || 0} Empates`}
              />
              <div
                className="h-full bg-rose-500 rounded-r-full transition-all"
                style={{ width: `${((rankingItem?.derrotas || 0) / totalMatches) * 100}%` }}
                title={`${rankingItem?.derrotas || 0} Derrotas`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. LEGADO HISTÓRICO MULTI-TEMPORADAS (QUANDO HOUVER REGISTROS ANTERIORES) */}
      {/* ========================================================================= */}
      {historicoTemporadas.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-slate-900/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-black text-white">
                Trajetória Histórica na Liga Atlântica ({historicoTemporadas.length} Edições Anteriores)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Hall da Fama & Eras Passadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {historicoTemporadas.map((hist, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 space-y-2 hover:border-amber-400/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {hist.temporada}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {hist.pos ? `${hist.pos}º Lugar` : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Pontuação Final:</span>
                  <span className="text-sm font-black text-white">
                    {hist.pontos ? `${hist.pontos} PTS` : "-"}
                  </span>
                </div>

                {hist.deck && (
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[11px] text-slate-400">Deck Utilizado:</span>
                    <span className="text-xs font-bold text-amber-300 truncate max-w-[140px]">
                      {hist.deck}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRÓXIMO TORNEIO & CONTROLE DE DECK */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Próxima Etapa Oficial */}
        <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Próximo Evento Oficial</span>
          </div>

          <div>
            <h3 className="text-lg font-black text-white">
              {nextEvent ? nextEvent.evento : "Etapa Oficial da Liga Atlântica"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {exigirDecklist
                ? "Submeta sua lista de 60 cartas com antecedência para agilizar a conferência de mesa no TOM."
                : "Etapa presencial no formato Standard oficial. Traga seu deck físico para as rodadas."}
            </p>
          </div>

          <div className="space-y-2.5 rounded-2xl bg-slate-950 p-4 border border-white/5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{nextEvent?.data || "A definir"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{nextEvent?.horario || "14:00 (Início das Rodadas)"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{nextEvent?.local || "Livraria Atlântica +"}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Deck Ativo Selecionado:
            </span>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-white/10">
              <EnergyBadge energyRaw={activeDeckObj?.tipoEnergia || "colorless"} size="sm" />
              <span className="font-bold text-white text-sm">{selectedDeck}</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Registro de Decklist de 60 Cartas (Condicional) OU Seleção de Arquétipo Regular */}
        <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-7 shadow-xl space-y-5">
          {exigirDecklist ? (
            /* A. QUANDO O EVENTO EXIGE DECKLIST (Ex: Premier Challenge ou Cup) */
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                      Decklist Obrigatória
                    </span>
                    <h3 className="text-base font-black text-white">Registro de Decklist (60 Cartas)</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Cole a lista exportada do Pokémon TCG Live ou Limitless</p>
                </div>
                <div className="flex items-center gap-2">
                  {decklistText && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(decklistText);
                        setCopiedRaw(true);
                        setTimeout(() => setCopiedRaw(false), 2000);
                      }}
                      className="rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedRaw ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedRaw ? "Copiado!" : "Copiar"}</span>
                    </button>
                  )}
                  {cardStats && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                      {cardStats.total}/60 Cartas
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmitDecklist} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-300">Arquétipo do Deck:</label>
                  <select
                    value={selectedDeck}
                    onChange={(e) => setSelectedDeck(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    {allDecks.map((d) => (
                      <option key={d.id} value={d.nome}>
                        {d.nome} ({d.tipoEnergia})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={7}
                    placeholder={`Pokémon: 14\n4 Dragapult Ex TWM 130\n...\n\nTreinador: 34\n4 Arven OBF 186\n...\n\nEnergia: 12\n...`}
                    value={decklistText}
                    onChange={(e) => setDecklistText(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                    required
                  />
                </div>

                {submitMessage && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{submitMessage}</span>
                  </div>
                )}

                {submitErrors.length > 0 && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold space-y-1">
                    {submitErrors.map((err, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{err}</span>
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Validar & Confirmar Inscrição</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* B. QUANDO O EVENTO NÃO EXIGE DECKLIST (Sessão Regular de Liga) */
            <>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      Sessão Regular de Liga
                    </span>
                    <h3 className="text-base font-black text-white">Arquétipo do Deck da Sessão</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Não é necessário o envio de lista detalhada de 60 cartas para este evento.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-5 border border-white/5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Selecione o Deck que você planeja jogar:
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Ao definir seu arquétipo, você agiliza o registro de metagame da organização após o término das rodadas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <select
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {allDecks.map((d) => (
                          <option key={d.id} value={d.nome}>
                            {d.nome} ({d.tipoEnergia})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveQuickArchetype}
                      disabled={isSavingArchetype}
                      className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingArchetype ? "Salvando..." : "Salvar Deck Ativo"}
                    </button>
                  </div>

                  {archetypeMessage && (
                    <p className={`text-xs font-bold mt-2.5 ${archetypeMessage.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>
                      {archetypeMessage}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. HISTÓRICO DE ETAPAS & COLOCAÇÕES + ENVIO DE DECK POR ETAPA */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Histórico Oficial de Participações ({stageResults.length} Etapas)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Partidas disputadas oficialmente. Você pode informar o deck utilizado nas etapas que estiverem sem registro.
            </p>
          </div>
        </div>

        {stageResults.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nenhuma etapa registrada nesta temporada.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-white/10 bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 pl-4">Data & Torneio</th>
                  <th className="py-3 px-3 text-center">Colocação</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center font-bold text-amber-400">Pontos</th>
                  <th className="py-3 pr-4">Deck Utilizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stageResults.map((r, idx) => {
                  const hasDeck = Boolean(
                    r.deckNome &&
                    r.deckNome !== "Sem deck" &&
                    r.deckNome !== "Não registrado" &&
                    r.deckNome !== "Sem deck registrado"
                  );

                  const pendingReq = localRequests.find(
                    (req) => req.etapaData === r.etapaData && req.status === "pendente"
                  );

                  const placementBadge = getPlacementBadge(Number(r.colocacao) || 999);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2.5 pl-4 tabular-nums text-slate-300">
                        <div className="font-semibold text-white">{r.etapaData}</div>
                        <div className="text-[10px] text-slate-400">
                          {r.tipo || "Liga"}{" "}
                          {Number(r.multiplicador) > 1 && (
                            <span className="text-amber-400 font-bold">({r.multiplicador}x)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs ${placementBadge.bg}`}>
                          {placementBadge.short}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300 tabular-nums">
                        {r.vitorias}-{r.derrotas}-{r.empates}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-amber-400 tabular-nums">
                        {r.multiplicador && Number(r.multiplicador) > 1 ? (
                          <div>
                            <span>{r.pontosFinal ?? Number((r.pontos * r.multiplicador).toFixed(1))} PTS</span>
                            <span className="block text-[10px] text-amber-400/70 font-semibold">
                              {r.pontos} &times; {r.multiplicador}x
                            </span>
                          </div>
                        ) : (
                          <span>{Math.round(r.pontos)} PTS</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        {hasDeck ? (
                          <div className="flex items-center gap-1.5">
                            <EnergyBadge energyRaw={getDeckEnergy(r.deckNome)} size="sm" showLabel={false} />
                            <span className="font-semibold text-white">{r.deckNome}</span>
                          </div>
                        ) : pendingReq ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                            <span>⏳ {pendingReq.deckNome}</span>
                            <span className="text-[10px] text-amber-400/80">(Em análise)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStageForDeck(r.etapaData);
                              setRequestDeckName(allDecks[0]?.nome || "");
                              setRequestFeedback("");
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-white bg-blue-600/15 hover:bg-blue-600 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Informar Deck</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INFORMAR DECK UTILIZADO NA ETAPA */}
      {/* ========================================================================= */}
      {selectedStageForDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  Informar Deck Utilizado
                </h3>
                <p className="text-xs text-slate-400">Etapa de {selectedStageForDeck}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStageForDeck(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeckRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Qual deck você jogou nesta partida?
                </label>
                <select
                  value={requestDeckName}
                  onChange={(e) => setRequestDeckName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {allDecks.map((d) => (
                    <option key={d.id} value={d.nome}>
                      {d.nome} ({d.tipoEnergia})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Sua escolha será enviada para conferência e validação do organizador da Liga.
                </p>
              </div>

              {requestFeedback && (
                <p className={`text-xs font-bold ${requestFeedback.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>
                  {requestFeedback}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStageForDeck(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingRequest}
                  className="px-5 py-2 text-xs font-bold text-slate-950 rounded-xl bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSendingRequest ? "Enviando..." : "Enviar para Validação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
