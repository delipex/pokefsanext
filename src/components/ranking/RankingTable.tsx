"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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

// Renderizador da Posição com cores oficiais da Liga
function renderPosNumber(pos: number) {
  if (pos === 1) {
    return (
      <span className="text-base font-black text-[#ffcb05] drop-shadow-[0_0_8px_rgba(255,203,5,0.4)]">
        1
      </span>
    );
  }
  if (pos === 2) {
    return <span className="text-base font-black text-[#cbd5e1]">2</span>;
  }
  if (pos === 3) {
    return <span className="text-base font-black text-[#c2410c]">3</span>;
  }
  if (pos <= 8) {
    return <span className="text-base font-bold text-[#3b82f6]">{pos}</span>;
  }
  return <span className="text-sm font-semibold text-slate-400">{pos}</span>;
}

// Renderizador da Tag de Categoria (ME, SE, JR)
function renderCategoryBadge(catRaw?: string | null) {
  const cat = formatCategoryAbbr(catRaw);
  if (cat === "SE") {
    return (
      <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
        SE
      </span>
    );
  }
  if (cat === "JR") {
    return (
      <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
        JR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/25">
      ME
    </span>
  );
}

// Renderizador do Badge compacto de Deck (usado na visualização de etapas)
function renderDeckBadge(deckNome?: string | null, allDecks: DeckItemInfo[] = []) {
  if (!deckNome) return null;
  const deck = allDecks.find((d) => d.nome.toLowerCase() === deckNome.toLowerCase());
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {deck?.icone ? (
        <img src={deck.icone} alt={deckNome} className="h-4 w-4 object-contain rounded shrink-0" />
      ) : null}
      <span className="max-w-[130px] truncate text-[11px] font-medium text-slate-300">
        {deckNome}
      </span>
    </span>
  );
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
  const getDeckEnergy = (deckNome?: string | null): string => {
    if (!deckNome) return "colorless";
    const found = allDecks.find((d) => d.nome.toLowerCase() === deckNome.toLowerCase());
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

      {/* Banner Informativo da Etapa Selecionada (Visual Idêntico ao Original) */}
      {!isGeneralRanking && currentStage && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-slate-300 backdrop-blur-md">
          <span className="text-slate-400">Você está visualizando:</span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
            {currentStage.data}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Evento:</span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
            {currentStage.tipo}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Multiplicador:</span>
          <span className="rounded bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
            {currentStage.multiplicador}x
          </span>
          {currentStage.campeaoNome && (
            <>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-amber-400">
                🏆 Campeão: {currentStage.campeaoNome}
              </span>
            </>
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

      {/* Tabela de Classificação Responsiva com Design Autêntico da Liga Atlântica */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f172a]/70 shadow-2xl backdrop-blur-xl">
        {isGeneralRanking ? (
          /* TABELA 1: RANKING GERAL CONSOLIDADO */
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="py-4 pl-6 pr-2 text-left w-16">POS</th>
                <th scope="col" className="px-6 py-4">TREINADOR</th>
                <th scope="col" className="px-4 py-4 text-center w-24">CAT</th>
                <th scope="col" className="px-6 py-4 text-center w-36">PONTOS</th>
                <th scope="col" className="py-4 pr-6 pl-2 text-center w-28">V-E-D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedGeneralPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Nenhum jogador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedGeneralPlayers.map((player, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index;
                  const pos = globalIndex + 1;
                  const v = player.vitorias || 0;
                  const e = player.empates || 0;
                  const d = player.derrotas || 0;
                  const total = v + e + d;
                  const winRate = total > 0 ? Math.round((v / total) * 100) : 0;
                  const vPercent = total > 0 ? (v / total) * 100 : 0;
                  const ePercent = total > 0 ? (e / total) * 100 : 0;
                  const dPercent = total > 0 ? (d / total) * 100 : 0;

                  return (
                    <tr
                      key={player.jogadorId || globalIndex}
                      onClick={() => setSelectedPlayer(player)}
                      className="group cursor-pointer transition-all duration-150 hover:bg-white/[0.06] hover:shadow-[inset_4px_0_0_0_#ffcb05] even:bg-black/15"
                    >
                      {/* POS */}
                      <td className="py-4 pl-6 pr-2 text-left font-mono">
                        {renderPosNumber(pos)}
                      </td>

                      {/* TREINADOR */}
                      <td className="px-6 py-4 font-bold text-white group-hover:text-amber-400 transition-colors">
                        {player.jogadorNome}
                      </td>

                      {/* CAT */}
                      <td className="px-4 py-4 text-center">
                        {renderCategoryBadge(player.categoria)}
                      </td>

                      {/* PONTOS */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-base text-[#ffcb05] tracking-wide">
                          {player.pontos} PTS
                        </span>
                      </td>

                      {/* V-E-D */}
                      <td className="py-4 pr-6 pl-2 text-center">
                        <div
                          className="inline-flex flex-col items-center gap-1"
                          title={`${v} Vitórias, ${e} Empates, ${d} Derrotas`}
                        >
                          <span className="text-xs font-bold text-slate-300">{winRate}%</span>
                          {total > 0 ? (
                            <div className="flex h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                              {vPercent > 0 && <div className="bg-[#10b981] h-full" style={{ width: `${vPercent}%` }} />}
                              {ePercent > 0 && <div className="bg-[#f59e0b] h-full" style={{ width: `${ePercent}%` }} />}
                              {dPercent > 0 && <div className="bg-[#ef4444] h-full" style={{ width: `${dPercent}%` }} />}
                            </div>
                          ) : (
                            <div className="h-1.5 w-12 rounded-full bg-white/10" />
                          )}
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
            <thead className="border-b border-white/10 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="py-4 pl-6 pr-2 text-left w-16">POS</th>
                <th scope="col" className="px-6 py-4">TREINADOR</th>
                <th scope="col" className="px-4 py-4 text-center w-24">CAT</th>
                <th scope="col" className="px-6 py-4 text-center w-36">PONTOS</th>
                <th scope="col" className="py-4 pr-6 pl-2 text-center w-28">V-E-D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedStageResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Nenhum resultado para esta etapa com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedStageResults.map((result, idx) => {
                  const pos = result.colocacao;
                  const v = result.vitorias || 0;
                  const e = result.empates || 0;
                  const d = result.derrotas || 0;
                  const total = v + e + d;
                  const winRate = total > 0 ? Math.round((v / total) * 100) : 0;
                  const vPercent = total > 0 ? (v / total) * 100 : 0;
                  const ePercent = total > 0 ? (e / total) * 100 : 0;
                  const dPercent = total > 0 ? (d / total) * 100 : 0;
                  const mult = currentStage?.multiplicador || 1;
                  const basePts = mult > 0 ? result.pontos / mult : result.pontos;

                  return (
                    <tr
                      key={result.id || idx}
                      onClick={() => handleOpenStagePlayerModal(result)}
                      className="group cursor-pointer transition-all duration-150 hover:bg-white/[0.06] hover:shadow-[inset_4px_0_0_0_#ffcb05] even:bg-black/15"
                    >
                      {/* POS */}
                      <td className="py-4 pl-6 pr-2 text-left font-mono">
                        {renderPosNumber(pos)}
                      </td>

                      {/* TREINADOR + DECK BADGE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {result.jogadorNome}
                          </span>
                          {result.deckNome && renderDeckBadge(result.deckNome, allDecks)}
                        </div>
                      </td>

                      {/* CAT */}
                      <td className="px-4 py-4 text-center">
                        {renderCategoryBadge(result.categoria)}
                      </td>

                      {/* PONTOS COM BASE × MULTIPLICADOR */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-base text-[#ffcb05] tracking-wide block">
                          {result.pontos} PTS
                        </span>
                        {mult !== 1 && (
                          <span className="text-[11px] font-semibold text-[#ffcb05]/80 block mt-0.5">
                            {Number.isInteger(basePts) ? basePts : basePts.toFixed(1)} &times; {mult}x
                          </span>
                        )}
                      </td>

                      {/* V-E-D */}
                      <td className="py-4 pr-6 pl-2 text-center">
                        <div
                          className="inline-flex flex-col items-center gap-1"
                          title={`${v} Vitórias, ${e} Empates, ${d} Derrotas`}
                        >
                          <span className="text-xs font-bold text-slate-300">{winRate}%</span>
                          {total > 0 ? (
                            <div className="flex h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                              {vPercent > 0 && <div className="bg-[#10b981] h-full" style={{ width: `${vPercent}%` }} />}
                              {ePercent > 0 && <div className="bg-[#f59e0b] h-full" style={{ width: `${ePercent}%` }} />}
                              {dPercent > 0 && <div className="bg-[#ef4444] h-full" style={{ width: `${dPercent}%` }} />}
                            </div>
                          ) : (
                            <div className="h-1.5 w-12 rounded-full bg-white/10" />
                          )}
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
