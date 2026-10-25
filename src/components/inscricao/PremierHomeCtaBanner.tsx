"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Sparkles, Trophy, Users } from "lucide-react";
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

      {/* Conteúdo Principal */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Lado Esquerdo: Ícone + Título + Subtítulo + Detalhes */}
        <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
          {/* Badge de Ícone Temático Ampliado com Animação */}
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-xl border border-white/15 bg-black/40 backdrop-blur-md select-none group-hover:scale-105 transition-transform duration-300"
              style={{
                boxShadow: `0 0 20px ${theme.accentColorHex}40`,
              }}
            >
              {iconEmoji}
            </div>
            {/* Pontinho pulsante de atividade */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: theme.accentColorHex }}
              />
              <span
                className="relative inline-flex rounded-full h-4 w-4 border-2 border-slate-900"
                style={{ backgroundColor: theme.accentColorHex }}
              />
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Pill de Categoria / Inscrições Abertas */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${theme.badgeClass}`}
              >
                <Sparkles className="h-3 w-3" />
                {theme.badgeText} • INSCRIÇÕES ABERTAS
              </span>

              {vagas && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  <Users className="h-3 w-3 text-slate-400" />
                  {vagas}
                </span>
              )}
            </div>

            {/* Título Principal de Alto Impacto */}
            <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-sm">
              {title}
            </h2>

            {/* Subtítulo amigável */}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-200/90 font-medium leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}

            {/* Metadados do Torneio (Data, Hora, Local, Taxa) */}
            <div className="pt-1 flex items-center gap-2 sm:gap-4 flex-wrap text-xs text-slate-300 font-medium">
              {eventDate && (
                <span className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  {eventDate}
                </span>
              )}
              {eventTime && (
                <span className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {eventTime}
                </span>
              )}
              {eventLocal && (
                <span className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/5">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  {eventLocal}
                </span>
              )}
              {eventValor && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                  Taxa: {eventValor}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Botão de Inscrição Gigante com Efeito Hover */}
        <div className="w-full lg:w-auto shrink-0 flex items-center justify-end">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenInscricao}
            className={`w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-sm sm:text-base cursor-pointer transition-all duration-200 ${theme.buttonClass}`}
          >
            <span className="text-xl leading-none">{iconEmoji}</span>
            <span>{buttonText}</span>
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
