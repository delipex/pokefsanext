"use client";

import { useState } from "react";
import {
  BookOpen,
  ShieldCheck,
  Award,
  Trophy,
  Scale,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  Check,
  FileText,
  HelpCircle,
} from "lucide-react";

export interface RegraSection {
  icon: string;
  color: string;
  title: string;
  content: string[];
}

export const DEFAULT_REGRAS_DATA: RegraSection[] = [
  {
    icon: "ShieldCheck",
    color: "blue",
    title: "1. Formato do Torneio",
    content: [
      "As partidas das Sessões de Liga seguem o Formato Standard oficial estabelecido pela The Pokémon Company International.",
      "Legalidade: São permitidas apenas cartas com as marcas de regulamento vigentes (ex: bloco H e posteriores).",
      "Listas de Deck: Os jogadores são responsáveis por manter seus decks dentro das diretrizes de legalidade vigentes em cada etapa.",
    ],
  },
  {
    icon: "Trophy",
    color: "yellow",
    title: "2. Sistema de Pontuação e Ranking",
    content: [
      "Vitória: 3 pontos | Empate: 1 ponto | Derrota: 0 pontos.",
      "Multiplicadores de Eventos Especiais: League Challenge e League Cup possuem multiplicador de 1.5x a 2.0x sobre a pontuação.",
      "Critérios de Desempate no Ranking: 1º Pontos Acumulados ➔ 2º Número de Pódios (Top 4) ➔ 3º Média de Colocação (menor é melhor) ➔ 4º Ordem Alfabética.",
    ],
  },
  {
    icon: "Award",
    color: "purple",
    title: "3. Premiação e Playoffs Trimestrais",
    content: [
      "Ao final de cada temporada trimestral, os 4 melhores colocados avançam para os Playoffs (Top Cut).",
      "Formato do Top Cut: Rodada eliminatória presencial (Single Elimination).",
      "Premiação: Troféus personalizados, boosters exclusivos e premiações especiais para os campeões.",
    ],
  },
  {
    icon: "Scale",
    color: "emerald",
    title: "4. Código de Conduta e Fair Play",
    content: [
      "A integridade do jogo e o respeito mútuo são pilares fundamentais da nossa comunidade.",
      "Seguimos rigorosamente o manual de Play! Pokémon e as orientações da arbitragem oficial.",
      "Condutas antidesportivas, trapaças ou desrespeito a outros jogadores resultam em advertência ou desclassificação imediata da temporada.",
    ],
  },
];

const ICONS_CONFIG: Record<string, { label: string; icon: any }> = {
  ShieldCheck: { label: "Escudo / Formato", icon: ShieldCheck },
  Trophy: { label: "Troféu / Pontuação", icon: Trophy },
  Award: { label: "Medalha / Premiação", icon: Award },
  Scale: { label: "Balança / Conduta", icon: Scale },
  BookOpen: { label: "Livro / Geral", icon: BookOpen },
  FileText: { label: "Documento / Lista", icon: FileText },
  Sparkles: { label: "Especial / Destaque", icon: Sparkles },
};

