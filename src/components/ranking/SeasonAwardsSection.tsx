"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, Sparkles, Trophy, Swords, ArrowRight, Medal, Flame } from "lucide-react";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface SeasonAwardsSectionProps {
  awards: {
    gold: any | null;
    goldRanking?: any[];
    gym: any | null;
    gymRanking?: any[];
    ditto: any | null;
    dittoRanking?: any[];
    murcha: any | null;
    murchaRanking?: any[];
  };
}

export function SeasonAwardsSection({ awards }: SeasonAwardsSectionProps) {
  const {
    gold,
    goldRanking = [],
    gym,
    gymRanking = [],
    ditto,
    dittoRanking = [],
    murcha,
    murchaRanking = [],
  } = awards;

  const [selectedAward, setSelectedAward] = useState<"gold" | "gym" | "ditto" | "murcha" | null>(null);

  if (!gold && !gym && !ditto && !murcha) return null;

  return (
    <section id="premios-temporada" className="relative space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center gap-2 px-1">
        <Award className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Premiações Projetadas da Temporada
        </h2>
      </div>

      {/* Grid de 4 Cards (Layout Limpo, Balanceado e Responsivo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* =========================================================
            CARD 1: POKÉBOLA DE OURO
           ========================================================= */}
        {gold && (
          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAward("gold")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-amber-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 shadow-sm">
                  <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                    alt="Pokébola de Ouro"
                    className="h-7 w-7 object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]"
                    style={{ filter: "sepia(1) saturate(10) hue-rotate(20deg) brightness(1.2)" }}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400/90 block">
                    POKÉBOLA DE OURO
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-yellow-400 transition-colors truncate">
                    {gold.player}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Maior saldo líquido de vitórias (+{gold.saldo}) com menor taxa de derrotas.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300">Saldo: +{gold.saldo}</span>
                <span className="text-slate-400 font-medium tabular-nums">Cartel: {gold.wins}V - {gold.losses}D</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
                <span>Ver classificação completa</span>
                <ArrowRight className="h-3 w-3 text-amber-400/70 group-hover:text-amber-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            CARD 2: LÍDER DO GINÁSIO
           ========================================================= */}
        {gym && (
          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAward("gym")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-blue-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
                  <span className="text-xl">🏛️</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400/90 block">
                    LÍDER DE GINÁSIO
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors truncate">
                    {gym.player}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                O treinador mais assíduo nas etapas e torneios oficiais da temporada.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-400">Presenças: <strong className="text-blue-300 font-semibold">{gym.participations} et.</strong></span>
                <span className="font-bold text-amber-300 tabular-nums">{gym.points} PTS</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                <span>Ver classificação e detalhes</span>
                <ArrowRight className="h-3 w-3 text-blue-400/70 group-hover:text-blue-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            CARD 3: DITTO PLAYER
           ========================================================= */}
        {ditto && (
          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAward("ditto")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-purple-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 shadow-sm">
                  <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
                    alt="Ditto"
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400/90 block">
                    DITTO PLAYER
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-colors truncate">
                    {ditto.player}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Mais decks diferentes usados ao longo de toda a temporada.
              </p>

              {ditto.decks && ditto.decks.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 max-h-14 overflow-hidden">
                  {ditto.decks.slice(0, 3).map((d: any, i: number) => {
                    const dName = typeof d === "string" ? d : d.nome;
                    return (
                      <span
                        key={i}
                        className="rounded bg-purple-950/40 border border-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-300 truncate max-w-[110px]"
                      >
                        {dName}
                      </span>
                    );
                  })}
                  {ditto.decks.length > 3 && (
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-normal text-slate-400">
                      +{ditto.decks.length - 3} decks
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300">Variedade: {ditto.count} Decks</span>
                <span className="text-slate-400 font-medium tabular-nums">Média: #{ditto.mediaColocacao?.toFixed(1) || "0"}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all">
                <span>Ver classificação e detalhes</span>
                <ArrowRight className="h-3 w-3 text-purple-400/70 group-hover:text-purple-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================
            CARD 4: POKÉBOLA MURCHA
           ========================================================= */}
        {murcha && (
          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAward("murcha")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-rose-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-colors cursor-pointer"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 shadow-sm">
                  <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-sludge.png"
                    alt="Pokébola Murcha"
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/90 block">
                    POKÉBOLA MURCHA
                  </span>
                  <h3 className="text-base font-black text-white group-hover:text-rose-400 transition-colors truncate">
                    {murcha.player}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Maior déficit de derrotas (+{murcha.deficit}) e persistência nas etapas.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300">Déficit: +{murcha.deficit}</span>
                <span className="text-slate-400 font-medium tabular-nums">Cartel: {murcha.losses}D vs {murcha.wins}V</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all">
                <span>Ver classificação e detalhes</span>
                <ArrowRight className="h-3 w-3 text-rose-400/70 group-hover:text-rose-400" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* =========================================================
          MODAL COM O RANKING COMPLETO DE CADA PREMIAÇÃO
         ========================================================= */}
      <AnimatePresence>
        {selectedAward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setSelectedAward(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f172a]/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 space-y-5 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iOS Handle Indicator */}
              <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-2" />

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedAward(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* ==================== 1. MODAL POKÉBOLA DE OURO ==================== */}
              {selectedAward === "gold" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/40">
                      <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                        alt="Pokébola de Ouro"
                        className="h-8 w-8 object-contain"
                        style={{ filter: "sepia(1) saturate(10) hue-rotate(20deg) brightness(1.2)" }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Pokébola de Ouro</h3>
                      <p className="text-xs text-amber-400 font-bold">Classificação Oficial de Saldo (V - D)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Premiação pelo <strong>Maior Saldo Líquido de Vitórias</strong> (mínimo de 2 etapas disputadas na temporada).
                  </p>

                  {/* Tabela de Ranking dos Concorrentes */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 px-1">
                      Classificação dos Treinadores:
                    </h4>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden divide-y divide-white/5">
                      {goldRanking.map((p, idx) => {
                        const pos = idx + 1;
                        const isTop1 = pos === 1;
                        return (
                          <div
                            key={p.id || p.player}
                            className={`flex items-center justify-between p-3 sm:px-4 text-xs ${
                              isTop1 ? "bg-amber-500/10" : "hover:bg-white/[0.02]"
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                                  pos === 1
                                    ? "bg-amber-500 text-slate-950 font-bold"
                                    : pos === 2
                                    ? "bg-slate-300 text-slate-950 font-bold"
                                    : pos === 3
                                    ? "bg-amber-700 text-white font-bold"
                                    : "bg-white/5 text-slate-400"
                                }`}
                              >
                                {pos}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-bold truncate block ${isTop1 ? "text-amber-300 text-sm" : "text-white"}`}>
                                  {p.player}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.participations} etapas • {p.wins}V - {p.losses}D ({p.winRate}% WR)
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-sm sm:text-base text-amber-400 tabular-nums">
                                +{p.saldo}
                              </span>
                              <span className="block text-[9px] font-semibold text-slate-400">SALDO</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 2. MODAL LÍDER DE GINÁSIO ==================== */}
              {selectedAward === "gym" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/40 text-2xl">
                      🏛️
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Líder do Ginásio</h3>
                      <p className="text-xs text-blue-400 font-bold">Classificação de Assiduidade e Presença</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Consagração ao atleta mais leal e constante com <strong>Maior Quantidade de Etapas Disputadas</strong>.
                  </p>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 px-1">
                      Top Treinadores em Participações:
                    </h4>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden divide-y divide-white/5">
                      {gymRanking.map((p, idx) => {
                        const pos = idx + 1;
                        const isTop1 = pos === 1;
                        return (
                          <div
                            key={p.id || p.player}
                            className={`flex items-center justify-between p-3 sm:px-4 text-xs ${
                              isTop1 ? "bg-blue-500/10" : "hover:bg-white/[0.02]"
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                                  pos === 1
                                    ? "bg-blue-500 text-white font-bold"
                                    : pos === 2
                                    ? "bg-slate-300 text-slate-950 font-bold"
                                    : pos === 3
                                    ? "bg-amber-700 text-white font-bold"
                                    : "bg-white/5 text-slate-400"
                                }`}
                              >
                                {pos}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-bold truncate block ${isTop1 ? "text-blue-300 text-sm" : "text-white"}`}>
                                  {p.player}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.points} PTS acumulados • {p.wins} vitórias • {p.podiums} pódios
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-sm sm:text-base text-blue-400 tabular-nums">
                                {p.participations}
                              </span>
                              <span className="block text-[9px] font-semibold text-slate-400">ETAPAS</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 3. MODAL DITTO PLAYER ==================== */}
              {selectedAward === "ditto" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/40">
                      <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
                        alt="Ditto"
                        className="h-9 w-9 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Ditto Player</h3>
                      <p className="text-xs text-purple-400 font-bold">Classificação de Variedade de Decks</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Reconhecimento ao mestre do metagame versátil que pilotou a <strong>maior diversidade de arquétipos</strong>.
                  </p>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 px-1">
                      Ranking de Versatilidade:
                    </h4>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden divide-y divide-white/5">
                      {dittoRanking.map((p, idx) => {
                        const pos = idx + 1;
                        const isTop1 = pos === 1;
                        return (
                          <div
                            key={p.player}
                            className={`p-3 sm:px-4 text-xs ${
                              isTop1 ? "bg-purple-500/10" : "hover:bg-white/[0.02]"
                            } transition-colors space-y-2`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                                    pos === 1
                                      ? "bg-purple-500 text-white font-bold"
                                      : pos === 2
                                      ? "bg-slate-300 text-slate-950 font-bold"
                                      : pos === 3
                                      ? "bg-amber-700 text-white font-bold"
                                      : "bg-white/5 text-slate-400"
                                  }`}
                                >
                                  {pos}
                                </span>
                                <div className="min-w-0">
                                  <span className={`font-bold truncate block ${isTop1 ? "text-purple-300 text-sm" : "text-white"}`}>
                                    {p.player}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {p.participations} etapas • Média de colocação: #{p.mediaColocacao?.toFixed(1) || "0"}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-black text-sm sm:text-base text-purple-400 tabular-nums">
                                  {p.count}
                                </span>
                                <span className="block text-[9px] font-semibold text-slate-400">DECKS</span>
                              </div>
                            </div>

                            {/* Decks pilotados */}
                            {p.decks && p.decks.length > 0 && (
                              <div className="flex flex-wrap gap-1 pl-9">
                                {p.decks.map((d: any, dIdx: number) => {
                                  const dName = typeof d === "string" ? d : d.nome;
                                  const dEnergy = typeof d === "string" ? "colorless" : d.tipoEnergia;
                                  const energyCfg = getMultiEnergyConfig(dEnergy);
                                  return (
                                    <span
                                      key={dIdx}
                                      className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                                      style={{
                                        background: energyCfg.gradientBg,
                                        border: energyCfg.borderStyle,
                                      }}
                                    >
                                      {dName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== 4. MODAL POKÉBOLA MURCHA ==================== */}
              {selectedAward === "murcha" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/40">
                      <img
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-sludge.png"
                        alt="Pokébola Murcha"
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">Pokébola Murcha</h3>
                      <p className="text-xs text-rose-400 font-bold">Classificação de Resiliência (Déficit D - V)</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Troféu de resiliência e persistência aos guerreiros que acumularam o <strong>maior déficit de derrotas</strong> mas seguiram firmes prestigiando a liga!
                  </p>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 px-1">
                      Ranking de Resiliência:
                    </h4>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden divide-y divide-white/5">
                      {murchaRanking.map((p, idx) => {
                        const pos = idx + 1;
                        const isTop1 = pos === 1;
                        return (
                          <div
                            key={p.id || p.player}
                            className={`flex items-center justify-between p-3 sm:px-4 text-xs ${
                              isTop1 ? "bg-rose-500/10" : "hover:bg-white/[0.02]"
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black text-xs ${
                                  pos === 1
                                    ? "bg-rose-500 text-white font-bold"
                                    : pos === 2
                                    ? "bg-slate-300 text-slate-950 font-bold"
                                    : pos === 3
                                    ? "bg-amber-700 text-white font-bold"
                                    : "bg-white/5 text-slate-400"
                                }`}
                              >
                                {pos}
                              </span>
                              <div className="min-w-0">
                                <span className={`font-bold truncate block ${isTop1 ? "text-rose-300 text-sm" : "text-white"}`}>
                                  {p.player}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {p.participations} etapas • {p.losses} derrotas vs {p.wins} vitórias
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-sm sm:text-base text-rose-400 tabular-nums">
                                +{p.deficit}
                              </span>
                              <span className="block text-[9px] font-semibold text-slate-400">DÉFICIT</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Fechar */}
              <div className="pt-3 text-right border-t border-white/10">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAward(null)}
                  className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-white/10 cursor-pointer"
                >
                  Fechar Classificação
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
