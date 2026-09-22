"use client";

import { useState } from "react";
import { Award, Trophy, Sparkles, Shield, Flame, X, Info, ChevronRight, Activity, Zap } from "lucide-react";

interface SeasonAwardsSectionProps {
  awards: {
    gold: any | null;
    gym: any | null;
    ditto: any | null;
    murcha: any | null;
  };
}

export function SeasonAwardsSection({ awards }: SeasonAwardsSectionProps) {
  const { gold, gym, ditto, murcha } = awards;
  const [selectedAward, setSelectedAward] = useState<string | null>(null);

  if (!gold && !gym && !ditto && !murcha) return null;

  return (
    <section className="relative my-8 sm:my-10 space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
              <Award className="h-4 w-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Premiações Projetadas da Temporada
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Reconhecimento oficial dos atletas por performance, assiduidade, variedade e persistência
          </p>
        </div>
      </div>

      {/* Grid Horizontal 2x2 Refinado (Layout Compacto & Distinto do Pódio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. POKÉBOLA DE OURO */}
        {gold && (
          <div
            onClick={() => setSelectedAward("gold")}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-yellow-500/5 backdrop-blur-xl transition-all hover:border-yellow-400 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 border border-yellow-500/40 shadow-md overflow-hidden">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                  alt="Pokébola de Ouro"
                  className="h-8 w-8 object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.6)]"
                  style={{ filter: "sepia(1) saturate(10) hue-rotate(20deg) brightness(1.2)" }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                    Treinador Completo
                  </span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-yellow-400 transition-colors truncate">
                  {gold.player}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Maior saldo líquido: <strong className="text-yellow-400 font-bold">+{gold.saldo} vitórias</strong>
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 text-xs font-black text-yellow-300">
                +{gold.saldo} <ChevronRight className="h-3 w-3 text-yellow-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                {gold.wins}V - {gold.losses}D ({gold.participations} et.)
              </span>
            </div>
          </div>
        )}

        {/* 2. LÍDER DE GINÁSIO */}
        {gym && (
          <div
            onClick={() => setSelectedAward("gym")}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-blue-500/5 backdrop-blur-xl transition-all hover:border-blue-400 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/40 shadow-md">
                <span className="text-2xl">🏛️</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    Maior Assiduidade
                  </span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors truncate">
                  {gym.player}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Presença máxima: <strong className="text-blue-400 font-bold">{gym.participations} etapas</strong>
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-xs font-black text-blue-300">
                {gym.participations} Etapas <ChevronRight className="h-3 w-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                {gym.points} PTS acumulados
              </span>
            </div>
          </div>
        )}

        {/* 3. DITTO PLAYER */}
        {ditto && (
          <div
            onClick={() => setSelectedAward("ditto")}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-purple-500/5 backdrop-blur-xl transition-all hover:border-purple-400 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40 shadow-md overflow-hidden">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png"
                  alt="Ditto"
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Maior Variedade
                  </span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-purple-400 transition-colors truncate">
                  {ditto.player}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Diversidade: <strong className="text-purple-400 font-bold">{ditto.count} arquétipos</strong>
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-xs font-black text-purple-300">
                {ditto.count} Decks <ChevronRight className="h-3 w-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                Média #{ditto.mediaColocacao.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* 4. POKÉBOLA MURCHA */}
        {murcha && (
          <div
            onClick={() => setSelectedAward("murcha")}
            className="group relative flex items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-rose-500/5 backdrop-blur-xl transition-all hover:border-rose-400 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 shadow-md overflow-hidden">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-sludge.png"
                  alt="Pokébola Murcha"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    Persistência & Garra
                  </span>
                </div>
                <h3 className="text-base font-black text-white group-hover:text-rose-400 transition-colors truncate">
                  {murcha.player}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Superação: <strong className="text-rose-400 font-bold">+{murcha.deficit} derrotas</strong>
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-black text-rose-300">
                +{murcha.deficit} <ChevronRight className="h-3 w-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                {murcha.losses}D vs {murcha.wins}V
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Premiação */}
      {selectedAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 space-y-4">
            <button
              onClick={() => setSelectedAward(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {selectedAward === "gold" && (
              <div>
                <div className="flex items-center gap-2 text-yellow-400 text-lg font-black">
                  <span>🥇</span> Pokébola de Ouro
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Premiação anual concedida ao treinador com a melhor consistência e saldo líquido de vitórias (V - D) na temporada, exigindo um corte mínimo de participação em etapas oficiais.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-800/60 p-4 space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Líder Atual:</span> <strong className="text-white">{gold?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Saldo Líquido:</span> <strong className="text-yellow-400">+{gold?.saldo} vitórias</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Win Rate Oficial:</span> <strong className="text-emerald-400">{gold?.winRate}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cartel:</span> <span className="text-slate-200">{gold?.wins}V - {gold?.losses}D ({gold?.participations} etapas)</span>
                  </div>
                </div>
              </div>
            )}

            {selectedAward === "gym" && (
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-lg font-black">
                  <span>🏛️</span> Líder de Ginásio
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Concedida ao atleta com maior número de presenças oficiais e assiduidade nos torneios da Liga Atlântica ao longo de toda a temporada.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-800/60 p-4 space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Líder Atual:</span> <strong className="text-white">{gym?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Presenças:</span> <strong className="text-blue-400">{gym?.participations} etapas disputadas</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de Pontos:</span> <strong className="text-yellow-400">{gym?.points} PTS</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedAward === "ditto" && (
              <div>
                <div className="flex items-center gap-2 text-purple-400 text-lg font-black">
                  <span>🟣</span> Ditto Player
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Reconhecimento ao jogador que pilotou a maior quantidade de arquétipos diferentes durante as etapas oficiais da temporada.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-800/60 p-4 space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Líder Atual:</span> <strong className="text-white">{ditto?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de Decks:</span> <strong className="text-purple-400">{ditto?.count} arquétipos diferentes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Média de Colocação:</span> <strong className="text-blue-400">#{ditto?.mediaColocacao.toFixed(1)}</strong>
                  </div>
                  {ditto?.decks && ditto.decks.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] uppercase text-slate-400 block mb-1.5 font-bold">Decks Utilizados:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ditto.decks.map((d: string) => (
                          <span key={d} className="rounded-lg bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 border border-purple-500/30">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedAward === "murcha" && (
              <div>
                <div className="flex items-center gap-2 text-rose-400 text-lg font-black">
                  <span>🪵</span> Pokébola Murcha
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Troféu humorístico e carinhoso de persistência, premiando o atleta que enfrentou o maior déficit de derrotas mas continuou comparecendo e prestigiando a liga com garra inabalável.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-800/60 p-4 space-y-2 text-xs border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Líder Atual:</span> <strong className="text-white">{murcha?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Déficit:</span> <strong className="text-rose-400">+{murcha?.deficit} derrotas a mais</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cartel:</span> <span className="text-slate-200">{murcha?.losses}D vs {murcha?.wins}V</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
