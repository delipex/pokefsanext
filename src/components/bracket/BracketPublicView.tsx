"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Maximize2,
  Minimize2,
  RefreshCw,
  Swords,
  Calendar,
  MapPin,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { SeasonFinalBrackets } from "@/lib/bracket-types";
import { BracketTreeViewer } from "./BracketTreeViewer";

interface BracketPublicViewProps {
  initialBrackets: SeasonFinalBrackets;
}

export function BracketPublicView({ initialBrackets }: BracketPublicViewProps) {
  const [brackets, setBrackets] = useState<SeasonFinalBrackets>(initialBrackets);
  const [activeCategory, setActiveCategory] = useState<"master" | "seniorJunior">("master");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchLatestBrackets = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/bracket");
      if (res.ok) {
        const data = await res.json();
        if (data.brackets) {
          setBrackets(data.brackets);
          setLastRefreshed(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar chaveamento:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh a cada 25 segundos
  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    const interval = setInterval(fetchLatestBrackets, 25000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentBracket = activeCategory === "master" ? brackets.master : brackets.seniorJunior;

  return (
    <div className={`space-y-6 ${isFullscreen ? "p-4 sm:p-8 bg-slate-950 min-h-screen text-white" : ""}`}>
      {/* Topo / Header da Página de Finais */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              Mata-Mata Oficial
            </span>
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Temporada {brackets.temporada}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {brackets.tituloEvento || "Finais da Temporada • Torneio dos Campeões"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {brackets.localEvento || "Livraria Atlântica +"}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              {brackets.dataEvento || "Hoje"}
            </span>
            {lastRefreshed && (
              <>
                <span>•</span>
                <span className="text-[11px] text-slate-500">
                  Atualizado às {lastRefreshed}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={fetchLatestBrackets}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer border border-white/10"
            title="Atualizar chaveamento agora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-black text-slate-950 transition-colors cursor-pointer shadow-md shadow-amber-400/20"
            title="Modo Telão / TV"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{isFullscreen ? "Sair da Tela Cheia" : "Modo Telão"}</span>
          </button>
        </div>
      </div>

      {/* Seletor de Categoria (Master Top 16 vs Senior+Junior Top 8) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 max-w-md mx-auto sm:mx-0">
        <button
          type="button"
          onClick={() => setActiveCategory("master")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeCategory === "master"
              ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Swords className="h-4 w-4" />
          <span>Master (Top 16)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("seniorJunior")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeCategory === "seniorJunior"
              ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Senior + Junior (Top 8)</span>
        </button>
      </div>

      {/* Árvore Visual do Chaveamento */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <BracketTreeViewer bracket={currentBracket} isAdmin={false} />
      </div>

      {/* Rodapé com atalho para o ranking geral */}
      {!isFullscreen && (
        <div className="text-center pt-2 pb-6">
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Voltar para a Classificação Geral da Temporada</span>
          </Link>
        </div>
      )}
    </div>
  );
}
