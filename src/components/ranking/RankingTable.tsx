"use client";

import { useState, useMemo } from "react";
import { Search, Calendar, Sparkles } from "lucide-react";
import { PlayerModalData, PlayerModal } from "./PlayerModal";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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

// Helper para formatar o nome do deck com iniciais maiúsculas e "Ex"
function formatDeckName(name?: string | null): string {
  if (!name) return "";
  const lowerWords = ["da", "de", "do", "das", "dos", "e", "com", "no", "na"];
  return name
    .split(" ")
    .map((word, idx) => {
      const w = word.trim();
      if (!w) return "";
      const lower = w.toLowerCase();
      if (lower === "ex") return "Ex";
      if (lower === "gx") return "GX";
      if (lower === "vmax") return "VMAX";
      if (lower === "vstar") return "VSTAR";
      if (lower === "v") return "V";
      if (lowerWords.includes(lower) && idx > 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\s*\+\s*/g, " + ");
}

export function RankingTable({ initialPlayers, etapas = [], allDecks = [] }: RankingTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [selectedStageDate, setSelectedStageDate] = useState<string>("general");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerModalData | null>(null);

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
        p.categoria.toUpperCase() === selectedCategory.toUpperCase();

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
        ((r.categoria || "Master").toUpperCase() === selectedCategory.toUpperCase());

      const matchSearch =
        r.jogadorNome.toLowerCase().includes(search.toLowerCase()) ||
        (r.jogadorId && r.jogadorId.includes(search)) ||
        (r.deckNome && r.deckNome.toLowerCase().includes(search.toLowerCase()));

      return matchCategory && matchSearch;
    });
  }, [currentStage, selectedCategory, search]);

  const categories = ["TODOS", "MASTER", "SENIOR", "JUNIOR"];

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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-xl">
        {/* Seletor de Visão: Ranking Geral vs Etapas Individuais */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {etapas.length > 0 && (
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedStageDate}
                onChange={(e) => setSelectedStageDate(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-blue-500/30 bg-blue-950/40 px-3.5 py-2 text-xs font-bold text-blue-300 focus:outline-none focus:border-blue-400 cursor-pointer backdrop-blur-md"
              >
                <option value="general" className="bg-slate-900 text-white">
                  🏆 Ranking Geral Consolidado
                </option>
                <optgroup label="── Etapas da Temporada ──" className="bg-slate-900 text-slate-400">
                  {etapas.map((etapa, idx) => {
                    const stageNum = etapas.length - idx;
                    return (
                      <option key={etapa.data} value={etapa.data} className="bg-slate-900 text-white">
                        Etapa #{stageNum} • {etapa.data} ({etapa.tipo} • {etapa.multiplicador}x)
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

      {/* Contagem de Resultados */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Mostrando{" "}
          <strong>
            {isGeneralRanking ? filteredGeneralPlayers.length : filteredStageResults.length}
          </strong>{" "}
          participantes
        </span>
        <span>
          {isGeneralRanking ? "Temporada 5 Consolidada" : `Resultado Oficial • ${currentStage?.data}`}
        </span>
      </div>

      {/* Tabela de Classificação Responsiva */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
        {isGeneralRanking ? (
          /* TABELA 1: RANKING GERAL CONSOLIDADO */
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="border-b border-white/10 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-12">#</th>
                <th scope="col" className="px-4 py-3.5">Treinador</th>
                <th scope="col" className="px-4 py-3.5 text-right font-extrabold text-yellow-400">PTS</th>
                <th scope="col" className="px-3 py-3.5 text-center hidden md:table-cell">V / E / D</th>
                <th scope="col" className="px-3 py-3.5 text-center hidden sm:table-cell">Pódios</th>
                <th scope="col" className="px-3 py-3.5 text-center hidden lg:table-cell">Média</th>
                <th scope="col" className="px-3 py-3.5 text-center hidden sm:table-cell">Etapas</th>
                <th scope="col" className="px-4 py-3.5">Deck</th>
                <th scope="col" className="py-3.5 pr-4 pl-2 text-right">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGeneralPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhum jogador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredGeneralPlayers.map((player, index) => {
                  const pos = index + 1;
                  const isTop1 = pos === 1;
                  const isTop4 = pos <= 4;
                  const deckEnergy = player.ultimoDeckEnergia || getDeckEnergy(player.ultimoDeck);
                  const energyCfg = getMultiEnergyConfig(deckEnergy);

                  return (
                    <tr
                      key={player.jogadorId || index}
                      onClick={() => setSelectedPlayer(player)}
                      className={`group cursor-pointer transition-colors hover:bg-blue-600/10 ${
                        isTop1
                          ? "bg-yellow-500/5 font-semibold"
                          : isTop4
                          ? "bg-slate-800/20"
                          : ""
                      }`}
                    >
                      <td className="py-3.5 pl-4 pr-2 text-center font-mono">
                        {isTop1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-black text-yellow-400 border border-yellow-500/40">
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
                          <span className="text-xs text-slate-400">{pos}º</span>
                        )}
                      </td>

                      {/* Nome do Treinador com a Tag de Categoria em seguida */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {player.jogadorNome}
                          </span>
                          <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                            {player.categoria.slice(0, 3)}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-base text-yellow-400">
                        {player.pontos}
                      </td>

                      <td className="px-3 py-3.5 text-center hidden md:table-cell text-xs font-mono text-slate-300">
                        <span className="text-emerald-400 font-semibold">{player.vitorias}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-yellow-400 font-semibold">{player.empates}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-rose-400 font-semibold">{player.derrotas}</span>
                      </td>

                      <td className="px-3 py-3.5 text-center hidden sm:table-cell">
                        {player.podios > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-400 border border-yellow-500/20">
                            🏆 {player.podios}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 text-center hidden lg:table-cell text-xs font-mono text-slate-300">
                        #{player.mediaColocacao.toFixed(1)}
                      </td>

                      <td className="px-3 py-3.5 text-center hidden sm:table-cell text-xs text-slate-300 font-semibold">
                        {player.participacoes}
                      </td>

                      {/* Box do Deck Utilizado */}
                      <td className="px-4 py-3.5 text-xs">
                        {player.ultimoDeck ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md"
                            style={{
                              background: energyCfg.gradientBg,
                              border: energyCfg.borderStyle,
                            }}
                          >
                            <div className="flex items-center -space-x-1 shrink-0">
                              {energyCfg.types.map((t, i) => (
                                <span
                                  key={i}
                                  className="h-2 w-2 rounded-full border border-black/40 shadow-sm shrink-0"
                                  style={{ backgroundColor: t.hex, boxShadow: `0 0 4px ${t.hex}` }}
                                />
                              ))}
                            </div>
                            <span className="truncate max-w-[140px]">{formatDeckName(player.ultimoDeck)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">—</span>
                        )}
                      </td>

                      <td className="py-3.5 pr-4 pl-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition-all border border-white/5"
                        >
                          Ver Perfil
                        </button>
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
                <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-12">Pos</th>
                <th scope="col" className="px-4 py-3.5">Treinador</th>
                <th scope="col" className="px-4 py-3.5 text-right font-extrabold text-yellow-400">Pontos</th>
                <th scope="col" className="px-3 py-3.5 text-center">V / E / D</th>
                <th scope="col" className="px-4 py-3.5">Deck</th>
                <th scope="col" className="py-3.5 pr-4 pl-2 text-right">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStageResults.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum jogador encontrado para esta etapa com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredStageResults.map((result) => {
                  const isTop1 = result.colocacao === 1;
                  const isTop4 = result.colocacao <= 4;
                  const deckEnergy = getDeckEnergy(result.deckNome);
                  const energyCfg = getMultiEnergyConfig(deckEnergy);

                  return (
                    <tr
                      key={result.id}
                      onClick={() => handleOpenStagePlayerModal(result)}
                      className={`group cursor-pointer transition-colors hover:bg-blue-600/10 ${
                        isTop1 ? "bg-yellow-500/10 font-bold" : isTop4 ? "bg-slate-800/30" : ""
                      }`}
                    >
                      <td className="py-3.5 pl-4 pr-2 text-center">
                        {isTop1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500/20 text-sm font-black text-yellow-400 border border-yellow-500/40">
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

                      {/* Treinador com a Tag de Categoria em seguida */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {result.jogadorNome}
                          </span>
                          <span className="rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                            {(result.categoria || "Master").slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-base text-yellow-400">
                        {result.pontos}
                      </td>

                      <td className="px-3 py-3.5 text-center text-xs font-mono text-slate-300">
                        <span className="text-emerald-400 font-semibold">{result.vitorias}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-yellow-400 font-semibold">{result.empates}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-rose-400 font-semibold">{result.derrotas}</span>
                      </td>

                      {/* Box do Deck Utilizado com Cores e Indicadores de Energia */}
                      <td className="px-4 py-3.5 text-xs">
                        {result.deckNome ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md"
                            style={{
                              background: energyCfg.gradientBg,
                              border: energyCfg.borderStyle,
                            }}
                          >
                            <div className="flex items-center -space-x-1 shrink-0">
                              {energyCfg.types.map((t, i) => (
                                <span
                                  key={i}
                                  className="h-2 w-2 rounded-full border border-black/40 shadow-sm shrink-0"
                                  style={{ backgroundColor: t.hex, boxShadow: `0 0 4px ${t.hex}` }}
                                />
                              ))}
                            </div>
                            <span className="truncate max-w-[150px]">{formatDeckName(result.deckNome)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">—</span>
                        )}
                      </td>

                      <td className="py-3.5 pr-4 pl-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStagePlayerModal(result);
                          }}
                          className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-blue-600 hover:text-white transition-all border border-white/5"
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalhes do Jogador */}
      <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
