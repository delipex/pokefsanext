import { getMultiEnergyConfig } from "@/lib/theme/energy-tokens";

interface EnergyBadgeProps {
  energyRaw?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function EnergyBadge({
  energyRaw,
  size = "md",
  showLabel = true,
  className = "",
}: EnergyBadgeProps) {
  const config = getMultiEnergyConfig(energyRaw);

  const sizeClasses = {
    sm: showLabel ? "px-2.5 py-0.5 text-[11px] gap-1.5" : "px-1.5 py-0.5 gap-1",
    md: showLabel ? "px-3 py-1 text-xs gap-2" : "px-2 py-1 gap-1.5",
    lg: showLabel ? "px-4 py-1.5 text-sm gap-2.5 font-bold" : "px-2.5 py-1.5 gap-2",
  };

  const dotSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold transition-all backdrop-blur-md whitespace-nowrap shrink-0 select-none ${sizeClasses[size]} ${className}`}
      style={{
        background: config.gradientBg,
        border: config.borderStyle,
        boxShadow: `0 0 10px -2px ${config.glowColor}`,
        color: "#f8fafc",
      }}
      title={config.label}
    >
      {/* Indicadores de Energia (Cores oficiais dos tipos) */}
      <div className="flex items-center gap-1 shrink-0">
        {config.types.map((t, idx) => (
          <span
            key={idx}
            className={`${dotSize[size]} rounded-full border border-black/40 shadow-sm shrink-0`}
            style={{
              background: t.bgGradient || t.hex,
              boxShadow: `0 0 6px ${t.glow || t.hex}`,
            }}
            title={t.label}
          />
        ))}
      </div>

      {showLabel && <span className="tracking-wide text-slate-200">{config.label}</span>}
    </span>
  );
}
