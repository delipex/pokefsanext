import { getEnergyConfig } from "@/lib/theme/energy-tokens";

interface EnergyBadgeProps {
  energyRaw?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function EnergyBadge({ energyRaw, size = "md", showLabel = true }: EnergyBadgeProps) {
  const config = getEnergyConfig(energyRaw);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium transition-all ${config.badgeBg} ${sizeClasses[size]}`}
      style={{
        boxShadow: `0 0 12px -2px ${config.glowColor}`,
      }}
    >
      <span className="text-xs">{config.iconSymbol}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
