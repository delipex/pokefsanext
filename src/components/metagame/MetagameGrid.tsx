"use client";

import { useState } from "react";
import { Search, Flame, ExternalLink, Sparkles } from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

export interface DeckItem {
  id: number;
  nome: string;
  tipoEnergia: string;
  imagem: string | null;
  limitless: string | null;
  icone: string | null;
}

interface MetagameGridProps {
  decks: DeckItem[];
}

export function MetagameGrid({ decks }: MetagameGridProps) {
  const [search, setSearch] = useState("");
  const [selectedEnergy, setSelectedEnergy] = useState<string>("TODAS");

  const energies = [
    "TODAS",
    "grass",
    "fire",
    "water",
    "lightning",
    "psychic",
    "fighting",
    "darkness",
    "metal",
    "dragon",
    "colorless",
  ];

  const filteredDecks = decks.filter((d) => {
    const matchSearch = d.nome.toLowerCase().includes(search.toLowerCase());
    const matchEnergy =
      selectedEnergy === "TODAS" ||
      d.tipoEnergia.toLowerCase().includes(selectedEnergy.toLowerCase());
    return matchSearch && matchEnergy;
  });

  return (
    <div className="w-full space-y-6">
      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
        {/* Pílulas de Energia */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {energies.map((energy) => (
            <button
              key={energy}
              onClick={() => setSelectedEnergy(energy)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 capitalize ${
                selectedEnergy === energy
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5"
              }`}
            >
              {energy === "TODAS" ? "Todas Energias" : energy}
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar arquétipo ou Pokémon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Grid de Cards de Decks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDecks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Nenhum deck encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredDecks.map((deck) => {
            const energyTypes = deck.tipoEnergia.split("+");

            return (
              <div
                key={deck.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900/90 shadow-lg"
              >
                {/* Imagem / Arte do Deck */}
                <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-950/60 flex items-center justify-center">
                  {deck.imagem ? (
                    <img
                      src={deck.imagem}
                      alt={deck.nome}
                      className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                      <Flame className="h-8 w-8" />
                      <span className="text-xs">Arte Padrão</span>
                    </div>
                  )}

                  {/* Badges de Energia sobrepostas */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {energyTypes.map((en, idx) => (
                      <EnergyBadge key={idx} energyRaw={en} size="sm" showLabel={false} />
                    ))}
                  </div>
                </div>

                {/* Info do Deck */}
                <div className="mt-4 flex-1">
                  <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {deck.nome}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {energyTypes.map((en, idx) => (
                      <EnergyBadge key={idx} energyRaw={en} size="sm" />
                    ))}
                  </div>
                </div>

                {/* Link Limitless TCG */}
                {deck.limitless && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">Limitless TCG</span>
                    <a
                      href={deck.limitless}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Ver Lista <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
