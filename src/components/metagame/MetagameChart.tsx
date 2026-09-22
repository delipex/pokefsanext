"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { getEnergyConfig } from "@/lib/theme/energy-tokens";

interface DeckStatItem {
  deckName: string;
  count: number;
  percent: number;
  tipoEnergia: string;
  imagem: string | null;
}

interface MetagameChartProps {
  data: DeckStatItem[];
  totalDecks: number;
}

export function MetagameChart({ data, totalDecks }: MetagameChartProps) {
  if (!data || data.length === 0) return null;

  // Pegar os top 8 para o gráfico e agrupar o resto em 'Outros'
  const top8 = data.slice(0, 8);
  const othersCount = data.slice(8).reduce((acc, d) => acc + d.count, 0);

  const chartData = [
    ...top8.map((d) => ({
      name: d.deckName,
      value: d.count,
      percent: ((d.count / totalDecks) * 100).toFixed(1),
      energy: d.tipoEnergia,
      imagem: d.imagem,
    })),
    ...(othersCount > 0
      ? [
          {
            name: "Outros Decks",
            value: othersCount,
            percent: ((othersCount / totalDecks) * 100).toFixed(1),
            energy: "colorless",
            imagem: null,
          },
        ]
      : []),
  ];

  const ENERGY_HEX_COLORS: Record<string, string> = {
    grass: "#10b981",
    fire: "#f97316",
    water: "#0ea5e9",
    lightning: "#eab308",
    electric: "#eab308",
    psychic: "#d946ef",
    fighting: "#ea580c",
    darkness: "#a855f7",
    dark: "#a855f7",
    metal: "#94a3b8",
    dragon: "#f59e0b",
    colorless: "#64748b",
  };

  const getColor = (energy: string) => {
    const norm = energy.toLowerCase().split("+")[0].trim();
    return ENERGY_HEX_COLORS[norm] || "#3b82f6";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl shadow-xl">
      {/* Gráfico Donut */}
      <div className="flex flex-col items-center justify-center">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          Participação no Metagame (Top Arquétipos)
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.energy)} stroke="rgba(0,0,0,0.4)" />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl text-xs text-white">
                        <p className="font-extrabold text-sm">{item.name}</p>
                        <p className="text-slate-400 mt-0.5">
                          {item.value} jogadores ({item.percent}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="flex flex-col justify-center">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          Contagem de Jogadores por Deck
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top8} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis
                type="category"
                dataKey="deckName"
                stroke="#94a3b8"
                fontSize={11}
                width={110}
                tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 13)}…` : val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-950/95 p-2.5 shadow-2xl text-xs text-white">
                        <p className="font-bold">{item.deckName}</p>
                        <p className="text-yellow-400 font-semibold">{item.count} jogadores</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {top8.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={getColor(entry.tipoEnergia)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
