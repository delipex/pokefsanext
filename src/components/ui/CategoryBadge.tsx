import { formatCategoryAbbr } from "@/lib/theme/energy-tokens";

interface CategoryBadgeProps {
  category?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, className = "", size = "md" }: CategoryBadgeProps) {
  const cat = formatCategoryAbbr(category);
  const sizeClasses = size === "sm" ? "min-w-[28px] px-1.5 py-0.5 text-[9px]" : "min-w-[32px] px-1.5 py-0.5 text-[10px]";

  if (cat === "SE") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0 ${sizeClasses} ${className}`}
        title="Categoria Sênior"
      >
        SE
      </span>
    );
  }

  if (cat === "JR") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shrink-0 ${sizeClasses} ${className}`}
        title="Categoria Júnior"
      >
        JR
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/25 shrink-0 ${sizeClasses} ${className}`}
      title="Categoria Master"
    >
      ME
    </span>
  );
}
