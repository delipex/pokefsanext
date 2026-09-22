"use client";

import { useState } from "react";
import { Award, ChevronRight, X, Sparkles, Trophy, Swords, ShieldAlert, ArrowRight } from "lucide-react";
import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

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
  const [selectedAward, setSelectedAward] = useState<"gold" | "gym" | "ditto" | "murcha" | null>(null);

  if (!gold && !gym && !ditto && !murcha) return null;

  return (
    <section id="premios-temporada" className="relative space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center gap-2 px-1">
        <Award className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
          Premiações Projetadas da Temporada
        </h2>
      </div>

      {/* Grid de 4 Cards (Layout Limpo, Balanceado e Responsivo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* =========================================================
            CARD 1: POKÉBOLA DE OURO
           ========================================================= */}
        {gold && (
          <div
            onClick={() => setSelectedAward("gold")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-amber-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-3">
              {/* Header com Ícone e Título */}
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

              {/* Descrição suave */}
              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Maior saldo líquido de vitórias (+{gold.saldo}) com menor taxa de derrotas.
              </p>
            </div>

            {/* Rodapé e CTA */}
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
          </div>
        )}

        {/* =========================================================
            CARD 2: LÍDER DO GINÁSIO
           ========================================================= */}
        {gym && (
          <div
            onClick={() => setSelectedAward("gym")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-blue-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-3">
              {/* Header com Ícone e Título */}
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

              {/* Descrição suave */}
              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                O treinador mais assíduo nas etapas e torneios oficiais da temporada.
              </p>
            </div>

            {/* Rodapé e CTA */}
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
          </div>
        )}

        {/* =========================================================
            CARD 3: DITTO PLAYER
           ========================================================= */}
        {ditto && (
          <div
            onClick={() => setSelectedAward("ditto")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-purple-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-3">
              {/* Header com Ícone e Título */}
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

              {/* Descrição suave */}
              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Mais decks diferentes usados ao longo de toda a temporada.
              </p>

              {/* Mini amostra dos decks usados */}
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

            {/* Rodapé e CTA */}
            <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300">Variedade: {ditto.count} Decks</span>
                <span className="text-slate-400 font-medium tabular-nums">Média: {ditto.mediaColocacao?.toFixed(1) || "0"}°</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all">
                <span>Ver classificação e detalhes</span>
                <ArrowRight className="h-3 w-3 text-purple-400/70 group-hover:text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            CARD 4: POKÉBOLA MURCHA
           ========================================================= */}
        {murcha && (
          <div
            onClick={() => setSelectedAward("murcha")}
            className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.04] hover:border-rose-400/40 bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <div className="space-y-3">
              {/* Header com Ícone e Título */}
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

              {/* Descrição suave */}
              <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                Maior déficit de derrotas (+{murcha.deficit}) e persistência nas etapas.
              </p>
            </div>

            {/* Rodapé e CTA */}
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
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL DE DETALHAMENTO DO CÁLCULO DO PRÊMIO
         ========================================================= */}
      {selectedAward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedAward(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f172a]/95 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAward(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* MODAL 1: POKÉBOLA DE OURO */}
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
                    <p className="text-xs text-amber-400 font-bold">Detalhamento de Cálculo do Prêmio</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Prêmio de honra máxima individual da temporada pelo Saldo Líquido de Vitórias (V - D), consagrando o treinador mais consistente e vitorioso que mais venceu além do que perdeu.
                </p>

                {/* Box de Critérios Oficiais */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 space-y-1">
                  <strong className="block text-amber-300 font-bold mb-1">Critérios Oficiais de Performance (Saldo V - D):</strong>
                  <p>• <strong>1º Critério Principal:</strong> Maior Saldo Positivo (Vitórias – Derrotas).</p>
                  <p>• <strong>2º Desempate:</strong> Maior Quantidade de Etapas Disputadas (assiduidade).</p>
                  <p>• <strong>3º Desempate:</strong> Maior Win Rate % (V ÷ Total de Jogos).</p>
                  <p>• <strong>4º Desempate:</strong> Maior número de Pódios (Top 4).</p>
                  <span className="block text-[11px] text-amber-300/70 pt-1 italic">* Exige corte mínimo de 4 etapas disputadas na temporada.</span>
                </div>

                {/* Estatísticas do Líder */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Líder Atual:</span>
                    <strong className="text-sm font-black text-white">{gold?.player}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Saldo Líquido (V – D):</span>
                    <strong className="text-base font-black text-[#ffcb05]">+{gold?.saldo} Vitórias</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Assiduidade / Presença:</span>
                    <span className="text-slate-200 font-bold">{gold?.participations} etapas disputadas</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cartel Real:</span>
                    <span className="text-slate-200 font-bold">{gold?.wins}V - {gold?.losses}D ({gold?.winRate}% WR)</span>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 2: LÍDER DO GINÁSIO */}
            {selectedAward === "gym" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/40 text-2xl">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Líder do Ginásio</h3>
                    <p className="text-xs text-blue-400 font-bold">Detalhamento de Cálculo do Prêmio</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Concedido ao atleta mais assíduo e leal que mais participou dos torneios oficiais ao longo de toda a temporada.
                </p>

                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200/90 space-y-1">
                  <strong className="block text-blue-300 font-bold mb-1">Critérios Oficiais de Assiduidade:</strong>
                  <p>• <strong>1º Critério Principal:</strong> Maior número de etapas oficiais disputadas.</p>
                  <p>• <strong>2º Desempate:</strong> Maior pontuação total acumulada na temporada.</p>
                  <p>• <strong>3º Desempate:</strong> Maior número de vitórias totais.</p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Líder Atual:</span>
                    <strong className="text-sm font-black text-white">{gym?.player}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Presenças Confirmadas:</span>
                    <strong className="text-base font-black text-blue-400">{gym?.participations} Etapas</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total de Pontos:</span>
                    <strong className="text-sm font-black text-[#ffcb05]">{gym?.points} PTS</strong>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 3: DITTO PLAYER */}
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
                    <p className="text-xs text-purple-400 font-bold">Detalhamento de Cálculo do Prêmio</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Reconhecimento ao mestre do metagame versátil, premiando o jogador que pilotou a maior quantidade de arquétipos diferentes durante a temporada.
                </p>

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 text-xs text-purple-200/90 space-y-1">
                  <strong className="block text-purple-300 font-bold mb-1">Critérios de Versatilidade de Decks:</strong>
                  <p>• <strong>1º Critério Principal:</strong> Maior número de arquétipos únicos pilotados.</p>
                  <p>• <strong>2º Desempate:</strong> Melhor média de colocação com os diferentes decks.</p>
                  <p>• <strong>3º Desempate:</strong> Maior número de etapas disputadas.</p>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Líder Atual:</span>
                    <strong className="text-sm font-black text-white">{ditto?.player}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Variedade de Decks:</span>
                    <strong className="text-base font-black text-purple-400">{ditto?.count} Decks Únicos</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Média de Colocação:</span>
                    <span className="text-slate-200 font-bold">#{ditto?.mediaColocacao?.toFixed(1) || "0"}</span>
                  </div>

                  {ditto?.decks && ditto.decks.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Decks Utilizados na Temporada:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ditto.decks.map((d: any, i: number) => {
                          const dName = typeof d === "string" ? d : d.nome;
                          const dEnergy = typeof d === "string" ? "colorless" : d.tipoEnergia;
                          const energyCfg = getMultiEnergyConfig(dEnergy);
                          return (
                            <span
                              key={i}
                              className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
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
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODAL 4: POKÉBOLA MURCHA */}
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
                    <p className="text-xs text-rose-400 font-bold">Detalhamento de Cálculo do Prêmio</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Troféu carinhoso de resiliência e persistência, celebrando o jogador que enfrentou o maior número de derrotas mas nunca desistiu e continuou prestigiando a liga com garra!
                </p>

                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-200/90 space-y-1">
                  <strong className="block text-rose-300 font-bold mb-1">Critérios Oficiais de Resiliência:</strong>
                  <p>• <strong>1º Critério Principal:</strong> Maior Déficit de Derrotas (Derrotas – Vitórias).</p>
                  <p>• <strong>2º Desempate:</strong> Maior quantidade de etapas disputadas.</p>
                  <span className="block text-[11px] text-rose-300/70 pt-1 italic">* Exige corte mínimo de 3 etapas disputadas.</span>
                </div>

                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Líder Atual:</span>
                    <strong className="text-sm font-black text-white">{murcha?.player}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Déficit de Derrotas:</span>
                    <strong className="text-base font-black text-rose-400">+{murcha?.deficit} Derrotas</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Cartel Geral:</span>
                    <span className="text-slate-200 font-bold">{murcha?.losses} Derrotas vs {murcha?.wins} Vitórias</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Fechar */}
            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedAward(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors border border-white/10"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