const COLORS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  blue: { label: "Azul (Water / Standard)", badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  yellow: { label: "Dourado (Lightning / Ranking)", badgeClass: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  purple: { label: "Roxo (Psychic / Playoffs)", badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  emerald: { label: "Verde (Grass / Fair Play)", badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  rose: { label: "Vermelho / Rosa (Fire / Penalidades)", badgeClass: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  amber: { label: "Âmbar (Laranja / Avisos)", badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  indigo: { label: "Índigo (Dark / Oficial)", badgeClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
};

interface AdminRegrasManagerProps {
  initialRegras?: any;
  onSaved?: () => void;
}

export function AdminRegrasManager({ initialRegras, onSaved }: AdminRegrasManagerProps) {
  const parseInitial = (): RegraSection[] => {
    if (!initialRegras) return DEFAULT_REGRAS_DATA;
    if (Array.isArray(initialRegras)) return initialRegras;
    try {
      if (typeof initialRegras === "string") {
        const parsed = JSON.parse(initialRegras);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_REGRAS_DATA;
  };

  const [sections, setSections] = useState<RegraSection[]>(parseInitial);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState(false);

  const handleSectionTitleChange = (sIdx: number, newTitle: string) => {
    const updated = [...sections];
    updated[sIdx].title = newTitle;
    setSections(updated);
  };

  const handleSectionIconChange = (sIdx: number, newIcon: string) => {
    const updated = [...sections];
    updated[sIdx].icon = newIcon;
    setSections(updated);
  };

  const handleSectionColorChange = (sIdx: number, newColor: string) => {
    const updated = [...sections];
    updated[sIdx].color = newColor;
    setSections(updated);
  };

  const handleItemChange = (sIdx: number, iIdx: number, newText: string) => {
    const updated = [...sections];
    updated[sIdx].content[iIdx] = newText;
    setSections(updated);
  };

  const handleAddItem = (sIdx: number) => {
    const updated = [...sections];
    updated[sIdx].content.push("");
    setSections(updated);
  };

  const handleRemoveItem = (sIdx: number, iIdx: number) => {
    const updated = [...sections];
    updated[sIdx].content.splice(iIdx, 1);
    setSections(updated);
  };

  const handleAddSection = () => {
    const nextNum = sections.length + 1;
    setSections([
      ...sections,
      {
        icon: "BookOpen",
        color: "blue",
        title: `${nextNum}. Nova Seção de Regras`,
        content: ["Insira o primeiro parágrafo ou diretriz desta regra aqui..."],
      },
    ]);
  };

  const handleRemoveSection = (sIdx: number) => {
    if (!confirm("Tem certeza que deseja excluir esta seção de regulamento?")) return;
    const updated = sections.filter((_, idx) => idx !== sIdx);
    setSections(updated);
  };

  const handleRestoreDefault = () => {
    if (!confirm("Deseja restaurar as 4 seções oficiais padrão da Liga Atlântica? As alterações não salvas serão substituídas.")) return;
    setSections(DEFAULT_REGRAS_DATA);
    setMessage("Padrão restaurado no formulário. Lembre-se de clicar em Salvar.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "regras",
          valor: sections,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao salvar regulamento.");
      }

      setMessage("✅ Regulamento oficial atualizado com sucesso no site!");
      if (onSaved) onSaved();
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
      {/* Topo do Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📜</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Regulamento Oficial & Regras da Liga
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalize as diretrizes, sistema de pontuação, código de conduta e formato exibidos na página pública <strong className="text-amber-400">/regras</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActivePreview(!activePreview)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>{activePreview ? "Modo Edição" : "Pré-visualizar"}</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDefault}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Restaurar formato padrão oficial"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Salvando..." : "Salvar Regulamento"}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
            message.startsWith("✅")
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : message.startsWith("❌")
              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          }`}
        >
          <span>{message}</span>
        </div>
      )}

      {/* MODO PRÉ-VISUALIZAÇÃO */}
      {activePreview ? (
        <div className="space-y-6 rounded-2xl border border-white/5 bg-slate-950/60 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Visualização Exata da Página /regras
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{sections.length} seções ativas</span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {sections.map((section, idx) => {
              const IconComp = (ICONS_CONFIG[section.icon]?.icon) || BookOpen;
              const colorConfig = COLORS_CONFIG[section.color] || COLORS_CONFIG.blue;

              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-7 backdrop-blur-2xl shadow-xl space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${colorConfig.badgeClass}`}>
                      <IconComp className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black text-white">{section.title}</h3>
                  </div>

                  <div className="space-y-3 pl-1">
                    {section.content.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed font-normal">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{p || <span className="text-slate-500 italic">Linha em branco...</span>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MODO EDITOR DE SEÇÕES */
        <div className="space-y-6">
          {sections.map((section, sIdx) => {
            const IconComp = (ICONS_CONFIG[section.icon]?.icon) || BookOpen;
            const colorConfig = COLORS_CONFIG[section.color] || COLORS_CONFIG.blue;

            return (
              <div
                key={sIdx}
                className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950/70 p-5 sm:p-6 space-y-4 shadow-lg transition-all"
              >
                {/* Linha Superior: Ícone, Cor, Título e Excluir */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${colorConfig.badgeClass}`}>
                      <IconComp className="h-4 w-4" />
                    </span>

                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                      placeholder="Ex: 1. Formato do Torneio"
                      className="w-full rounded-xl border border-white/10 bg-slate-900/90 py-2 px-3 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    {/* Seletor de Ícone */}
                    <select
                      value={section.icon}
                      onChange={(e) => handleSectionIconChange(sIdx, e.target.value)}
                      className="rounded-xl border border-white/10 bg-slate-900/90 py-2 px-3 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {Object.entries(ICONS_CONFIG).map(([iKey, iVal]) => (
                        <option key={iKey} value={iKey} className="bg-slate-900 text-white">
                          {iVal.label}
                        </option>
                      ))}
                    </select>

                    {/* Seletor de Cor */}
                    <select
                      value={section.color}
                      onChange={(e) => handleSectionColorChange(sIdx, e.target.value)}
                      className="rounded-xl border border-white/10 bg-slate-900/90 py-2 px-3 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {Object.entries(COLORS_CONFIG).map(([cKey, cVal]) => (
                        <option key={cKey} value={cKey} className="bg-slate-900 text-white">
                          {cVal.label}
                        </option>
                      ))}
                    </select>

                    {/* Botão Remover Seção */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer shrink-0"
                      title="Excluir Seção"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Lista de Tópicos / Diretrizes da Seção */}
                <div className="space-y-2.5 pl-1 sm:pl-2">
                  <label className="block text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Diretrizes e Regras Desta Seção:
                  </label>

                  {section.content.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleItemChange(sIdx, iIdx, e.target.value)}
                        placeholder="Descreva uma regra ou diretriz..."
                        className="flex-1 rounded-xl border border-white/10 bg-slate-900/70 py-2 px-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(sIdx, iIdx)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                        title="Remover este tópico"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleAddItem(sIdx)}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 py-1.5 px-3 rounded-lg bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/20 transition-all cursor-pointer mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Tópico / Regra</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Botão Adicionar Nova Seção */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddSection}
              className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/40 py-4 text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:border-amber-400/50 hover:bg-amber-500/5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Adicionar Nova Seção de Regulamento</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
