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
  | "fairy"
  | "multi"
  | "rainbow";

export interface SingleEnergyInfo {
  name: string;
  label: string;
  hex: string;
  glow: string;
  isRainbow?: boolean;
  bgGradient?: string;
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
    label: "Escuridão",
    hex: "#7C3AED",
    glow: "rgba(124, 58, 237, 0.4)",
  },
  dark: {
    name: "darkness",
    label: "Escuridão",
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
  multi: {
    name: "multi",
    label: "Multi",
    hex: "#FF4216",
    glow: "rgba(255, 203, 5, 0.55)",
    isRainbow: true,
    bgGradient:
      "conic-gradient(from 180deg at 50% 50%, #FF4216 0deg, #EBC816 60deg, #78C850 120deg, #1593F5 180deg, #7C3AED 240deg, #D94293 300deg, #FF4216 360deg)",
  },
  rainbow: {
    name: "multi",
    label: "Multi",
    hex: "#FF4216",
    glow: "rgba(255, 203, 5, 0.55)",
    isRainbow: true,
    bgGradient:
      "conic-gradient(from 180deg at 50% 50%, #FF4216 0deg, #EBC816 60deg, #78C850 120deg, #1593F5 180deg, #7C3AED 240deg, #D94293 300deg, #FF4216 360deg)",
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
  isRainbow: boolean;
}

export function parseEnergyTypes(raw?: string): SingleEnergyInfo[] {
  if (!raw) return [BASE_ENERGIES.colorless];
  const lower = raw.toLowerCase().trim();

  // Caso especial: se for multi ou rainbow
  if (lower === "multi" || lower === "rainbow") {
    return [BASE_ENERGIES.multi];
  }

  const cleaned = lower.replace(/[\/,]/g, "+");
  const parts = cleaned.split("+").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return [BASE_ENERGIES.colorless];

  // Se tiver 3 ou mais energias combinadas, transforma em Multi Rainbow!
  if (parts.length >= 3) {
    return [BASE_ENERGIES.multi];
  }

  const types = parts.map((part) => BASE_ENERGIES[part] || BASE_ENERGIES.colorless);
  return types;
}

export function getMultiEnergyConfig(energyRaw?: string): MultiEnergyConfig {
  const types = parseEnergyTypes(energyRaw);
  const isRainbow = types.some((t) => t.isRainbow);
  const primary = types[0] || BASE_ENERGIES.colorless;
  const secondary = types[1] || primary;

  const isDual = types.length > 1;
  const label = isRainbow ? "Multi" : types.map((t) => t.label).join(" / ");

  const gradientBg = isRainbow
    ? "linear-gradient(135deg, rgba(255, 66, 22, 0.15) 0%, rgba(235, 200, 22, 0.15) 25%, rgba(120, 200, 80, 0.15) 50%, rgba(21, 147, 245, 0.15) 75%, rgba(124, 58, 237, 0.15) 100%)"
    : isDual
    ? `linear-gradient(135deg, ${primary.hex}22 0%, ${secondary.hex}22 100%)`
    : `linear-gradient(135deg, ${primary.hex}22 0%, ${primary.hex}08 100%)`;

  const borderStyle = isRainbow
    ? "1px solid rgba(255, 203, 5, 0.45)"
    : isDual
    ? `1px solid ${primary.hex}55`
    : `1px solid ${primary.hex}44`;

  return {
    types,
    label,
    primaryColor: isRainbow ? "#FF4216" : primary.hex,
    secondaryColor: isRainbow ? "#1593F5" : secondary.hex,
    gradientBg,
    borderStyle,
    glowColor: isRainbow ? "rgba(255, 203, 5, 0.5)" : primary.glow,
    isRainbow,
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
    isRainbow: multi.isRainbow,
  };
}

export function formatCategoryAbbr(cat?: string | null): "ME" | "SE" | "JR" {
  if (!cat) return "ME";
  const upper = cat.trim().toUpperCase();
  if (upper === "ME" || upper === "MAS" || upper.startsWith("MASTER") || upper.startsWith("ME")) return "ME";
  if (upper === "SE" || upper === "SEN" || upper.startsWith("SENIOR") || upper.startsWith("SE")) return "SE";
  if (upper === "JR" || upper === "JUN" || upper.startsWith("JUNIOR") || upper.startsWith("JR")) return "JR";
  return "ME";
}
