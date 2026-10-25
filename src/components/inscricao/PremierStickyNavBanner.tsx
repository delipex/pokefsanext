"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import { evaluatePremierRegistrationStatus, formatDateToBR, normalizeDateToISO } from "@/lib/tournament-utils";
import { resolvePremierTheme, resolveIconEmoji } from "./PremierCtaTheme";

interface PremierStickyNavBannerProps {
  config: Record<string, any>;
}

export function PremierStickyNavBanner({ config }: PremierStickyNavBannerProps) {
  const pathname = usePathname();
  const regStatus = useMemo(() => evaluatePremierRegistrationStatus(config), [config]);

  // Regra crítica solicitada pelo usuário:
  // "nas outras paginas ele fique aparecendo colado embaixo do menu, menos na home, ok?"
  // Ocultar na Home ("/") e no painel administrativo ("/admin")
  if (pathname === "/" || pathname?.startsWith("/admin")) {
    return null;
  }

  // Se inscrições não estiverem abertas, não exibe
  if (!regStatus.isOpen) {
    return null;
  }

  const theme = resolvePremierTheme(config?.premierTema || "halloween");
  const iconEmoji = resolveIconEmoji(config?.premierBannerIcone || theme.iconDefault);

  const isGratuito =
    config?.premierGratuito === "true" ||
    config?.premierGratuito === true ||
    config?.premierValor === "0" ||
    config?.premierValor === "0,00" ||
    config?.premierValor?.toLowerCase?.() === "gratuito" ||
    config?.premierValor?.toLowerCase?.() === "grátis";

  const title = (config?.premierCtaTexto || config?.premierNome || theme.defaultTitle).trim();
  const buttonText = (config?.premierCtaBotao || (isGratuito ? "Vaga Gratuita ➜" : theme.buttonTextDefault)).trim();
  const eventDate = config?.premierData ? formatDateToBR(normalizeDateToISO(config.premierData)) : "";

  // Imagem de fundo opcional (URL externa ou interna)
  const bgImage = config?.premierBannerBg || config?.premierBanner || null;

  const handleOpenInscricao = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "inscricao";
      window.dispatchEvent(new CustomEvent("open-inscricao-modal"));
    }
  };

  return (
    <div className="sticky top-[57px] sm:top-[65px] z-40 w-full shadow-lg shadow-black/40">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`relative overflow-hidden border-b ${theme.borderClass} ${theme.glowClass} backdrop-blur-xl`}
      >
        {/* Imagem de Fundo Opcional */}
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20"
            style={{ backgroundImage: `url(${bgImage})` }}
            aria-hidden="true"
          />
        )}

        {/* Gradiente de Cor do Tema */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${theme.gradientClass} opacity-95 pointer-events-none`}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Ícone + Título + Status */}
          <div
            onClick={handleOpenInscricao}
            className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer group"
          >
            <div
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 bg-black/40 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-200"
              style={{ boxShadow: `0 0 12px ${theme.accentColorHex}40` }}
            >
              {iconEmoji}
            </div>

            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${theme.badgeClass} shrink-0`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {isGratuito ? "🎉 Entrada Franca" : "Inscrições Abertas"}
              </span>

              <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:underline">
                {title}
              </h4>

              {eventDate && (
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium bg-black/30 px-2 py-0.5 rounded-md border border-white/5">
                  <Calendar className="h-3 w-3 text-amber-400" />
                  {eventDate}
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito: Botão Direto de Inscrição */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleOpenInscricao}
            className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all ${theme.buttonClass}`}
          >
            <span className="truncate">{buttonText.replace("➜", "").trim()}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
