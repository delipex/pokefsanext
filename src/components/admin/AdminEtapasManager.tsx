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
  Pencil,
  Sparkles,
  X,
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
  const [stageToEdit, setStageToEdit] = useState<any | null>(null);
  const [editMultiplier, setEditMultiplier] = useState<number>(1.0);
  const [editTipo, setEditTipo] = useState<string>("Liga");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const handleOpenEditModal = (stg: any) => {
    setStageToEdit(stg);
    setEditMultiplier(Number(stg.multiplicador) || 1.0);
    setEditTipo(stg.tipo || "Liga");
  };

  const handleSaveStageEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageToEdit) return;
    setIsSavingEdit(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/admin/stage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: stageToEdit.data,
          tipo: editTipo,
          multiplicador: editMultiplier,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar alterações da etapa");
      }
      setStatusMessage({ text: data.message || "Etapa e ranking consolidado atualizados com sucesso!", type: "success" });
      setStageToEdit(null);
      onEtapasUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Falha ao salvar alterações", type: "error" });
    } finally {
      setIsSavingEdit(false);
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(stg)}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Editar Tipo e Multiplicador"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStageToDelete(stg)}
                            disabled={isDeleting === stg.data}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
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

      {/* Modal de Edição de Tipo e Multiplicador */}
      {stageToEdit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStageEdit}
            className="glass-card max-w-lg w-full p-6 rounded-2xl border border-purple-500/30 bg-slate-950 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-purple-300">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-lg font-bold text-white">Editar Etapa & Multiplicador</h3>
              </div>
              <button
                type="button"
                onClick={() => setStageToEdit(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Data Oficial:</span>
                <span className="font-bold text-white text-sm">{formatDateBR(stageToEdit.data)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tipo / Categoria do Evento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { label: "Liga", sub: "1.0x", mult: 1.0 },
                    { label: "Challenge", sub: "1.5x", mult: 1.5 },
                    { label: "Cup", sub: "1.5x", mult: 1.5 },
                    { label: "Especial", sub: "Livre", mult: editMultiplier },
                  ].map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => {
                        setEditTipo(cat.label);
                        if (cat.label !== "Especial") {
                          setEditMultiplier(cat.mult);
                        }
                      }}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                        editTipo.toLowerCase().includes(cat.label.toLowerCase())
                          ? "bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-500/20"
                          : "bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <div>{cat.label}</div>
                      <div className="text-[10px] text-purple-300/80 font-normal">{cat.sub}</div>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value)}
                  placeholder="Nome customizado (Ex: Especial (Retrô))"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Modificador Dinâmico de Multiplicador */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Multiplicador de Pontuação:
                  </label>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                    {editMultiplier.toFixed(2)}x aplicado
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(0.1, Number((editMultiplier - 0.25).toFixed(2)));
                      setEditMultiplier(next);
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black border border-white/10 active:scale-95 transition-all text-base cursor-pointer"
                    title="Diminuir 0.25x"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="10.0"
                      value={editMultiplier}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditMultiplier(isNaN(val) ? 1.0 : Math.max(0.1, Math.min(10.0, val)));
                      }}
                      className="w-full h-10 rounded-xl border border-purple-500/50 bg-slate-900 py-2 px-3 text-center text-sm font-black text-amber-300 focus:outline-none focus:border-purple-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      x
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(10.0, Number((editMultiplier + 0.25).toFixed(2)));
                      setEditMultiplier(next);
                    }}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black border border-white/10 active:scale-95 transition-all text-base cursor-pointer"
                    title="Aumentar 0.25x"
                  >
                    +
                  </button>
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditMultiplier(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        Math.abs(editMultiplier - preset) < 0.01
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/30 border border-purple-400"
                          : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
                      }`}
                    >
                      {preset.toFixed(2).replace(/\.00$/, "").replace(/(\.[1-9])0$/, "$1")}x
                    </button>
                  ))}
                </div>

                {/* Simulador de Pontuação em tempo real */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 text-xs text-purple-200 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>
                      <strong>Simulador:</strong> Vitória (3 pts) ={" "}
                      <span className="text-amber-300 font-bold">{(3 * editMultiplier).toFixed(1)} pts</span> • Empate (1 pt) ={" "}
                      <span className="text-amber-300 font-bold">{(1 * editMultiplier).toFixed(1)} pts</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStageToEdit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Salvar & Recalcular Ranking</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
