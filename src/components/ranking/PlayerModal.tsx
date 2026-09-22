"use client";

import { X, Trophy, Award, TrendingUp, Calendar, Zap } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

export interface PlayerModalData {
  jogadorNome: string;
  jogadorId: string;
  categoria: string;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  podios: number;
  mediaColocacao: number;
  participacoes: number;
  historicoColocacoes: string;
  ultimoDeck?: string | null;
  ultimoDeckEnergia?: string | null;
  ultimoDeckIcone?: string | null;
}

interface PlayerModalProps {
  player: PlayerModalData | null;
  onClose: () => void;
}

export function PlayerModal({ player, onClose }: PlayerModalProps) {
  if (!player) return null;

  const totalJogos = player.vitorias + player.empates + player.derrotas;
  const winRate = totalJogos > 0 ? Math.round((player.vitorias / totalJogos) * 100) : 0;
  const etapasArray = player.historicoColocacoes ? player.historicoColocacoes.split(";") : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho do Jogador */}
        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-500/30">
            {player.jogadorNome.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-white">{player.jogadorNome}</h3>
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/30">
                {player.categoria}
              </span>
            </div>
            {player.ultimoDeck ? (
              <div className="mt-1 flex items-center gap-2">
                <EnergyBadge energyRaw={player.ultimoDeckEnergia || ""} size="sm" showLabel={false} />
                <span className="text-xs text-slate-300 font-bold">Último Deck: {player.ultimoDeck}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Atleta Oficial Liga Atlântica</p>
            )}
          </div>
        </div>

        {/* Estatísticas Chave */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3 text-center">
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-yellow-400">
              <Trophy className="h-3.5 w-3.5" /> Pontos
            </span>
            <p className="mt-1 text-2xl font-black text-white">{player.pontos}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3 text-center">
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-blue-400">
              <Award className="h-3.5 w-3.5" /> Pódios
            </span>
            <p className="mt-1 text-2xl font-black text-white">{player.podios}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3 text-center">
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" /> Win Rate
            </span>
            <p className="mt-1 text-2xl font-black text-white">{winRate}%</p>
          </div>
        </div>

        {/* Resumo de Partidas */}
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-800/30 p-4">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Partidas Jogadas: <strong className="text-white">{totalJogos}</strong></span>
            <span>Participações: <strong className="text-white">{player.participacoes} etapas</strong></span>
            <span>Média de Colocação: <strong className="text-white">#{player.mediaColocacao.toFixed(1)}</strong></span>
          </div>
          <div className="mt-2 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-700">
            <div style={{ width: `${(player.vitorias / (totalJogos || 1)) * 100}%` }} className="bg-emerald-500" title={`Vitórias: ${player.vitorias}`} />
            <div style={{ width: `${(player.empates / (totalJogos || 1)) * 100}%` }} className="bg-yellow-500" title={`Empates: ${player.empates}`} />
            <div style={{ width: `${(player.derrotas / (totalJogos || 1)) * 100}%` }} className="bg-rose-500" title={`Derrotas: ${player.derrotas}`} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">V: {player.vitorias}</span>
            <span className="text-yellow-400 font-medium">E: {player.empates}</span>
            <span className="text-rose-400 font-medium">D: {player.derrotas}</span>
          </div>
        </div>

        {/* Histórico Etapa por Etapa */}
        <div className="mt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            Histórico de Colocações nas Etapas
          </h4>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {etapasArray.map((colocacao, idx) => {
              const num = Number(colocacao);
              const isPodium = !isNaN(num) && num > 0 && num <= 4;
              const isAbsent = colocacao === "-" || !colocacao;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center h-10 w-10 rounded-lg text-xs font-bold border transition-all ${
                    isPodium
                      ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-sm shadow-yellow-500/20"
                      : isAbsent
                      ? "bg-slate-800/30 text-slate-500 border-white/5 font-normal"
                      : "bg-slate-800 text-slate-200 border-white/10"
                  }`}
                  title={`Etapa #${idx + 1}: ${isAbsent ? "Não participou" : `${colocacao}º Lugar`}`}
                >
                  <span className="text-[9px] text-slate-400 font-medium leading-none">E{idx + 1}</span>
                  <span className="leading-none mt-0.5">{isAbsent ? "—" : `${colocacao}º`}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão Fechar Inferior */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
