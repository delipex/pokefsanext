"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";

export function AdminAuditoria() {
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<"all" | "warn">("all");
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const runAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/audit");
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao executar auditoria.");
      }
      setAuditData(data);
    } catch (err: any) {
      setError(err.message || "Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const toggleStageExpand = (date: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const stagesList = auditData?.stages || [];
  const filteredStages = stagesList.filter((s: any) => {
    if (filterView === "warn") {
      return s.hasIssues || s.errorsCount > 0 || s.warningsCount > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span>Auditoria e Diagnóstico do Sistema</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verificação em tempo real de integridade do banco de dados, fórmulas de pontuação V/E/D, conformidade de POP IDs e metagame.
            </p>
          </div>

          <button
            type="button"
            onClick={runAudit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Auditando..." : "Atualizar Diagnóstico"}</span>
          </button>
        </div>

        {/* Status / Loading / Erro */}
        {loading && (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
            <p className="text-sm font-semibold">Executando varredura e cruzamento de dados...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Erro ao auditar: {error}</span>
          </div>
        )}

        {/* Dashboard de Métricas */}
        {!loading && auditData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Etapas */}
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Etapas Ativas</div>
                <div className="text-2xl font-black text-white mt-1">
                  {auditData.metrics.totalStages}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {auditData.metrics.totalParticipations} participações auditadas
                </div>
              </div>

              {/* Card 2: VED / Pontos */}
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fórmula V/E/D</div>
                <div className={`text-2xl font-black mt-1 ${auditData.metrics.totalFormulaMismatches === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {auditData.metrics.totalFormulaMismatches === 0 ? "100% OK" : `${auditData.metrics.totalFormulaMismatches} Alertas`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  (V*3 + E*1) * Multiplicador
                </div>
              </div>

              {/* Card 3: Integridade de IDs */}
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Integridade de IDs</div>
                <div className={`text-2xl font-black mt-1 ${auditData.metrics.totalMissingIds === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {auditData.metrics.totalMissingIds === 0 ? "100% Válidos" : `${auditData.metrics.totalMissingIds} Sem POP ID`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Chaves primárias de jogadores
                </div>
              </div>

              {/* Card 4: Decks */}
              <div className="glass-card rounded-xl p-4 border border-white/10 bg-slate-900/40">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Decks Catalogados</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">
                  {auditData.metrics.totalUnregisteredDecks === 0 ? "100% Mapeados" : `${auditData.metrics.totalUnregisteredDecks} Pendentes`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Arquétipos associados a etapas
                </div>
              </div>
            </div>

            {/* Alerta de Jogadores Duplicados no Ranking Geral */}
            {auditData.duplicatePlayers && auditData.duplicatePlayers.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Divergência detectada no Ranking Geral: Jogadores com mais de uma linha</span>
                </div>
                <p>
                  O auditor identificou duplicidades na tabela consolidada: <strong>{auditData.duplicatePlayers.join(", ")}</strong>.
                  Recomenda-se clicar em &quot;Recalcular Ranking Geral&quot; na aba de Etapas para consolidar as entradas.
                </p>
              </div>
            )}

            {/* Barra de Filtro de Etapas */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterView("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterView === "all"
                      ? "bg-slate-700 text-white shadow-md"
                      : "bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  Todas as Etapas ({stagesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView("warn")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterView === "warn"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  Com Alertas / Pendências ({stagesList.filter((s: any) => s.hasIssues).length})
                </button>
              </div>

              <span className="text-xs text-slate-400">
                Última checagem: {new Date(auditData.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Lista de Etapas (Accordion) */}
            <div className="space-y-3">
              {filteredStages.map((stg: any) => {
                const isExpanded = Boolean(expandedStages[stg.data]);
                const hasAlerts = stg.hasIssues || stg.errorsCount > 0 || stg.warningsCount > 0;

                return (
                  <div
                    key={stg.data}
                    className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden transition-all"
                  >
                    {/* Linha Cabeçalho da Etapa */}
                    <div
                      onClick={() => toggleStageExpand(stg.data)}
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        {hasAlerts ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {formatDateBR(stg.data)}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({stg.tipo} • {stg.multiplicador}x)
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {stg.totalJogadores} Jogadores • {stg.decksPreenchidos}/{stg.totalJogadores} Decks Registrados
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            hasAlerts
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {hasAlerts ? `${stg.warningsCount + stg.errorsCount} Pendências` : "Conforme ✅"}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Detalhes Expandidos da Etapa */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/10 bg-slate-950/60 space-y-3">
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left text-xs text-slate-300 border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-400 uppercase font-bold">
                                <th className="py-2 px-3 w-12 text-center">Pos</th>
                                <th className="py-2 px-3">Jogador</th>
                                <th className="py-2 px-3">POP ID</th>
                                <th className="py-2 px-3 text-center">V-E-D</th>
                                <th className="py-2 px-3 text-center">Pontos</th>
                                <th className="py-2 px-3">Deck</th>
                                <th className="py-2 px-3">Diagnóstico</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {stg.players.map((p: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className={p.hasIssues ? "bg-amber-500/[0.04]" : ""}
                                >
                                  <td className="py-2 px-3 text-center font-bold text-amber-400">
                                    #{p.colocacao}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-white">
                                    {p.jogadorNome}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 font-mono">
                                    {p.jogadorId || "--"}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-slate-300">
                                    {p.record}
                                  </td>
                                  <td className="py-2 px-3 text-center font-bold text-emerald-400">
                                    {p.pontos}
                                  </td>
                                  <td className="py-2 px-3 text-slate-300">
                                    {p.deckNome}
                                  </td>
                                  <td className="py-2 px-3">
                                    {p.hasIssues ? (
                                      <div className="space-y-0.5 text-amber-300">
                                        {p.issues.map((iss: string, iIdx: number) => (
                                          <div key={iIdx}>⚠️ {iss}</div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-emerald-400">✓ OK</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
