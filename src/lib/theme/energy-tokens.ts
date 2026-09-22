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

export interface SingleEnergyInfo {
  name: string;
  label: string;
  hex: string;
  glow: string;
}

export const BASE_ENERGIES: Record<string, SingleEnergyInfo> = {
  grass: {
    name: "grass",
    label: "Planta",
    hex: "#78C850",
    glow: "rgba(120, 200, 80, 0.4)",
  },
  fire: {
    name: "fire",
    label: "Fogo",
    hex: "#FF4216",
    glow: "rgba(255, 66, 22, 0.4)",
  },
  water: {
    name: "water",
    label: "Água",
    hex: "#1593F5",
    glow: "rgba(21, 147, 245, 0.4)",
  },
  lightning: {
    name: "lightning",
    label: "Elétrico",
    hex: "#EBC816",
    glow: "rgba(235, 200, 22, 0.4)",
  },
  electric: {
    name: "lightning",
    label: "Elétrico",
    hex: "#EBC816",
    glow: "rgba(235, 200, 22, 0.4)",
  },
  psychic: {
    name: "psychic",
    label: "Psíquico",
    hex: "#D94293",
    glow: "rgba(217, 66, 147, 0.4)",
  },
  fighting: {
    name: "fighting",
    label: "Lutador",
    hex: "#C55E13",
    glow: "rgba(197, 94, 19, 0.4)",
  },
  darkness: {
    name: "darkness",
    label: "Noturno",
    hex: "#7C3AED",
    glow: "rgba(124, 58, 237, 0.4)",
  },
  dark: {
    name: "darkness",
    label: "Noturno",
    hex: "#7C3AED",
    glow: "rgba(124, 58, 237, 0.4)",
  },
  metal: {
    name: "metal",
    label: "Metálico",
    hex: "#7E8E9E",
    glow: "rgba(126, 142, 158, 0.4)",
  },
  dragon: {
    name: "dragon",
    label: "Dragão",
    hex: "#C99B22",
    glow: "rgba(201, 155, 34, 0.4)",
  },
  colorless: {
    name: "colorless",
    label: "Incolor",
    hex: "#94A3B8",
    glow: "rgba(148, 163, 184, 0.3)",
  },
  fairy: {
    name: "fairy",
    label: "Fada",
    hex: "#F85888",
    glow: "rgba(248, 88, 136, 0.4)",
  },
};

export interface MultiEnergyConfig {
  types: SingleEnergyInfo[];
  label: string;
  primaryColor: string;
  secondaryColor: string;
  gradientBg: string;
  borderStyle: string;
  glowColor: string;
}

export function parseEnergyTypes(raw?: string): SingleEnergyInfo[] {
  if (!raw) return [BASE_ENERGIES.colorless];
  const cleaned = raw.toLowerCase().replace(/[\/,]/g, "+");
  const parts = cleaned.split("+").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return [BASE_ENERGIES.colorless];

  const types = parts.map((part) => BASE_ENERGIES[part] || BASE_ENERGIES.colorless);
  return types;
}

export function getMultiEnergyConfig(energyRaw?: string): MultiEnergyConfig {
  const types = parseEnergyTypes(energyRaw);
  const primary = types[0] || BASE_ENERGIES.colorless;
  const secondary = types[1] || primary;

  const isDual = types.length > 1;
  const label = types.map((t) => t.label).join(" / ");

  const gradientBg = isDual
    ? `linear-gradient(135deg, ${primary.hex}22 0%, ${secondary.hex}22 100%)`
    : `linear-gradient(135deg, ${primary.hex}22 0%, ${primary.hex}08 100%)`;

  const borderStyle = isDual
    ? `1px solid ${primary.hex}55`
    : `1px solid ${primary.hex}44`;

  return {
    types,
    label,
    primaryColor: primary.hex,
    secondaryColor: secondary.hex,
    gradientBg,
    borderStyle,
    glowColor: primary.glow,
  };
}

export function getEnergyConfig(energyRaw?: string) {
  const multi = getMultiEnergyConfig(energyRaw);
  const primary = multi.types[0];

  return {
    name: primary.name,
    label: multi.label,
    bgGradient: multi.gradientBg,
    borderClass: "",
    badgeBg: "",
    textClass: "",
    glowColor: multi.glowColor,
    primaryColor: multi.primaryColor,
    secondaryColor: multi.secondaryColor,
    types: multi.types,
  };
}
