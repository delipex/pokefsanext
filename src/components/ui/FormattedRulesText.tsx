import React from "react";

/**
 * Formata texto simples com suporte a negrito (**texto**), itálico (*texto*),
 * marcadores de lista (•, -, *) e quebras de linha.
 */
export function formatInlineText(str: string): React.ReactNode {
  if (!str) return null;
  // Divide por **negrito** ou *itálico*
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-black text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

interface FormattedRulesTextProps {
  text: string;
  className?: string;
  bulletColor?: string;
}

export function FormattedRulesText({
  text,
  className = "",
  bulletColor = "text-amber-400",
}: FormattedRulesTextProps) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1.5" />;
        }

        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("- ") ||
          trimmed.startsWith("* ");

        const bulletText = isBullet
          ? trimmed.replace(/^[•\-\*]\s*/, "")
          : trimmed;

        if (isBullet) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1">
              <span className={`${bulletColor} font-bold shrink-0 leading-none mt-1`}>
                •
              </span>
              <span className="flex-1">{formatInlineText(bulletText)}</span>
            </div>
          );
        }

        return <div key={lIdx}>{formatInlineText(trimmed)}</div>;
      })}
    </div>
  );
}
