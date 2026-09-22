export type PokemonEnergy =
  | "grass"
  | "fire"
  | "water"
  | "lightning"
  | "electric"
  | "psychic"
  | "fighting"
  | "darkness"
  | "dark"
  | "metal"
  | "dragon"
  | "colorless"
  | "fairy";

export interface EnergyConfig {
  name: string;
  label: string;
  bgGradient: string;
  borderClass: string;
  badgeBg: string;
  textClass: string;
  glowColor: string;
  iconSymbol: string;
}

export const ENERGY_CONFIGS: Record<string, EnergyConfig> = {
  grass: {
    name: "grass",
    label: "Planta",
    bgGradient: "from-emerald-500/20 via-green-600/10 to-transparent",
    borderClass: "border-emerald-500/30",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    textClass: "text-emerald-400",
    glowColor: "rgba(16, 185, 129, 0.4)",
    iconSymbol: "🌿",
  },
  fire: {
    name: "fire",
    label: "Fogo",
    bgGradient: "from-amber-500/20 via-orange-600/10 to-transparent",
    borderClass: "border-orange-500/30",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    textClass: "text-orange-400",
    glowColor: "rgba(249, 115, 22, 0.4)",
    iconSymbol: "🔥",
  },
  water: {
    name: "water",
    label: "Água",
    bgGradient: "from-sky-500/20 via-blue-600/10 to-transparent",
    borderClass: "border-sky-500/30",
    badgeBg: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    textClass: "text-sky-400",
    glowColor: "rgba(14, 165, 233, 0.4)",
    iconSymbol: "💧",
  },
  lightning: {
    name: "lightning",
    label: "Elétrico",
    bgGradient: "from-yellow-400/20 via-amber-500/10 to-transparent",
    borderClass: "border-yellow-400/30",
    badgeBg: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
    textClass: "text-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.4)",
    iconSymbol: "⚡",
  },
  electric: {
    name: "electric",
    label: "Elétrico",
    bgGradient: "from-yellow-400/20 via-amber-500/10 to-transparent",
    borderClass: "border-yellow-400/30",
    badgeBg: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
    textClass: "text-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.4)",
    iconSymbol: "⚡",
  },
  psychic: {
    name: "psychic",
    label: "Psíquico",
    bgGradient: "from-fuchsia-500/20 via-purple-600/10 to-transparent",
    borderClass: "border-fuchsia-500/30",
    badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
    textClass: "text-fuchsia-400",
    glowColor: "rgba(217, 70, 239, 0.4)",
    iconSymbol: "👁️",
  },
  fighting: {
    name: "fighting",
    label: "Lutador",
    bgGradient: "from-orange-600/20 via-amber-700/10 to-transparent",
    borderClass: "border-orange-600/30",
    badgeBg: "bg-orange-700/20 text-orange-300 border-orange-600/40",
    textClass: "text-orange-400",
    glowColor: "rgba(194, 65, 12, 0.4)",
    iconSymbol: "🥊",
  },
  darkness: {
    name: "darkness",
    label: "Noturno",
    bgGradient: "from-purple-900/30 via-slate-900/40 to-transparent",
    borderClass: "border-purple-600/30",
    badgeBg: "bg-purple-950/40 text-purple-300 border-purple-600/40",
    textClass: "text-purple-300",
    glowColor: "rgba(147, 51, 234, 0.3)",
    iconSymbol: "🌙",
  },
  dark: {
    name: "dark",
    label: "Noturno",
    bgGradient: "from-purple-900/30 via-slate-900/40 to-transparent",
    borderClass: "border-purple-600/30",
    badgeBg: "bg-purple-950/40 text-purple-300 border-purple-600/40",
    textClass: "text-purple-300",
    glowColor: "rgba(147, 51, 234, 0.3)",
    iconSymbol: "🌙",
  },
  metal: {
    name: "metal",
    label: "Metálico",
    bgGradient: "from-slate-400/20 via-zinc-500/10 to-transparent",
    borderClass: "border-slate-400/30",
    badgeBg: "bg-slate-500/20 text-slate-300 border-slate-400/40",
    textClass: "text-slate-300",
    glowColor: "rgba(148, 163, 184, 0.4)",
    iconSymbol: "⚙️",
  },
  dragon: {
    name: "dragon",
    label: "Dragão",
    bgGradient: "from-amber-500/20 via-teal-600/15 to-transparent",
    borderClass: "border-amber-500/40",
    badgeBg: "bg-gradient-to-r from-amber-500/20 to-teal-500/20 text-amber-300 border-amber-500/40",
    textClass: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.4)",
    iconSymbol: "🐉",
  },
  colorless: {
    name: "colorless",
    label: "Incolor",
    bgGradient: "from-neutral-400/15 via-neutral-600/10 to-transparent",
    borderClass: "border-neutral-500/30",
    badgeBg: "bg-neutral-500/20 text-neutral-300 border-neutral-500/40",
    textClass: "text-neutral-300",
    glowColor: "rgba(163, 163, 163, 0.3)",
    iconSymbol: "⚪",
  },
};

export function getEnergyConfig(energyRaw?: string): EnergyConfig {
  if (!energyRaw) return ENERGY_CONFIGS.colorless;
  const normalized = energyRaw.toLowerCase().split("+")[0].trim();
  return ENERGY_CONFIGS[normalized] || ENERGY_CONFIGS.colorless;
}
