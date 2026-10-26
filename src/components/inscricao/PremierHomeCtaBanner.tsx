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
  const eventTime = config?.premierHorario || "14h00";
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

      {/* Conteúdo Principal em Grid Equilibrado de 12 Colunas */}
      <div className="relative z-10 p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Lado Esquerdo (lg: 7-8 colunas): Ícone + Badges + Título + Subtítulo + Metadados */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0">
          {/* Badge de Ícone Temático Ampliado com Brilho Atmosférico */}
          <div className="relative shrink-0">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl border border-white/20 bg-gradient-to-br from-white/15 to-black/60 backdrop-blur-md select-none group-hover:scale-105 transition-transform duration-300"
              style={{
                boxShadow: `0 0 28px ${theme.accentColorHex}45`,
              }}
            >
              {iconEmoji}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Linha de Badges: Status + Vagas + Gratuito */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${theme.badgeClass}`}
              >
                <Sparkles className="h-3 w-3" />
                {theme.badgeText} • INSCRIÇÕES ABERTAS
              </span>

              {vagas && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Users className="h-3 w-3 text-slate-400" />
                  {vagas}
                </span>
              )}

              {isGratuito && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Entrada Franca
                </span>
              )}
            </div>

            {/* Título Principal de Alto Impacto */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {title}
            </h2>

            {/* Subtítulo Amigável */}
            {subtitle && (
              <p className="text-sm sm:text-base text-slate-200/90 font-medium leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}

            {/* Metadados do Torneio (Data, Hora, Local, Taxa quando não for gratuito) */}
            <div className="pt-1 flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-slate-300 font-medium">
              {eventDate && (
                <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  {eventDate}
                </span>
              )}
              {eventTime && (
                <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Check-in: {eventTime}
                </span>
              )}
              {eventLocal && (
                <span className="inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/10">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  {eventLocal}
                </span>
              )}
              {!isGratuito && eventValor && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-950/70 text-emerald-300 font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  Taxa: {eventValor}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito (lg: 4-5 colunas): Bloco de Ação / Botão Proporcional e Equilibrado */}
        <div className="lg:col-span-5 xl:col-span-4 w-full flex flex-col items-center lg:items-end justify-center space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenInscricao}
            className={`w-full py-4 px-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-2xl group ${theme.buttonClass} border border-white/20`}
          >
            <div className="flex items-center justify-center gap-2.5 text-base sm:text-lg font-black tracking-tight leading-tight">
              <span className="text-2xl leading-none group-hover:scale-110 transition-transform duration-200">{iconEmoji}</span>
              <span>{isGratuito && !config?.premierCtaBotao ? "Garantir Vaga Gratuita ➜" : buttonText}</span>
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 mt-1.5 text-xs font-semibold opacity-90 group-hover:opacity-100 transition-opacity tracking-normal leading-tight">
              <Zap className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>Preenchimento rápido em 1 clique</span>
            </div>
          </motion.button>
          <p className="text-[11px] text-slate-300/80 font-medium text-center lg:text-right w-full px-1">
            ⚡ Vagas confirmadas em tempo real • 100% Online
          </p>
        </div>
      </div>
    </motion.section>
  );
}
