"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { evaluatePremierRegistrationStatus, formatDateToBR, normalizeDateToISO } from "@/lib/tournament-utils";
import { resolvePremierTheme, resolveIconEmoji } from "./PremierCtaTheme";

interface PremierHomeCtaBannerProps {
  config: Record<string, any>;
}

export function PremierHomeCtaBanner({ config }: PremierHomeCtaBannerProps) {
  const regStatus = useMemo(() => evaluatePremierRegistrationStatus(config), [config]);

  // Se as inscrições não estiverem abertas, não exibe
  if (!regStatus.isOpen) {
    return null;
  }

  const theme = resolvePremierTheme(config?.premierTema || "halloween");
  const iconEmoji = resolveIconEmoji(config?.premierBannerIcone || theme.iconDefault);

  const isGratuito = useMemo(() => {
    if (config?.premierGratuito === "true" || config?.premierGratuito === true) return true;
    const clean = String(config?.premierValor || "")
      .trim()
      .toLowerCase()
      .replace("r$", "")
      .replace(",", ".")
      .trim();
    const num = parseFloat(clean);
    if (!isNaN(num) && num === 0) return true;
    if (
      clean === "0" ||
      clean === "00" ||
      clean === "0.00" ||
      clean === "gratuito" ||
      clean === "gratis" ||
      clean === "grátis" ||
      clean === "free"
    ) {
      return true;
    }
    return false;
  }, [config?.premierGratuito, config?.premierValor]);

  const title = (config?.premierCtaTexto || config?.premierNome || theme.defaultTitle).trim();
  const subtitle = (config?.premierCtaSubtexto || config?.premierSubtitulo || theme.defaultSubtitle).trim();
  const buttonText = (config?.premierCtaBotao || theme.buttonTextDefault).trim();

  const eventDate = config?.premierData ? formatDateToBR(normalizeDateToISO(config.premierData)) : "";

  // Normalização do horário para nunca duplicar "Check-in: Check-in às..."
  const displayCheckin = useMemo(() => {
    let raw = (config?.premierHorario || "14h00").trim();
    if (!raw) return "";

    // Remove qualquer repetição de "check-in", "checkin", "check in", "às", "as", ":" no início
    while (/^check-?\s*in\s*[:\-\—]?\s*(às|as)?\s*/i.test(raw)) {
      raw = raw.replace(/^check-?\s*in\s*[:\-\—]?\s*(às|as)?\s*/i, "").trim();
    }

    return `Check-in: ${raw || "14h00"}`;
  }, [config?.premierHorario]);

  const eventLocal = config?.premierLocal || "Livraria Atlântica";
  const eventValor = config?.premierValor ? `R$ ${config.premierValor}` : "";
  const vagas = config?.premierVagas ? `${config.premierVagas} Vagas` : "";

  // Imagem de fundo opcional (URL externa ou interna)
  const bgImage = config?.premierBannerBg || config?.premierBanner || null;

  const handleOpenInscricao = () => {
    if (typeof window !== "undefined") {
      window.location.hash = "inscricao";
      window.dispatchEvent(new CustomEvent("open-inscricao-modal"));
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border ${theme.borderClass} ${theme.glowClass} backdrop-blur-2xl transition-all duration-300 group`}
    >
      {/* Imagem de Fundo Opcional com Overlay Gradiente Escurecido */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-30 group-hover:opacity-40 transition-opacity duration-500 scale-105"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden="true"
        />
      )}

      {/* Gradiente Atmosférico do Tema */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradientClass} opacity-95 pointer-events-none`}
        aria-hidden="true"
      />

      {/* Luzes / Efeitos Esparsos de Fundo */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: theme.accentColorHex }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-25"
        style={{ backgroundColor: theme.accentColorHex }}
        aria-hidden="true"
      />

      {/* Conteúdo Principal em Grid Equilibrado e Mobile-First */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
        {/* Lado Esquerdo: Badges + Header com Ícone e Título + Metadados */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3 sm:space-y-4 min-w-0">
          
          {/* 1. Linha de Badges Compactos e Independentes (evita quebras no mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border shadow-sm ${theme.badgeClass}`}
            >
              <Sparkles className="h-3 w-3 shrink-0 text-amber-300" />
              <span>INSCRIÇÕES ABERTAS</span>
            </span>

            {isGratuito && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-500/40 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-emerald-400 shrink-0" />
                Entrada Franca
              </span>
            )}

            {vagas && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm">
                <Users className="h-3 w-3 text-slate-400 shrink-0" />
                {vagas}
              </span>
            )}
          </div>

          {/* 2. Bloco Principal: Ícone + Título + Subtítulo Integrados em Linha Única */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {/* Ícone Temático */}
            <div className="relative shrink-0">
              <div
                className="h-14 w-14 sm:h-18 sm:w-18 lg:h-20 lg:w-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl shadow-xl border border-white/20 bg-gradient-to-br from-white/15 to-black/60 backdrop-blur-md select-none group-hover:scale-105 transition-transform duration-300"
                style={{
                  boxShadow: `0 0 24px ${theme.accentColorHex}40`,
                }}
              >
                {iconEmoji}
              </div>
            </div>

            {/* Título & Subtítulo */}
            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md truncate sm:whitespace-normal">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-200/90 font-medium leading-snug line-clamp-2 sm:line-clamp-none max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* 3. Metadados do Torneio em Grid 2 Colunas no Mobile / Flex no Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs text-slate-300 font-medium pt-0.5">
            {eventDate && (
              <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{eventDate}</span>
              </span>
            )}
            {displayCheckin && (
              <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10 min-w-0">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{displayCheckin}</span>
              </span>
            )}
            {eventLocal && (
              <span className="col-span-2 sm:col-span-1 inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{eventLocal}</span>
              </span>
            )}
            {!isGratuito && eventValor && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/70 text-emerald-300 font-bold px-2.5 py-1.5 rounded-xl border border-emerald-500/30 min-w-0">
                <Trophy className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Taxa: {eventValor}</span>
              </span>
            )}
          </div>
        </div>

        {/* Lado Direito (lg: 4-5 colunas): Bloco de Ação / Botão Proporcional e Equilibrado */}
        <div className="lg:col-span-5 xl:col-span-4 w-full flex flex-col items-center lg:items-end justify-center space-y-2 pt-1 lg:pt-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenInscricao}
            className={`w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-2xl group ${theme.buttonClass} border border-white/20`}
          >
            <div className="flex items-center justify-center gap-2 text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight">
              <span className="text-xl sm:text-2xl leading-none group-hover:scale-110 transition-transform duration-200">{iconEmoji}</span>
              <span>{isGratuito && !config?.premierCtaBotao ? "Garantir Vaga Gratuita ➜" : buttonText}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[11px] sm:text-xs font-semibold opacity-90 group-hover:opacity-100 transition-opacity tracking-normal leading-tight text-white/95">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-amber-300 fill-amber-300" />
              <span>Preenchimento rápido em 1 clique</span>
            </div>
          </motion.button>
          <p className="text-[10px] sm:text-[11px] text-slate-300/80 font-medium text-center lg:text-right w-full px-1">
            ⚡ Vagas confirmadas em tempo real • 100% Online
          </p>
        </div>
      </div>
    </motion.section>
  );
}
