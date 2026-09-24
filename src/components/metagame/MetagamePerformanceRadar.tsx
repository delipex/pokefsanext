"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Search,
  Crown,
  Medal,
  Swords,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { EnergyBadge } from "@/components/ui/EnergyBadge";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface DeckPerformance {
  deckNome: string;
  tipoEnergia: string;
  imagem: string | null;
  icone: string | null;
  limitless: string | null;
  totalAparicoes: number;
  percentMeta: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  totalPartidas: number;
  winRate: number; // 0 to 100
  titulos: number; // 1º lugar
  podios: number; // Top 4
  mediaColocacao: number;
}

interface MetagamePerformanceRadarProps {
  metagameEntries: Array<{
    id: number;
    etapaData: string;
    jogadorNome: string;
    deckNome: string;
  }>;
  decksInfo: Array<{
    id: number;
    nome: string;
    tipoEnergia: string;
    imagem: string | null;
    limitless: string | null;
    icone: string | null;
  }>;
  etapaResultados: Array<{
    id: number;
    etapaData: string;
    jogadorId: string | null;
    jogadorNome: string;
    colocacao: number;
    pontos: number;
    vitorias: number;
    empates: number;
    derrotas: number;
    deckNome?: string | null;
  }>;
}

type SortField = "winRate" | "titulos" | "totalAparicoes" | "vitorias" | "lowestWinRate";

