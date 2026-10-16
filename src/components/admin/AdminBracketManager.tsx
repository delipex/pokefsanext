"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Swords,
  Sparkles,
  RefreshCw,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { SeasonFinalBrackets, CategoryBracket, BracketPlayer } from "@/lib/bracket-types";
import { BracketTreeViewer } from "../bracket/BracketTreeViewer";

export function AdminBracketManager() {
  const [brackets, setBrackets] = useState<SeasonFinalBrackets | null>(null);
  const [activeCategory, setActiveCategory] = useState<"master" | "seniorJunior">("master");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal para substituir ou trocar um atleta classificado
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<{ category: "master" | "seniorJunior"; matchId: string; slot: "player1" | "player2" } | null>(null);
  const [manualPlayerName, setManualPlayerName] = useState("");
  const [manualPlayerId, setManualPlayerId] = useState("");
  const [manualPlayerDeck, setManualPlayerDeck] = useState("");

  const [isTopCutVisible, setIsTopCutVisible] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  const fetchBrackets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bracket");
      if (res.ok) {
        const data = await res.json();
        if (data.brackets) setBrackets(data.brackets);
      }
    } catch (err) {
      console.error("Erro ao carregar chaveamento:", err);
    } finally {
      setIsLoading(false);
    }

    // Busca o status de visibilidade pública nas configurações
    try {
      const resCfg = await fetch("/api/admin/config");
      if (resCfg.ok) {
        const dataCfg = await resCfg.json();
        const topCutVal = dataCfg?.configs?.exibirTopCut;
        setIsTopCutVisible(topCutVal === "true" || topCutVal === true);
      }
    } catch {}
  };

  useEffect(() => {
    fetchBrackets();
  }, []);

  const handleToggleTopCutVisibility = async () => {
    setIsTogglingVisibility(true);
    const nextVal = !isTopCutVisible;
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave: "exibirTopCut", valor: String(nextVal) }),
      });
      if (res.ok) {
        setIsTopCutVisible(nextVal);
        setFeedbackMessage({
          type: "success",
          text: nextVal
            ? "Botão do Top Cut agora está ATIVADO e visível no menu do site!"
            : "Botão do Top Cut agora está DESATIVADO e oculto do menu do site.",
        });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro ao atualizar visibilidade do Top Cut." });
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // 1. Puxar Finalistas Diretamente do Ranking Oficial da Temporada
  const handleGenerateFromRanking = async () => {
    if (!confirm("Deseja puxar os finalistas oficiais da temporada atual?\n\n• Master: Os 16 primeiros colocados\n• Senior + Junior: Os 8 primeiros colocados\n\nIsso irá montar as chaves oficiais de acordo com as colocações.")) {
      return;
    }

    setIsGenerating(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_from_ranking" }),
      });

      const data = await res.json();
      if (res.ok && data.brackets) {
        setBrackets(data.brackets);
        setFeedbackMessage({ type: "success", text: data.message || "Chaveamento gerado com sucesso a partir do ranking!" });
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao gerar chaveamento." });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: "error", text: "Erro de conexão ao gerar chaveamento." });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Atualizar Partida Interativamente
  const handleUpdateMatch = async (matchId: string, winnerId: string | null, score1: number, score2: number) => {
    if (!brackets) return;

    // Atualização otimista local
    const res = await fetch("/api/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_match",
        categoryKey: activeCategory,
        matchId,
        winnerId,
        score1,
        score2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.brackets) setBrackets(data.brackets);
    }
  };

  // 3. Salvar Chaveamento Completo
  const handleSaveBrackets = async () => {
    if (!brackets) return;
    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_brackets", brackets }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: "success", text: "Chaveamento e placares salvos com sucesso!" });
      } else {
        setFeedbackMessage({ type: "error", text: data.error || "Erro ao salvar." });
      }
    } catch {
      setFeedbackMessage({ type: "error", text: "Erro de conexão ao salvar." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !brackets) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
        <span>Carregando dados das finais...</span>
      </div>
    );
  }

  const currentBracket = activeCategory === "master" ? brackets?.master : brackets?.seniorJunior;

  return (
    <div className="space-y-6">
      {/* Header do Módulo de Finais */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
              Torneio dos Campeões
            </span>
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Temporada {brackets?.temporada || 5}
            </span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Chaveamento das Finais (Top Cut)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Puxe os classificados direto do ranking oficial da temporada (Top 16 Master e Top 8 Senior/Junior) e gerencie o mata-mata em tempo real.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleGenerateFromRanking}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-400/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Puxar Finalistas do Ranking</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBrackets}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Salvar Chaveamento</span>
          </button>

          <button
            type="button"
            onClick={handleToggleTopCutVisibility}
            disabled={isTogglingVisibility}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black border transition-all cursor-pointer ${
              isTopCutVisible
                ? "bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/30 shadow-sm shadow-purple-600/20"
                : "bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
            title="Clique para alternar se o botão Top Cut aparece no menu público do site"
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Menu do Site: {isTopCutVisible ? "🟢 Visível" : "🔴 Oculto"}</span>
          </button>

          <a
            href="/final"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 border border-white/10 transition-colors"
          >
            <span>Ver Página Pública</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Seletor de Categoria */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/10">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10 max-w-md w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveCategory("master")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeCategory === "master"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>Master (Top 16)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("seniorJunior")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeCategory === "seniorJunior"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Senior + Junior (Top 8)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span>
            💡 <strong>Instrução:</strong> Clique no card do jogador para declará-lo vencedor da série e avançá-lo para a próxima fase.
          </span>
        </div>
      </div>

      {/* Árvore do Chaveamento Interativa */}
      {currentBracket ? (
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
          <BracketTreeViewer
            bracket={currentBracket}
            isAdmin={true}
            onUpdateMatch={handleUpdateMatch}
          />
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 rounded-3xl border border-white/10 bg-slate-900/30">
          Nenhum chaveamento configurado. Clique no botão acima para puxar os classificados do ranking.
        </div>
      )}
    </div>
  );
}
