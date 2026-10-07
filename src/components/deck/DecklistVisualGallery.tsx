"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ParsedCardItem, ParsedDecklistResult } from "@/lib/decklist-parser";
import { Layers, Sparkles, Eye, FileText, CheckCircle2, AlertCircle, Copy, Check, Download, Loader2 } from "lucide-react";
import { downloadDecklistImage } from "@/lib/deck-image-exporter";

interface DecklistVisualGalleryProps {
  parsedData: ParsedDecklistResult;
  deckName?: string;
  playerName?: string;
  popId?: string;
  protocolo?: string;
  eventName?: string;
  className?: string;
  allowToggleView?: boolean;
  rawText?: string;
}

export function DecklistVisualGallery({
  parsedData,
  deckName = "Decklist",
  playerName = "Treinador",
  popId = "",
  protocolo = "",
  eventName = "Liga Atlântica TCG",
  className = "",
  allowToggleView = true,
  rawText = "",
}: DecklistVisualGalleryProps) {
  const [activeView, setActiveView] = useState<"visual" | "text">("visual");
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      await downloadDecklistImage(parsedData, {
        deckName,
        playerName,
        popId,
        protocolo,
        eventName,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImageError = (cardKey: string) => {
    setImageErrors((prev) => ({ ...prev, [cardKey]: true }));
  };

  const handleCopyRaw = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const sections = [
    {
      title: "Pokémon",
      icon: "⚡",
      color: "border-amber-500/40 text-amber-300 bg-amber-500/10",
      items: parsedData.pokemon,
      totalCount: parsedData.pokemon.reduce((sum, c) => sum + c.count, 0),
    },
    {
      title: "Treinadores",
      icon: "🧪",
      color: "border-blue-500/40 text-blue-300 bg-blue-500/10",
      items: parsedData.trainer,
      totalCount: parsedData.trainer.reduce((sum, c) => sum + c.count, 0),
    },
    {
      title: "Energias",
      icon: "🔋",
      color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
      items: parsedData.energy,
      totalCount: parsedData.energy.reduce((sum, c) => sum + c.count, 0),
    },
  ].filter((s) => s.items.length > 0);

  if (parsedData.totalCards === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/90 p-4 backdrop-blur-xl shadow-2xl ${className}`}>
      {/* Header com Totais e Alternador de Visão */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-inner">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              {deckName}
              {parsedData.isValid60 ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> 60/60 Válido
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  <AlertCircle className="h-3 w-3" /> {parsedData.totalCards}/60 Cartas
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {parsedData.pokemon.reduce((sum, c) => sum + c.count, 0)} Pokémon •{" "}
              {parsedData.trainer.reduce((sum, c) => sum + c.count, 0)} Treinadores •{" "}
              {parsedData.energy.reduce((sum, c) => sum + c.count, 0)} Energias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Baixar ou compartilhar imagem do baralho (PNG)"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Gerando Imagem...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Imagem</span>
              </>
            )}
          </button>

          {allowToggleView && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView("visual")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeView === "visual"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("text")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeView === "text"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Texto</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo: Visão Gráfica de Cartas */}
      {activeView === "visual" ? (
        <div className="space-y-4 pt-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 ${sec.color}`}>
                  <span>{sec.icon}</span>
                  <span>{sec.title}</span>
                  <span className="font-extrabold opacity-90">({sec.totalCount})</span>
                </span>
              </div>

              {/* Grid de Cartas com Miniaturas e Badges */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {sec.items.map((card, idx) => {
                  const cardKey = `${card.set}_${card.number}_${idx}`;
                  const isError = imageErrors[cardKey] || !card.imageUrl;

                  return (
                    <motion.div
                      key={cardKey}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="group relative flex flex-col items-center rounded-xl border border-white/10 bg-slate-900/80 p-1.5 text-center shadow-lg transition-all overflow-hidden"
                    >
                      {/* Badge com Quantidade de Cópias (4x) */}
                      <span className="absolute top-1 left-1 z-10 rounded-md bg-slate-950/90 border border-amber-400/60 px-1.5 py-0.5 text-[10px] font-black text-amber-300 shadow-md backdrop-blur-sm">
                        {card.count}x
                      </span>

                      {/* Tag do Set e Número (OBF 125) */}
                      <span className="absolute top-1 right-1 z-10 rounded bg-slate-950/80 border border-white/20 px-1 text-[8px] font-mono text-slate-300 shadow backdrop-blur-sm">
                        {card.set}
                      </span>

                      {/* Imagem da Carta ou Fallback Glass */}
                      <div className="relative aspect-[2.5/3.5] w-full rounded-lg overflow-hidden bg-slate-950 mt-4 mb-1">
                        {!isError ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            loading="lazy"
                            onError={() => handleImageError(cardKey)}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-1 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-400">
                            <Layers className="h-5 w-5 text-slate-500 mb-1 opacity-60" />
                            <span className="text-[9px] font-bold text-center leading-tight line-clamp-2 text-slate-300">
                              {card.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nome da Carta */}
                      <span className="w-full truncate text-[10px] font-bold text-slate-200 group-hover:text-white" title={card.name}>
                        {card.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Conteúdo: Visão em Texto Bruto Formatado */
        <div className="pt-3 space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCopyRaw}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-all"
            >
              {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedText ? "Copiado!" : "Copiar Texto"}</span>
            </button>
          </div>
          <pre className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
            {rawText || "Nenhuma decklist informada."}
          </pre>
        </div>
      )}
    </div>
  );
}
