"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Award,
  Camera,
  History,
  Sparkles,
  ExternalLink,
  Calendar,
  X,
  Zap,
  Medal,
  Crown,
  Layers,
  ChevronRight,
} from "lucide-react";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

export interface ChampionItem {
  id: number;
  temporada: string;
  campeao: string;
  vice: string;
  deckCampeao: string;
  data: string;
  fotoCampeao: string | null;
  urlDeck: string | null;
  imagemDeck: string | null;
  observacaoDeck: string | null;
}

export interface GalleryItem {
  id: number;
  titulo: string;
  descricao: string | null;
  urlImagem: string;
  data: string | null;
}

export interface LegacyScoreItem {
  id: number;
  temporada: string;
  dataFechamento: string | null;
  pos: number;
  jogador: string;
  categoria: string | null;
  pontos: string | null;
  deck: string | null;
}

interface ChampionsClientProps {
  champions: ChampionItem[];
  gallery: GalleryItem[];
  legacyScores: LegacyScoreItem[];
}

export function ChampionsClient({ champions, gallery, legacyScores }: ChampionsClientProps) {
  const [activeTab, setActiveTab] = useState<"campeoes" | "galeria" | "historico">("campeoes");
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [selectedSeason, setSelectedSeason] = useState<string>("Temporada #4");
  const [deckModalChampion, setDeckModalChampion] = useState<ChampionItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // 1. Cálculo dinâmico dos recordes históricos
  const champWins: Record<string, number> = {};
  const deckWins: Record<string, number> = {};
  const viceCounts: Record<string, number> = {};

  champions.forEach((c) => {
    const champ = (c.campeao || "").trim();
    const deck = (c.deckCampeao || "").trim();
    const vice = (c.vice || "").trim();

    if (champ) champWins[champ] = (champWins[champ] || 0) + 1;
    if (deck) deckWins[deck] = (deckWins[deck] || 0) + 1;
    if (vice && vice !== "-" && vice !== "") viceCounts[vice] = (viceCounts[vice] || 0) + 1;
  });

  const topChampion = Object.entries(champWins).sort((a, b) => b[1] - a[1])[0] || ["Nenhum", 0];
  const topDeck = Object.entries(deckWins).sort((a, b) => b[1] - a[1])[0] || ["Nenhum", 0];
  const topVice = Object.entries(viceCounts).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const totalSeasons = champions.length;

  // Temporadas disponíveis nos scores antigos
  const legacySeasons = Array.from(new Set(legacyScores.map((s) => s.temporada)));
  const filteredScores = legacyScores.filter((s) => s.temporada === selectedSeason);

  return (
    <div className="space-y-8">
      {/* Abas Superiores de Navegação Bento com Indicador Deslizante iOS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-2xl shadow-lg overflow-x-auto relative">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("campeoes")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === "campeoes"
              ? "text-slate-950 font-black"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          {activeTab === "campeoes" && (
            <motion.span
              layoutId="champions-active-pill"
              className="absolute inset-0 rounded-xl bg-[#ffcb05] shadow-lg shadow-yellow-500/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Galeria de Campeões
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("galeria")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === "galeria"
              ? "text-white font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          {activeTab === "galeria" && (
            <motion.span
              layoutId="champions-active-pill"
              className="absolute inset-0 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Galeria de Fotos
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("historico")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer ${
            activeTab === "historico"
              ? "text-white font-bold"
              : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          {activeTab === "historico" && (
            <motion.span
              layoutId="champions-active-pill"
              className="absolute inset-0 rounded-xl bg-purple-600 shadow-lg shadow-purple-600/30"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <History className="h-4 w-4" />
            Scores das Temporadas Anteriores
          </span>
        </motion.button>
      </div>

      {/* =========================================================
          1. ABA: GALERIA DE CAMPEÕES (HALL DA FAMA INTERATIVO)
         ========================================================= */}
      {activeTab === "campeoes" && (
        <div className="space-y-6">
          {/* Subtítulo */}
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            Homenagem aos vencedores e recordistas das temporadas passadas.
          </p>

          {/* Cards de Recordes Oficiais da Liga (4 Colunas no Topo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Maior Campeão */}
            <div className="flex items-center gap-3.5 rounded-3xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Crown className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  MAIOR CAMPEÃO
                </span>
                <strong className="text-sm sm:text-base font-black text-white truncate block">
                  {topChampion[0]}
                </strong>
                <span className="text-xs text-amber-400 font-semibold block">
                  {topChampion[1]}x Campeão da Liga
                </span>
              </div>
            </div>

            {/* 2. Deck Mais Vitorioso */}
            <div className="flex items-center gap-3.5 rounded-3xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
                <Zap className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DECK MAIS VITORIOSO
                </span>
                <strong className="text-sm sm:text-base font-black text-white truncate block">
                  {topDeck[0]}
                </strong>
                <span className="text-xs text-yellow-400 font-semibold block">
                  {topDeck[1]} título{topDeck[1] > 1 ? "s" : ""} conquistado{topDeck[1] > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* 3. Maior Finalista */}
            <div className="flex items-center gap-3.5 rounded-3xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-400/15 border border-slate-400/30 text-slate-300">
                <Medal className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  MAIOR FINALISTA
                </span>
                <strong className="text-sm sm:text-base font-black text-white truncate block">
                  {topVice[0]}
                </strong>
                <span className="text-xs text-slate-300 font-semibold block">
                  {topVice[1]} presenças em finais
                </span>
              </div>
            </div>

            {/* 4. Histórico Oficial */}
            <div className="flex items-center gap-3.5 rounded-3xl border border-white/[0.04] bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  HISTÓRICO OFICIAL
                </span>
                <strong className="text-sm sm:text-base font-black text-white truncate block">
                  {totalSeasons} Temporadas
                </strong>
                <span className="text-xs text-blue-300 font-semibold block">
                  Edições concluídas
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================
              ACORDEÃO INTERATIVO HORIZONTAL DOS CAMPEÕES
             ========================================================= */}
          <div className="flex flex-col lg:flex-row gap-3.5 min-h-[460px] w-full">
            {champions.map((champ, index) => {
              const isExpanded = expandedIndex === index;
              const championInitial = champ.campeao ? champ.campeao.charAt(0).toUpperCase() : "🏆";

              return (
                <div
                  key={champ.id || index}
                  onClick={() => setExpandedIndex(index)}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-500 ease-out cursor-pointer backdrop-blur-2xl flex flex-col items-center justify-center p-5 ${
                    isExpanded
                      ? "lg:flex-[4] flex-1 bg-gradient-to-b from-[#ffcb05]/10 via-[#0f172a]/95 to-[#0a0f1d] border-amber-400/40 shadow-2xl shadow-amber-500/10"
                      : "lg:flex-1 h-20 lg:h-auto bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04]"
                  }`}
                >
                  {/* ESTADO RECOLHIDO (COLLAPSED) */}
                  {!isExpanded ? (
                    <div className="flex lg:flex-col items-center justify-between w-full h-full py-1 lg:py-6 px-4 lg:px-0">
                      {/* Texto Rotacionado na Vertical (Desktop) / Horizontal (Mobile) */}
                      <span className="lg:[writing-mode:vertical-rl] lg:rotate-180 font-bold text-sm lg:text-base text-slate-400 tracking-wider">
                        {champ.temporada}
                      </span>
                      <span className="text-xl lg:text-2xl opacity-60">🏆</span>
                    </div>
                  ) : (
                    /* ESTADO EXPANDIDO (EXPANDED) */
                    <div className="flex flex-col items-center justify-center text-center space-y-4 w-full max-w-sm py-4 animate-in fade-in zoom-in-95 duration-300">
                      {/* Título da Temporada */}
                      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#ffcb05]">
                        {champ.temporada}
                      </span>

                      {/* Avatar do Campeão com Borda de Ouro e Troféu */}
                      <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1 border-2 border-[#ffcb05]/60 shadow-[0_0_25px_rgba(255,203,5,0.25)] bg-[#0f172a]">
                        {champ.fotoCampeao ? (
                          <img
                            src={champ.fotoCampeao}
                            alt={champ.campeao}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-slate-900 text-3xl font-black text-amber-400">
                            {championInitial}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0f172a] border border-amber-500/50 shadow-md text-base">
                          🏆
                        </div>
                      </div>

                      {/* Nome do Campeão */}
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          {champ.campeao}
                        </h3>
                        <div className="text-xs text-slate-300">
                          Deck Campeão: <strong className="text-[#ffcb05] font-bold">{champ.deckCampeao}</strong>
                        </div>
                        <div className="text-xs text-slate-400">
                          🥈 Vice: <strong className="text-slate-200">{champ.vice || "-"}</strong>
                        </div>
                      </div>

                      {/* Botão para Ver Decklist / Detalhes */}
                      {(champ.urlDeck || champ.imagemDeck || champ.observacaoDeck) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeckModalChampion(champ);
                          }}
                          className="mt-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-[#ffcb05] hover:text-slate-950 transition-all shadow-md shadow-amber-500/10"
                        >
                          Ver Lista de Deck
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          2. ABA: GALERIA DE FOTOS
         ========================================================= */}
      {activeTab === "galeria" && (
        <div className="space-y-4">
          {gallery.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.04] bg-white/[0.02] p-12 text-center text-slate-400 backdrop-blur-2xl">
              Nenhuma foto publicada na galeria oficial até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxImage(item.urlImagem)}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.04] bg-white/[0.02] shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/40 backdrop-blur-2xl"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    <img
                      src={item.urlImagem}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3.5">
                    <h4 className="font-bold text-xs text-white truncate">{item.titulo}</h4>
                    {item.data && <p className="text-[10px] text-slate-400 mt-0.5">{item.data}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          3. ABA: SCORES DAS TEMPORADAS ANTERIORES
         ========================================================= */}
      {activeTab === "historico" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {legacySeasons.map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSeason === season
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-white/[0.03] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {season}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/[0.04] bg-white/[0.02] shadow-2xl backdrop-blur-2xl">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-2 text-center w-14">#</th>
                  <th scope="col" className="px-4 py-3.5">Treinador</th>
                  <th scope="col" className="px-4 py-3.5 text-right font-black text-amber-400">PTS</th>
                  <th scope="col" className="px-4 py-3.5">Deck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredScores.map((score, idx) => (
                  <tr key={score.id || idx} className="hover:bg-white/[0.04] transition-colors even:bg-white/[0.01]">
                    <td className="py-3.5 pl-4 pr-2 text-center tabular-nums font-bold text-xs">
                      {score.pos === 1 ? "🥇" : score.pos === 2 ? "🥈" : score.pos === 3 ? "🥉" : `${score.pos}º`}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{score.jogador}</span>
                        <CategoryBadge category={score.categoria} size="sm" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-amber-400">{score.pontos} PTS</td>
                    <td className="px-4 py-3.5 text-xs text-slate-300">{score.deck || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DE VISUALIZAÇÃO DE DECKLIST DO CAMPEÃO COM ANIMAÇÃO IOS
         ========================================================= */}
      <AnimatePresence>
        {deckModalChampion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setDeckModalChampion(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto custom-scrollbar rounded-3xl border border-white/10 bg-[#0f172a]/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iOS Handle */}
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-3 sm:hidden" />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDeckModalChampion(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer z-20"
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6">
                {/* Lado Esquerdo: Imagem da Carta Campeã */}
                {deckModalChampion.imagemDeck && (
                  <div className="shrink-0 flex items-center justify-center">
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 w-[140px] sm:w-[200px] aspect-[63/88] flex items-center justify-center shadow-xl">
                      <img
                        src={deckModalChampion.imagemDeck}
                        alt={`Deck de ${deckModalChampion.campeao}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Lado Direito: Informações e Botão de Ação */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3.5 w-full pr-0 sm:pr-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/30">
                        {deckModalChampion.temporada}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">
                      {deckModalChampion.deckCampeao}
                    </h3>
                    <p className="text-xs text-amber-400 font-bold">
                      Campeão: <span className="text-white">{deckModalChampion.campeao}</span>
                    </p>
                  </div>

                  {deckModalChampion.observacaoDeck && (
                    <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-white/5 leading-relaxed">
                      {deckModalChampion.observacaoDeck}
                    </p>
                  )}

                  <div className="pt-2">
                    {deckModalChampion.urlDeck ? (
                      <motion.a
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.01 }}
                        href={deckModalChampion.urlDeck}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-black text-slate-950 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <span>Abrir Lista Oficial de 60 Cartas</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </motion.a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeckModalChampion(null)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Fechar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox para Galeria de Fotos com Animação iOS */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setLightboxImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative max-w-4xl max-h-[90vh] z-10"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </motion.button>
              <img src={lightboxImage} alt="Foto Expandida" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
