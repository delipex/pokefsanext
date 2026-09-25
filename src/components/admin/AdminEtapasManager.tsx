"use client";

import { useState } from "react";
import {
  Calendar,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Layers,
} from "lucide-react";

interface AdminEtapasManagerProps {
  etapas: any[];
  onEtapasUpdated: () => void;
}

export function AdminEtapasManager({ etapas, onEtapasUpdated }: AdminEtapasManagerProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [stageToDelete, setStageToDelete] = useState<any | null>(null);

  // Ordenar cronologicamente do mais recente para o mais antigo para a visualização
  const sortedEtapas = [...etapas].sort((a, b) => b.data.localeCompare(a.data));
  // Ordenar cronologicamente para calcular o número da etapa (antigo -> novo)
  const chronological = [...etapas].sort((a, b) => a.data.localeCompare(b.data));

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleDeleteStage = async (stageData: string) => {
    setIsDeleting(stageData);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/stage?data=${encodeURIComponent(stageData)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao excluir etapa");
      }
      setStatusMessage({ text: data.message || "Etapa excluída e ranking recalculado com sucesso!", type: "success" });
      setStageToDelete(null);
      onEtapasUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Falha na comunicação com o servidor", type: "error" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRecalculateRanking = async () => {
    setIsRecalculating(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recalculate" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao recalcular ranking");
      }
      setStatusMessage({ text: data.message || "Ranking geral recalculado com sucesso!", type: "success" });
      onEtapasUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Falha ao recalcular ranking", type: "error" });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Card Principal: Gerenciador de Etapas */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <span>Gerenciador de Etapas da Temporada</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualize todas as etapas ativas processadas na temporada, verifique participações e remova etapas em duplicidade.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs font-semibold text-amber-300">
            {etapas.length} {etapas.length === 1 ? "Etapa Ativa" : "Etapas Ativas"}
          </div>
        </div>

        {sortedEtapas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-base font-semibold">Nenhuma etapa cadastrada nesta temporada.</p>
            <p className="text-xs text-slate-500 mt-1">
              Faça o upload do primeiro arquivo .tdf na aba &quot;Publicar Etapa&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase font-bold text-slate-400 bg-slate-900/40">
                  <th className="py-3 px-4">Etapa #</th>
                  <th className="py-3 px-4">Data Oficial</th>
                  <th className="py-3 px-4">Tipo de Evento</th>
                  <th className="py-3 px-4 text-center">Multiplicador</th>
                  <th className="py-3 px-4 text-center">Jogadores</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedEtapas.map((stg) => {
                  const num = chronological.findIndex((c) => c.data === stg.data) + 1;
                  const isPremier = Number(stg.multiplicador) > 1.0;

                  return (
                    <tr key={stg.data} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4 font-black text-amber-400">
                        #{num}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {formatDateBR(stg.data)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                            isPremier
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {isPremier && <Award className="h-3 w-3" />}
                          {stg.tipo || "Liga"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold tabular-nums">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10">
                          {Number(stg.multiplicador || 1.0).toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {stg.totalJogadores || "--"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setStageToDelete(stg)}
                          disabled={isDeleting === stg.data}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Excluir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé com botão de recalcular ranking */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRecalculateRanking}
            disabled={isRecalculating}
            className="w-full max-w-md py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Recalculando Ranking..." : "🔄 Recalcular Ranking Geral do Site"}</span>
          </button>
          <p className="text-xs text-slate-400 text-center max-w-xl">
            💡 Se houver qualquer divergência de pontuação ou se uma etapa foi editada/removida, este botão reconstrói toda a pontuação e desempates do ranking geral cruzando todos os dados ativos.
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-red-500/30 bg-slate-950 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Excluir Etapa da Temporada</h3>
            </div>
            <p className="text-sm text-slate-300">
              Você tem certeza que deseja excluir a etapa de{" "}
              <strong className="text-white">{formatDateBR(stageToDelete.data)} ({stageToDelete.tipo})</strong>?
            </p>
            <p className="text-xs text-slate-400 bg-red-950/40 p-3 rounded-xl border border-red-800/30">
              ⚠️ Esta ação removerá permanentemente os resultados dessa etapa do banco de dados e recalculará o ranking geral consolidado automaticamente.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStage(stageToDelete.data)}
                disabled={isDeleting === stageToDelete.data}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
              >
                {isDeleting === stageToDelete.data ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
