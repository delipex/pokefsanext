export type PremierThemeKey =
  | "halloween"
  | "lightning"
  | "fire"
  | "water"
  | "psychic"
  | "grass"
  | "darkness"
  | "dragon"
  | "metal"
  | "custom";

export interface ResolvedPremierTheme {
  key: PremierThemeKey;
  label: string;
  gradientClass: string;
  borderClass: string;
  glowClass: string;
  badgeClass: string;
  badgeText: string;
  buttonClass: string;
  buttonTextDefault: string;
  iconDefault: string;
  accentColorHex: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

export const PREMIER_THEMES: Record<PremierThemeKey, ResolvedPremierTheme> = {
  halloween: {
    key: "halloween",
    label: "🎃 Halloween Especial (Recomendado)",
    gradientClass: "from-orange-950/90 via-purple-950/90 to-slate-950/95",
    borderClass: "border-orange-500/40 hover:border-orange-400/60",
    glowClass: "shadow-[0_0_35px_rgba(249,115,22,0.22)]",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    badgeText: "🎃 Especial de Halloween",
    buttonClass:
      "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-black shadow-lg shadow-orange-500/30",
    buttonTextDefault: "Garantir Vaga no Halloween ➜",
    iconDefault: "🎃",
    accentColorHex: "#f97316",
    defaultTitle: "🎃 Torneio Especial de Halloween — Vagas Limitadas!",
    defaultSubtitle: "Vista sua fantasia ou traga seu deck temático mais aterrorizante! Garanta sua vaga antecipada.",
  },
  darkness: {
    key: "darkness",
    label: "🌑 Darkness / Noturno & Fantasma",
    gradientClass: "from-purple-950/90 via-slate-950/90 to-black/95",
    borderClass: "border-purple-500/35 hover:border-purple-400/50",
    glowClass: "shadow-[0_0_30px_rgba(147,51,234,0.2)]",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    badgeText: "Inscrições Abertas",
    buttonClass:
      "bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black shadow-lg shadow-purple-600/30",
    buttonTextDefault: "Inscrever-se no Torneio ➜",
    iconDefault: "👻",
    accentColorHex: "#9333ea",
    defaultTitle: "👻 Torneio Especial Noturno — Inscrições Abertas",
    defaultSubtitle: "Prepare seu melhor baralho para os duelos noturnos da Liga Atlântica.",
  },
  lightning: {
    key: "lightning",
    label: "⚡ Lightning / Amarelo (Padrão)",
    gradientClass: "from-amber-950/80 via-yellow-950/70 to-slate-950/95",
    borderClass: "border-amber-400/40 hover:border-amber-300/60",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    badgeText: "⚡ Torneio Oficial",
    buttonClass:
      "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30",
    buttonTextDefault: "Fazer Inscrição Online ➜",
    iconDefault: "⚡",
    accentColorHex: "#eab308",
    defaultTitle: "⚡ Inscrições Abertas para o Próximo Torneio!",
    defaultSubtitle: "Garanta seu lugar no grid oficial de competidores da Liga Atlântica.",
  },
  fire: {
    key: "fire",
    label: "🔥 Fire / Vermelho",
    gradientClass: "from-red-950/85 via-orange-950/75 to-slate-950/95",
    borderClass: "border-red-500/40 hover:border-red-400/60",
    glowClass: "shadow-[0_0_30px_rgba(239,68,68,0.2)]",
    badgeClass: "bg-red-500/20 text-red-300 border-red-500/40",
    badgeText: "🔥 Torneio Competitivo",
    buttonClass:
      "bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:to-orange-500 text-white font-black shadow-lg shadow-red-500/30",
    buttonTextDefault: "Garantir Minha Vaga ➜",
    iconDefault: "🔥",
    accentColorHex: "#ef4444",
    defaultTitle: "🔥 Torneio de Fogo — Duelos Decisivos!",
    defaultSubtitle: "Dispute troféus e pontos valendo vaga no topo do ranking.",
  },
  psychic: {
    key: "psychic",
    label: "🔮 Psychic / Roxo",
    gradientClass: "from-fuchsia-950/85 via-purple-950/80 to-slate-950/95",
    borderClass: "border-fuchsia-400/40 hover:border-fuchsia-300/60",
    glowClass: "shadow-[0_0_30px_rgba(217,70,239,0.2)]",
    badgeClass: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40",
    badgeText: "🔮 Torneio Psíquico",
    buttonClass:
      "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black shadow-lg shadow-fuchsia-600/30",
    buttonTextDefault: "Inscrever-se Agora ➜",
    iconDefault: "🔮",
    accentColorHex: "#d946ef",
    defaultTitle: "🔮 Torneio Psíquico Especial — Inscrições Abertas",
    defaultSubtitle: "Vagas abertas com premiação exclusiva e boosters.",
  },
  water: {
    key: "water",
    label: "💧 Water / Azul Turquesa",
    gradientClass: "from-cyan-950/85 via-blue-950/80 to-slate-950/95",
    borderClass: "border-cyan-400/40 hover:border-cyan-300/60",
    glowClass: "shadow-[0_0_30px_rgba(6,182,212,0.2)]",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    badgeText: "💧 Copa da Água",
    buttonClass:
      "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 text-white font-black shadow-lg shadow-cyan-500/30",
    buttonTextDefault: "Garantir Vaga ➜",
    iconDefault: "💧",
    accentColorHex: "#06b6d4",
    defaultTitle: "💧 Torneio Aquático — Inscrições Abertas",
    defaultSubtitle: "Prepare suas estratégias e garanta sua inscrição.",
  },
  grass: {
    key: "grass",
    label: "🌿 Grass / Verde Esmeralda",
    gradientClass: "from-emerald-950/85 via-teal-950/80 to-slate-950/95",
    borderClass: "border-emerald-400/40 hover:border-emerald-300/60",
    glowClass: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    badgeText: "🌿 Copa Esmeralda",
    buttonClass:
      "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-lg shadow-emerald-500/30",
    buttonTextDefault: "Inscrever-se ➜",
    iconDefault: "🌿",
    accentColorHex: "#10b981",
    defaultTitle: "🌿 Torneio Grama — Inscrições Abertas",
    defaultSubtitle: "Garanta seu check-in e concorra a premiações oficiais.",
  },
  dragon: {
    key: "dragon",
    label: "🐉 Dragon / Dourado",
    gradientClass: "from-amber-950/90 via-purple-950/85 to-slate-950/95",
    borderClass: "border-amber-400/40 hover:border-amber-300/60",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    badgeText: "🐉 Copa dos Dragões",
    buttonClass:
      "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-500/30",
    buttonTextDefault: "Garantir Vaga ➜",
    iconDefault: "🐉",
    accentColorHex: "#f59e0b",
    defaultTitle: "🐉 Torneio Lendário dos Dragões — Vagas Abertas",
    defaultSubtitle: "Desafie os melhores treinadores e suba no ranking.",
  },
  metal: {
    key: "metal",
    label: "⚙️ Metal / Prateado",
    gradientClass: "from-slate-900/90 via-zinc-900/85 to-slate-950/95",
    borderClass: "border-slate-400/40 hover:border-slate-300/60",
    glowClass: "shadow-[0_0_30px_rgba(148,163,184,0.15)]",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-400/40",
    badgeText: "⚙️ Torneio de Metal",
    buttonClass:
      "bg-gradient-to-r from-slate-200 to-slate-400 hover:from-white hover:to-slate-300 text-slate-950 font-black shadow-lg shadow-white/20",
    buttonTextDefault: "Inscrever-se ➜",
    iconDefault: "⚙️",
    accentColorHex: "#94a3b8",
    defaultTitle: "⚙️ Torneio de Metal — Inscrições Abertas",
    defaultSubtitle: "Inscrições abertas com premiação exclusiva da Liga Atlântica.",
  },
  custom: {
    key: "custom",
    label: "🎨 Personalizado (Cor/Imagem)",
    gradientClass: "from-slate-900/90 via-slate-950/90 to-black/95",
    borderClass: "border-white/20 hover:border-white/40",
    glowClass: "shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    badgeClass: "bg-white/10 text-white border-white/20",
    badgeText: "⭐ Sessão Especial",
    buttonClass:
      "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black shadow-lg shadow-blue-600/30",
    buttonTextDefault: "Garantir Vaga ➜",
    iconDefault: "⭐",
    accentColorHex: "#3b82f6",
    defaultTitle: "Sessão Especial — Inscrições Abertas",
    defaultSubtitle: "Garanta sua participação na etapa oficial da Liga Atlântica.",
  },
};

export const AVAILABLE_ICONS = [
  { value: "pumpkin", label: "🎃 Abóbora (Halloween)", emoji: "🎃" },
  { value: "ghost", label: "👻 Fantasma", emoji: "👻" },
  { value: "skull", label: "💀 Caveira", emoji: "💀" },
  { value: "sparkles", label: "✨ Brilho / Estrelas", emoji: "✨" },
  { value: "flame", label: "🔥 Chamas", emoji: "🔥" },
  { value: "zap", label: "⚡ Raio / Elétrico", emoji: "⚡" },
  { value: "trophy", label: "🏆 Troféu", emoji: "🏆" },
  { value: "swords", label: "⚔️ Duelo / Espadas", emoji: "⚔️" },
  { value: "gem", label: "💎 Joia Rara", emoji: "💎" },
  { value: "gamepad", label: "🎮 Arena Games", emoji: "🎮" },
];

export function resolveIconEmoji(iconKeyOrEmoji?: string | null): string {
  if (!iconKeyOrEmoji || !iconKeyOrEmoji.trim()) return "🎃";
  const clean = iconKeyOrEmoji.trim();
  const found = AVAILABLE_ICONS.find((i) => i.value.toLowerCase() === clean.toLowerCase());
  if (found) return found.emoji;
  return clean;
}

export function resolvePremierTheme(themeKey?: string | null): ResolvedPremierTheme {
  const clean = (themeKey || "").trim().toLowerCase() as PremierThemeKey;
  if (clean in PREMIER_THEMES) {
    return PREMIER_THEMES[clean];
  }
  return PREMIER_THEMES.halloween;
}
