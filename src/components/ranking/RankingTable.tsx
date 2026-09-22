"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Calendar, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { PlayerModalData, PlayerModal } from "./PlayerModal";
import { formatCategoryAbbr } from "@/lib/theme/energy-tokens";

export interface StageResult {
  id: number;
  etapaData: string;
  jogadorId: string | null;
  jogadorNome: string;
  categoria: string | null;
  colocacao: number;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  deckNome: string | null;
}

export interface StageSummary {
  id: number;
  data: string;
  tipo: string;
  multiplicador: number;
  temporada: number;
  totalJogadores: number;
  campeaoNome: string | null;
  campeaoId: string | null;
  resultados: StageResult[];
}

export interface DeckItemInfo {
  nome: string;
  tipoEnergia: string;
  icone?: string | null;
}

interface RankingTableProps {
  initialPlayers: PlayerModalData[];
  etapas?: StageSummary[];
  allDecks?: DeckItemInfo[];
}

export function RankingTable({ initialPlayers, etapas = [], allDecks = [] }: RankingTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [selectedStageDate, setSelectedStageDate] = useState<string>("general");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModalData | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const isGeneralRanking = selectedStageDate === "general";
  const currentStage = useMemo(() => {
    return etapas.find((e) => e.data === selectedStageDate) || null;
  }, [etapas, selectedStageDate]);

  // Helper para buscar energia de um deck
  const getDeckEnergy = (deckName?: string | null): string => {
    if (!deckName) return "colorless";
    const found = allDecks.find((d) => d.nome.toLowerCase() === deckName.toLowerCase());
    return found?.tipoEnergia || "colorless";
  };

  // Filtragem no Ranking Geral
  const filteredGeneralPlayers = useMemo(() => {
    return initialPlayers.filter((p) => {
      const matchCategory =
        selectedCategory === "TODOS" ||
        formatCategoryAbbr(p.categoria) === selectedCategory;

      const matchSearch =
        p.jogadorNome.toLowerCase().includes(search.toLowerCase()) ||
        p.jogadorId.includes(search) ||
        (p.ultimoDeck && p.ultimoDeck.toLowerCase().includes(search.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [initialPlayers, selectedCategory, search]);

  // Filtragem na Etapa Selecionada
  const filteredStageResults = useMemo(() => {
    if (!currentStage) return [];
    return currentStage.resultados.filter((r) => {
      const matchCategory =
        selectedCategory === "TODOS" ||
        formatCategoryAbbr(r.categoria) === selectedCategory;

      const matchSearch =
        r.jogadorNome.toLowerCase().includes(search.toLowerCase()) ||
        (r.jogadorId && r.jogadorId.includes(search)) ||
        (r.deckNome && r.deckNome.toLowerCase().includes(search.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [currentStage, selectedCategory, search]);

  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedStageDate, pageSize]);

  const activeTotal = isGeneralRanking ? filteredGeneralPlayers.length : filteredStageResults.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));

  // Dados paginados
  const paginatedGeneralPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGeneralPlayers.slice(start, start + pageSize);
  }, [filteredGeneralPlayers, currentPage, pageSize]);

  const paginatedStageResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStageResults.slice(start, start + pageSize);
  }, [filteredStageResults, currentPage, pageSize]);

  const categories = ["TODOS", "ME", "SE", "JR"];

  // Helper para abrir modal a partir do resultado da etapa
  const handleOpenStagePlayerModal = (result: StageResult) => {
    const generalPlayer = initialPlayers.find(
      (p) => p.jogadorNome.toLowerCase() === result.jogadorNome.toLowerCase() || (result.jogadorId && p.jogadorId === result.jogadorId)
    );

    if (generalPlayer) {
      setSelectedPlayer(generalPlayer);
    } else {
      setSelectedPlayer({
        jogadorNome: result.jogadorNome,
        jogadorId: result.jogadorId || "—",
        categoria: result.categoria || "Master",
        pontos: result.pontos,
        vitorias: result.vitorias,
        empates: result.empates,
        derrotas: result.derrotas,
        podios: result.colocacao <= 4 ? 1 : 0,
        mediaColocacao: result.colocacao,
        participacoes: 1,
        historicoColocacoes: `${result.etapaData}:${result.colocacao}`,
        ultimoDeck: result.deckNome,
        ultimoDeckEnergia: getDeckEnergy(result.deckNome),
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtros, Seletor de Etapas e Busca */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-xl shadow-lg">
        {/* Seletor de Visão: Ranking Geral vs Etapas Individuais */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {etapas.length > 0 && (
            <div className="relative w-full sm:w-auto flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center rounded-lg bg-blue-500/20 border border-blue-500/40 px-2 py-1 text-[10px] font-black uppercase text-blue-300">
                Temporada 5
              </span>
              <select
                value={selectedStageDate}
                onChange={(e) => setSelectedStageDate(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-blue-500/30 bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-300 focus:outline-none focus:border-blue-400 cursor-pointer backdrop-blur-md"
              >
                <option value="general" className="bg-slate-900 text-white">
                  🏆 Ranking Geral Consolidado (Temporada 5)
                </option>
                <optgroup label="── Etapas da Temporada 5 ──" className="bg-slate-900 text-slate-400">
                  {etapas.map((etapa, idx) => {
                    const stageNum = etapas.length - idx;
                    return (
                      <option key={etapa.data} value={etapa.data} className="bg-slate-900 text-white">
                        Etapa #{stageNum} (T5) • {etapa.data} ({etapa.tipo} • {etapa.multiplicador}x)
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>
          )}

          {/* Filtro de Categoria em Pílulas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por treinador ou deck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Badge Informativo da Etapa Selecionada */}
      {!isGeneralRanking && currentStage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-xs text-blue-300 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="rounded-md bg-blue-600/30 px-2 py-0.5 text-[11px] font-black text-blue-200 border border-blue-400/40">
              Temporada 5
            </span>
            <span className="flex items-center gap-1 font-bold text-white">
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> {currentStage.data}
            </span>
            <span className="rounded-md bg-blue-900/60 px-2 py-0.5 text-[11px] font-semibold border border-blue-400/30">
              Formato: {currentStage.tipo}
            </span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/30">
              Multiplicador: {currentStage.multiplicador}x
            </span>
            <span className="text-slate-300">
              <strong>{currentStage.totalJogadores}</strong> jogadores inscritos
            </span>
          </div>

          {currentStage.campeaoNome && (
            <div className="flex items-center gap-1.5 font-bold text-yellow-400">
              <Sparkles className="h-4 w-4 text-yellow-400" /> Campeão: {currentStage.campeaoNome}
            </div>
          )}
        </div>
      )}

      {/* Contagem e Controles de Exibição */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <span>
          Mostrando <strong>{activeTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> a{" "}
          <strong>{Math.min(currentPage * pageSize, activeTotal)}</strong> de <strong>{activeTotal}</strong> participantes
        </span>

        {/* Seletor de Itens por Página */}
        <div className="flex items-center gap-2">
          <span>Itens por pág:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Micro-hint de Usabilidade (UI/UX Affordance) */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-white/5 rounded-xl px-3.5 py-2">
        <span className="text-amber-400 shrink-0">💡</span>
        <span>
          Clique em qualquer treinador para abrir o <strong>perfil completo</strong> (histórico, cartel V/E/D e decks utilizados).
        </span>
      </div>

      {/* Tabela de Classificação Responsiva com Glassmorphism */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
        {isGeneralRanking ? (
          /* TABELA 1: RANKING GERAL CONSOLIDADO - APENAS POSIÇÃO, NOME + CATEGORIA, PONTOS */
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-14">#</th>
                <th scope="col" className="px-4 py-3.5">Treinador</th>
                <th scope="col" className="px-4 py-3.5 text-right font-extrabold text-amber-400">PTS</th>
                <th scope="col" className="py-3.5 pr-4 pl-2 text-right w-16">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedGeneralPlayers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Nenhum jogador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedGeneralPlayers.map((player, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index;
                  const pos = globalIndex + 1;
                  const isTop1 = pos === 1;
                  const isTop4 = pos <= 4;

                  return (
                    <tr
                      key={player.jogadorId || globalIndex}
                      onClick={() => setSelectedPlayer(player)}
                      className={`group cursor-pointer transition-all duration-150 hover:bg-white/[0.05] active:bg-white/[0.08] ${
                        isTop1
                          ? "bg-yellow-500/5 font-semibold"
                          : isTop4
                          ? "bg-slate-800/20"
                          : ""
                      }`}
                    >
                      {/* Posição com Medalha / Badge */}
                      <td className="py-3.5 pl-4 pr-2 text-center font-mono">
                        {isTop1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-black text-yellow-400 border border-yellow-500/40 shadow-sm shadow-yellow-500/20">
                            🥇
                          </span>
                        ) : pos === 2 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-400/20 text-sm font-black text-slate-300 border border-slate-400/30">
                            🥈
                          </span>
                        ) : pos === 3 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600/20 text-sm font-black text-amber-500 border border-amber-600/30">
                            🥉
                          </span>
                        ) : isTop4 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                            4º
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">{pos}º</span>
                        )}
                      </td>

                      {/* Treinador: Nome + Categoria (ME / SE / JR) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {player.jogadorNome}
                          </span>
                          <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-black text-blue-300 uppercase tracking-wider">
                            {formatCategoryAbbr(player.categoria)}
                          </span>
                        </div>
                      </td>

                      {/* Pontos Totais */}
                      <td className="px-4 py-3.5 text-right font-black text-base text-amber-400">
                        {player.pontos}
                      </td>

                      {/* Indicador de Clique / Affordance */}
                      <td className="py-3.5 pr-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-500 group-hover:text-amber-400 transition-colors">
                          <span className="text-[11px] font-semibold hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver
                          </span>
                          <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* TABELA 2: CLASSIFICAÇÃO DA ETAPA SELECIONADA */
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-14">#</th>
                <th scope="col" className="px-4 py-3.5">Treinador</th>
                <th scope="col" className="px-4 py-3.5 text-right font-extrabold text-amber-400">PTS</th>
                <th scope="col" className="py-3.5 pr-4 pl-2 text-right w-16">
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedStageResults.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Nenhum jogador encontrado para esta etapa com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedStageResults.map((result, idx) => {
                  const isTop1 = result.colocacao === 1;
                  const isTop4 = result.colocacao <= 4;

                  return (
                    <tr
                      key={result.id || idx}
                      onClick={() => handleOpenStagePlayerModal(result)}
                      className={`group cursor-pointer transition-all duration-150 hover:bg-white/[0.05] active:bg-white/[0.08] ${
                        isTop1 ? "bg-yellow-500/10 font-bold" : isTop4 ? "bg-slate-800/30" : ""
                      }`}
                    >
                      {/* Posição na Etapa */}
                      <td className="py-3.5 pl-4 pr-2 text-center font-mono">
                        {isTop1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-black text-yellow-400 border border-yellow-500/40 shadow-sm shadow-yellow-500/20">
                            🥇
                          </span>
                        ) : result.colocacao === 2 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-400/20 text-sm font-black text-slate-300 border border-slate-400/30">
                            🥈
                          </span>
                        ) : result.colocacao === 3 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600/20 text-sm font-black text-amber-500 border border-amber-600/30">
                            🥉
                          </span>
                        ) : result.colocacao === 4 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                            4º
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-medium text-slate-400">
                            {result.colocacao}º
                          </span>
                        )}
                      </td>

                      {/* Treinador: Nome + Categoria (ME / SE / JR) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {result.jogadorNome}
                          </span>
                          <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-black text-blue-300 uppercase tracking-wider">
                            {formatCategoryAbbr(result.categoria)}
                          </span>
                        </div>
                      </td>

                      {/* Pontos Obtidos */}
                      <td className="px-4 py-3.5 text-right font-black text-base text-amber-400">
                        {result.pontos}
                      </td>

                      {/* Indicador de Clique / Affordance */}
                      <td className="py-3.5 pr-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-500 group-hover:text-amber-400 transition-colors">
                          <span className="text-[11px] font-semibold hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver
                          </span>
                          <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 px-1">
          <div className="text-xs text-slate-400">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Primeira Página */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Primeira página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Página Anterior */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Botões Numéricos de Páginas Próximas */}
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
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[32px] h-8 rounded-lg px-2 text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Próxima Página */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Última Página */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Jogador */}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
