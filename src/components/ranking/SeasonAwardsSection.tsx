"use client";

import { useState } from "react";
import { Award, Trophy, Sparkles, Shield, Flame, X, Info } from "lucide-react";

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
    <section className="space-y-6 my-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. POKÉBOLA DE OURO */}
        {gold && (
          <div
            onClick={() => setSelectedAward("gold")}
            className="group relative flex flex-col justify-between rounded-2xl border border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-yellow-500/10 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-yellow-400 cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-2xl shadow-md">
                  🥇
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                    Treinador Completo
                  </span>
                  <h3 className="text-sm font-black text-white">Pokébola de Ouro</h3>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white group-hover:text-yellow-400 transition-colors line-clamp-1">
                  {gold.player}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maior saldo líquido de vitórias (+{gold.saldo})
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Saldo Líquido</span>
                <strong className="text-yellow-400 font-black text-sm">+{gold.saldo}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Cartel Oficial</span>
                <span className="text-slate-200 font-bold">{gold.wins}V - {gold.losses}D ({gold.participations} et.)</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. LÍDER DE GINÁSIO */}
        {gym && (
          <div
            onClick={() => setSelectedAward("gym")}
            className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-blue-400 cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/40 text-2xl shadow-md">
                  🏛️
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    Maior Assiduidade
                  </span>
                  <h3 className="text-sm font-black text-white">Líder de Ginásio</h3>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                  {gym.player}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  O competidor com maior presença na temporada
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Presenças</span>
                <strong className="text-blue-400 font-black text-sm">{gym.participations} etapas</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Pontos</span>
                <span className="text-slate-200 font-bold">{gym.points} PTS</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. DITTO PLAYER */}
        {ditto && (
          <div
            onClick={() => setSelectedAward("ditto")}
            className="group relative flex flex-col justify-between rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-purple-500/10 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-purple-400 cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/40 text-2xl shadow-md">
                  🟣
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Maior Variedade
                  </span>
                  <h3 className="text-sm font-black text-white">Ditto Player</h3>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                  {ditto.player}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mais arquétipos diferentes jogados no meta
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Variedade</span>
                <strong className="text-purple-400 font-black text-sm">{ditto.count} Decks</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Média</span>
                <span className="text-slate-200 font-bold">#{ditto.mediaColocacao.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. POKÉBOLA MURCHA */}
        {murcha && (
          <div
            onClick={() => setSelectedAward("murcha")}
            className="group relative flex flex-col justify-between rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-slate-950 p-5 shadow-xl shadow-rose-500/10 backdrop-blur-xl transition-all hover:-translate-y-1.5 hover:border-rose-400 cursor-pointer"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-2xl shadow-md">
                  🪵
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    Persistência & Garra
                  </span>
                  <h3 className="text-sm font-black text-white">Pokébola Murcha</h3>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-black text-white group-hover:text-rose-400 transition-colors line-clamp-1">
                  {murcha.player}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maior déficit de derrotas (+{murcha.deficit}) e presença constante
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Déficit</span>
                <strong className="text-rose-400 font-black text-sm">+{murcha.deficit}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Cartel</span>
                <span className="text-slate-200 font-bold">{murcha.losses}D vs {murcha.wins}V</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Premiação */}
      {selectedAward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100 space-y-4">
            <button
              onClick={() => setSelectedAward(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
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
                <div className="mt-4 rounded-xl bg-slate-800/60 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Líder Atual:</span> <strong className="text-white">{gold?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Saldo Líquido:</span> <strong className="text-yellow-400">+{gold?.saldo} vitórias</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate Oficial:</span> <strong className="text-emerald-400">{gold?.winRate}%</strong>
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
                  Concedida ao atleta com maior número de presenças oficiais e assiduidade nos torneios da Liga Atlântica.
                </p>
                <div className="mt-4 rounded-xl bg-slate-800/60 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Líder Atual:</span> <strong className="text-white">{gym?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Participações:</span> <strong className="text-blue-400">{gym?.participations} etapas</strong>
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
                  Premiação especial para o jogador camaleão, que pilotou o maior número de decks e arquétipos distintos ao longo da temporada.
                </p>
                <div className="mt-4 rounded-xl bg-slate-800/60 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Líder Atual:</span> <strong className="text-white">{ditto?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Variedade de Decks:</span> <strong className="text-purple-400">{ditto?.count} arquétipos</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedAward === "murcha" && (
              <div>
                <div className="flex items-center gap-2 text-rose-400 text-lg font-black">
                  <span>🪵</span> Pokébola Murcha
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Troféu bem-humorado de persistência e amor ao jogo para o atleta assíduo que acumulou o maior déficit de derrotas.
                </p>
                <div className="mt-4 rounded-xl bg-slate-800/60 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Líder Atual:</span> <strong className="text-white">{murcha?.player}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Déficit:</span> <strong className="text-rose-400">+{murcha?.deficit} derrotas</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAward(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