export function MetagamePerformanceRadar({
  metagameEntries = [],
  decksInfo = [],
  etapaResultados = [],
}: MetagamePerformanceRadarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("winRate");
  const [minPartidasFilter, setMinPartidasFilter] = useState(false);

  // Paginação da tabela de arquétipos
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Reset de página ao alterar filtros ou busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, minPartidasFilter, pageSize]);

  // Compilação cruzada dos dados entre Metagame e Resultados de Etapas
  const { deckStatsList, highlights, totalSeasonMatches } = useMemo(() => {
    // 1. Criar mapa de (etapaData + jogadorNome normalizado) -> DeckNome
    const matchDeckMap = new Map<string, string>();
    metagameEntries.forEach((entry) => {
      const key = `${entry.etapaData}_${entry.jogadorNome.trim().toLowerCase()}`;
      if (entry.deckNome?.trim()) {
        matchDeckMap.set(key, entry.deckNome.trim());
      }
    });

    // 2. Acumuladores de estatísticas por deck
    const statsByDeck = new Map<
      string,
      {
        totalAparicoes: number;
        vitorias: number;
        empates: number;
        derrotas: number;
        titulos: number;
        podios: number;
        colocacoes: number[];
      }
    >();

    const getOrInit = (dName: string) => {
      if (!statsByDeck.has(dName)) {
        statsByDeck.set(dName, {
          totalAparicoes: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          titulos: 0,
          podios: 0,
          colocacoes: [],
        });
      }
      return statsByDeck.get(dName)!;
    };

    // Contar aparições a partir de metagameEntries
    metagameEntries.forEach((entry) => {
      const dName = entry.deckNome?.trim();
      if (!dName || dName.toLowerCase() === "outros") return;
      const s = getOrInit(dName);
      s.totalAparicoes += 1;
    });

    // Cruzar resultados individuais de partidas
    let seasonMatchesCount = 0;
    etapaResultados.forEach((res) => {
      const key = `${res.etapaData}_${res.jogadorNome.trim().toLowerCase()}`;
      let dName = res.deckNome?.trim() || matchDeckMap.get(key);

      if (!dName || dName.toLowerCase() === "outros" || dName.toLowerCase() === "sem deck registrado") {
        return;
      }

      const s = getOrInit(dName);
      const vit = Number(res.vitorias) || 0;
      const emp = Number(res.empates) || 0;
      const der = Number(res.derrotas) || 0;

      s.vitorias += vit;
      s.empates += emp;
      s.derrotas += der;
      seasonMatchesCount += vit + emp + der;

      if (res.colocacao === 1) s.titulos += 1;
      if (res.colocacao <= 4) s.podios += 1;
      if (res.colocacao > 0) s.colocacoes.push(res.colocacao);
    });

    const totalMetaEntries = metagameEntries.length || 1;

    // 3. Montar lista consolidada com metadados dos decks
    const list: DeckPerformance[] = Array.from(statsByDeck.entries()).map(
      ([dName, data]) => {
        const info = decksInfo.find(
          (d) => d.nome.toLowerCase() === dName.toLowerCase()
        );
        const totalMatches = data.vitorias + data.empates + data.derrotas;
        const winRate =
          totalMatches > 0 ? (data.vitorias / totalMatches) * 100 : 0;
        const mediaColocacao =
          data.colocacoes.length > 0
            ? data.colocacoes.reduce((a, b) => a + b, 0) / data.colocacoes.length
            : 0;

        return {
          deckNome: dName,
          tipoEnergia: info?.tipoEnergia || "colorless",
          imagem: info?.imagem || null,
          icone: info?.icone || null,
          limitless: info?.limitless || null,
          totalAparicoes: data.totalAparicoes,
          percentMeta: (data.totalAparicoes / totalMetaEntries) * 100,
          vitorias: data.vitorias,
          empates: data.empates,
          derrotas: data.derrotas,
          totalPartidas: totalMatches,
          winRate,
          titulos: data.titulos,
          podios: data.podios,
          mediaColocacao,
        };
      }
    );

    // 4. Calcular Destaques (Highlights)
    // Decks com pelo menos 2 partidas jogadas para métricas de winrate justo
    const relevantDecks = list.filter((d) => d.totalPartidas >= 2);
    const pool = relevantDecks.length > 0 ? relevantDecks : list;

    // A. Maior Winrate (Mais Eficiente)
    const bestWinRate = [...pool].sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.vitorias - a.vitorias;
    })[0] || null;

    // B. Mais Campeão (Títulos de 1º lugar e Pódios)
    const mostTitles = [...list].sort((a, b) => {
      if (b.titulos !== a.titulos) return b.titulos - a.titulos;
      if (b.podios !== a.podios) return b.podios - a.podios;
      return b.winRate - a.winRate;
    })[0] || null;

    // C. Mais Popular (Volume / Presença)
    const mostPopular = [...list].sort(
      (a, b) => b.totalAparicoes - a.totalAparicoes
    )[0] || null;

    // D. Menor Winrate (Com mínimo de partidas para ser relevante)
    const lowestWinRate = [...pool].sort((a, b) => {
      if (a.winRate !== b.winRate) return a.winRate - b.winRate;
      return b.derrotas - a.derrotas;
    })[0] || null;

    return {
      deckStatsList: list,
      highlights: {
        bestWinRate,
        mostTitles,
        mostPopular,
        lowestWinRate,
      },
      totalSeasonMatches: Math.round(seasonMatchesCount / 2), // cada partida envolve 2 jogadores
    };
  }, [metagameEntries, decksInfo, etapaResultados]);

  // Filtragem e Ordenação
  const filteredAndSortedDecks = useMemo(() => {
    let result = deckStatsList.filter((d) => {
      const matchSearch = d.deckNome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (minPartidasFilter) {
        return matchSearch && d.totalPartidas >= 3;
      }
      return matchSearch;
    });

    result.sort((a, b) => {
      if (sortField === "winRate") {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalPartidas - a.totalPartidas;
      }
      if (sortField === "lowestWinRate") {
        if (a.winRate !== b.winRate) return a.winRate - b.winRate;
        return b.derrotas - a.derrotas;
      }
      if (sortField === "titulos") {
        if (b.titulos !== a.titulos) return b.titulos - a.titulos;
        if (b.podios !== a.podios) return b.podios - a.podios;
        return b.winRate - a.winRate;
      }
      if (sortField === "vitorias") {
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        return b.winRate - a.winRate;
      }
      // totalAparicoes
      if (b.totalAparicoes !== a.totalAparicoes) {
        return b.totalAparicoes - a.totalAparicoes;
      }
      return b.winRate - a.winRate;
    });

    return result;
  }, [deckStatsList, searchTerm, sortField, minPartidasFilter]);

  // Paginação
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredAndSortedDecks.length / pageSize));

  const paginatedDecks = useMemo(() => {
    if (pageSize === -1) return filteredAndSortedDecks;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedDecks.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedDecks, currentPage, pageSize]);

  const getWinRateColor = (wr: number) => {
    if (wr >= 65) return "text-emerald-400";
    if (wr >= 50) return "text-blue-400";
    if (wr >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getWinRateBg = (wr: number) => {
    if (wr >= 65) return "bg-emerald-500";
    if (wr >= 50) return "bg-blue-500";
    if (wr >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Radar de Performance & Eficiência
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              Aproveitamento real em partidas, taxas de vitória, títulos e pódios conquistados
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{deckStatsList.length} arquétipos analisados</span>
        </div>
      </div>

      {/* 4 Cards de Destaque / Honra */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Maior Winrate */}
        {highlights.bestWinRate && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 whitespace-nowrap shrink-0">
                <Zap className="h-3 w-3 text-emerald-400 shrink-0" /> Maior Winrate
              </span>
              <EnergyBadge energyRaw={highlights.bestWinRate.tipoEnergia} />
            </div>

            <div className="space-y-1 my-1">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {highlights.bestWinRate.deckNome}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  {highlights.bestWinRate.winRate.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">
                  ({highlights.bestWinRate.vitorias}V - {highlights.bestWinRate.derrotas}D)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-2">
              {highlights.bestWinRate.totalPartidas} partidas disputadas na temporada
            </p>
          </div>
        )}

        {/* 2. Mais Campeão (Títulos e Pódios) */}
        {highlights.mostTitles && (
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/[0.03] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap shrink-0">
                <Crown className="h-3 w-3 text-amber-400 shrink-0" /> Mais Vitorioso
              </span>
              <EnergyBadge energyRaw={highlights.mostTitles.tipoEnergia} />
            </div>

            <div className="space-y-1 my-1">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {highlights.mostTitles.deckNome}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  {highlights.mostTitles.titulos} 🏆
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  e {highlights.mostTitles.podios} Pódios
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-2">
              Maior conversão em troféus da temporada
            </p>
          </div>
        )}

        {/* 3. Mais Popular (Volume) */}
        {highlights.mostPopular && (
          <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/[0.03] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300 whitespace-nowrap shrink-0">
                <Flame className="h-3 w-3 text-blue-400 shrink-0" /> Mais Escolhido
              </span>
              <EnergyBadge energyRaw={highlights.mostPopular.tipoEnergia} />
            </div>

            <div className="space-y-1 my-1">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {highlights.mostPopular.deckNome}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums">
                  {highlights.mostPopular.percentMeta.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">
                  ({highlights.mostPopular.totalAparicoes} registros)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-2">
              O arquétipo mais presente nas mesas
            </p>
          </div>
        )}

        {/* 4. Menor Winrate (Lanterna) */}
        {highlights.lowestWinRate && (
          <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300 whitespace-nowrap shrink-0">
                <TrendingDown className="h-3 w-3 text-rose-400 shrink-0" /> Menor Winrate
              </span>
              <EnergyBadge energyRaw={highlights.lowestWinRate.tipoEnergia} />
            </div>

            <div className="space-y-1 my-1">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {highlights.lowestWinRate.deckNome}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">
                  {highlights.lowestWinRate.winRate.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">
                  ({highlights.lowestWinRate.vitorias}V - {highlights.lowestWinRate.derrotas}D)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-white/[0.04] pt-2 mt-2">
              Deck que encontrou maior dificuldade no formato
            </p>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Controles de Ordenação */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por deck..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 backdrop-blur-xl focus:border-amber-400/40 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition-all"
          />
        </div>

        {/* Botões de Ordenação */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSortField("winRate")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortField === "winRate"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:text-white"
            }`}
          >
            ⚡ Maior Winrate
          </button>

          <button
            onClick={() => setSortField("titulos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortField === "titulos"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:text-white"
            }`}
          >
            🏆 Mais Títulos
          </button>

          <button
            onClick={() => setSortField("totalAparicoes")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortField === "totalAparicoes"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:text-white"
            }`}
          >
            📊 Mais Popular
          </button>

          <button
            onClick={() => setSortField("lowestWinRate")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              sortField === "lowestWinRate"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:text-white"
            }`}
          >
            📉 Menor Winrate
          </button>
        </div>
      </div>

      {/* Tabela de Eficiência dos Decks */}
      <div className="rounded-3xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">Deck & Arquétipo</th>
                <th className="py-3.5 px-4 text-center">Share no Meta</th>
                <th className="py-3.5 px-4 text-center">Partidas (V-E-D)</th>
                <th className="py-3.5 px-4">Taxa de Vitória (Winrate)</th>
                <th className="py-3.5 px-4 text-center">Títulos / Pódios</th>
                <th className="py-3.5 px-4 text-right">Lista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {paginatedDecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Nenhum deck encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                paginatedDecks.map((deck, idx) => {
                  const globalRank = pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  const energyCfg = getMultiEnergyConfig(deck.tipoEnergia);
                  const isTopWinRate = deck.winRate >= 60 && deck.totalPartidas >= 2;

                  return (
                    <tr
                      key={deck.deckNome}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* 1. Nome do Deck + Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-slate-400 w-6 tabular-nums">
                            {globalRank}º
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                {deck.deckNome}
                              </span>
                              <EnergyBadge energyRaw={deck.tipoEnergia} />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {deck.totalAparicoes} participações registradas
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Share no Meta */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-200 tabular-nums">
                          {deck.percentMeta.toFixed(1)}%
                        </span>
                      </td>

                      {/* 3. Partidas (V-E-D) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 tabular-nums text-xs">
                          <span className="font-bold text-emerald-400">{deck.vitorias}V</span>
                          <span className="text-slate-500">-</span>
                          <span className="font-medium text-slate-400">{deck.empates}E</span>
                          <span className="text-slate-500">-</span>
                          <span className="font-bold text-rose-400">{deck.derrotas}D</span>
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                          Total: {deck.totalPartidas} jogos
                        </div>
                      </td>

                      {/* 4. Taxa de Vitória (Winrate com Barra Visual) */}
                      <td className="py-3.5 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className={`font-black tabular-nums ${getWinRateColor(deck.winRate)}`}>
                              {deck.winRate.toFixed(1)}%
                            </span>
                            {isTopWinRate && (
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                Tier S
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getWinRateBg(deck.winRate)}`}
                              style={{ width: `${Math.min(100, Math.max(5, deck.winRate))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 5. Títulos / Pódios */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          {deck.titulos > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-300">
                              🏆 {deck.titulos}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}

                          {deck.podios > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-300">
                              🎖️ {deck.podios}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Link Limitless */}
                      <td className="py-3.5 px-4 text-right">
                        {deck.limitless ? (
                          <a
                            href={deck.limitless}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-white/[0.04] hover:bg-blue-600 border border-white/[0.08] hover:border-blue-500 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
                            title="Ver lista de referência no LimitlessTCG"
                          >
                            <span>Lista</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">Em breve</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {filteredAndSortedDecks.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/[0.06] bg-white/[0.01]">
            {/* Informações de Itens Exibidos */}
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap justify-center sm:justify-start">
              <span>
                Exibindo{" "}
                <strong className="text-white font-bold tabular-nums">
                  {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}
                </strong>{" "}
                a{" "}
                <strong className="text-white font-bold tabular-nums">
                  {pageSize === -1
                    ? filteredAndSortedDecks.length
                    : Math.min(currentPage * pageSize, filteredAndSortedDecks.length)}
                </strong>{" "}
                de{" "}
                <strong className="text-white font-bold tabular-nums">
                  {filteredAndSortedDecks.length}
                </strong>{" "}
                arquétipos
              </span>

              {/* Seletor de Tamanho de Página */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                <span className="text-[11px] text-slate-500">Por página:</span>
                {[10, 15, 25, -1].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      pageSize === size
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    {size === -1 ? "Todos" : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de Navegação entre Páginas */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Primeira Página */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Primeira página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </motion.button>

                {/* Página Anterior */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>

                {/* Botões Numéricos */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <motion.button
                      key={pageNum}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 rounded-xl px-2 text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                          : "border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}

                {/* Próxima Página */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>

                {/* Última Página */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  aria-label="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
