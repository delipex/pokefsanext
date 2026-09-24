"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Plus,
  Download,
  Calendar,
  Settings,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  ClipboardList,
  Sparkles,
  X,
} from "lucide-react";
import { EnergyBadge } from "../ui/EnergyBadge";

interface AdminInscricoesPremierProps {
  initialConfig: Record<string, any>;
  initialCalendar?: any[];
  initialDecklists?: any[];
  onConfigUpdated?: (newConfig: Record<string, any>) => void;
}

export function AdminInscricoesPremier({
  initialConfig,
  initialCalendar = [],
  initialDecklists = [],
  onConfigUpdated,
}: AdminInscricoesPremierProps) {
  // Configurações do Torneio Premier
  const [premierAbertas, setPremierAbertas] = useState(
    initialConfig.premierAbertas === "true" || initialConfig.premierAbertas === true
  );
  const [premierTipo, setPremierTipo] = useState(initialConfig.premierTipo || "Challenge");
  const [premierNome, setPremierNome] = useState(
    initialConfig.premierNome || "League Challenge #2 — Temporada 5"
  );
  const [premierSubtitulo, setPremierSubtitulo] = useState(
    initialConfig.premierSubtitulo || "Valendo 15 Championship Points (CP) + Premiação em Boosters"
  );
  const [premierData, setPremierData] = useState(
    initialConfig.premierData || new Date().toISOString().split("T")[0]
  );
  const [premierHorario, setPremierHorario] = useState(
    initialConfig.premierHorario || "Check-in às 13:30 • Rodada 1 às 14:00"
  );
  const [premierLocal, setPremierLocal] = useState(
    initialConfig.premierLocal || "Livraria Atlântica +"
  );
  const [premierValor, setPremierValor] = useState(initialConfig.premierValor || "35,00");
  const [premierVagas, setPremierVagas] = useState(initialConfig.premierVagas || "32");
  const [premierExigirDecklist, setPremierExigirDecklist] = useState(
    initialConfig.premierExigirDecklist === "true" || initialConfig.premierExigirDecklist === true
  );
  const [premierPix, setPremierPix] = useState(
    initialConfig.premierPix || "felipe.damasceno@pix.com"
  );
  const [premierTitular, setPremierTitular] = useState(
    initialConfig.premierTitular || "Liga Atlântica TCG (Felipe Damasceno)"
  );
  const [premierWaContato, setPremierWaContato] = useState(
    initialConfig.premierWaContato || ""
  );
  const [premierBanner, setPremierBanner] = useState(initialConfig.premierBanner || "");
  const [premierTema, setPremierTema] = useState(initialConfig.premierTema || "lightning");
  const [premierObs, setPremierObs] = useState(
    initialConfig.premierObs ||
      "Traga sua decklist impressa ou envie diretamente pelo formulário online até as 13:45. Formato Standard (Padrão)."
  );
  const [premierWebhook, setPremierWebhook] = useState(
    initialConfig.premierWebhook || ""
  );

  // Estados de Inscrições / Decklists
  const [decklists, setDecklists] = useState<any[]>(initialDecklists);
  const [subtab, setSubtab] = useState<"online" | "archived">("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedArchivedStage, setSelectedArchivedStage] = useState("all");

  // Modais e Feedback
  const [isNewRegistrationModalOpen, setIsNewRegistrationModalOpen] = useState(false);
  const [viewingDecklist, setViewingDecklist] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isUpdatingFromSheets, setIsUpdatingFromSheets] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTom, setCopiedTom] = useState(false);

  // Formulário de Nova Inscrição Manual
  const [manualForm, setManualForm] = useState({
    jogadorNome: "",
    jogadorId: "",
    categoria: "Master",
    deckNome: "",
    tipoEnergia: "colorless",
    statusPix: "Confirmado",
    decklistRaw: "",
  });

  const directLink = typeof window !== "undefined" ? `${window.location.origin}/#inscricao` : "https://pokefsanext.vercel.app/#inscricao";

  // Preenchimento automático ao selecionar evento do calendário
  const handleSelectCalendarEvent = (calIdStr: string) => {
    if (!calIdStr) return;
    const cal = initialCalendar.find((c) => String(c.id) === calIdStr);
    if (!cal) return;

    setPremierNome(cal.evento || "");
    setPremierData(cal.data || "");
    setPremierLocal(cal.local || "Livraria Atlântica +");
    setPremierHorario(cal.horario ? `Check-in às ${cal.horario}` : "");
    if (cal.evento?.toLowerCase().includes("challenge")) {
      setPremierTipo("Challenge");
    } else if (cal.evento?.toLowerCase().includes("cup")) {
      setPremierTipo("Cup");
    } else {
      setPremierTipo("Especial");
    }
  };

  // Salvar Configurações do Premier
  const handleSavePremierConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setFeedback(null);

    const payload = {
      premierAbertas: String(premierAbertas),
      premierTipo,
      premierNome,
      premierSubtitulo,
      premierData,
      premierHorario,
      premierLocal,
      premierValor,
      premierVagas,
      premierExigirDecklist: String(premierExigirDecklist),
      premierPix,
      premierTitular,
      premierWaContato,
      premierBanner,
      premierTema,
      premierObs,
      premierWebhook,
    };

    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao salvar configurações");

      setFeedback({ text: "Configurações do Torneio Premier salvas com sucesso!", type: "success" });
      onConfigUpdated?.(payload);
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao salvar", type: "error" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Copiar link de divulgação
  const handleCopyDirectLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Atualizar da planilha do Google Sheets via Webhook
  const handleSyncGoogleSheets = async () => {
    if (!premierWebhook) {
      setFeedback({ text: "Insira a URL do Webhook do Google Sheets acima para sincronizar.", type: "error" });
      return;
    }
    setIsUpdatingFromSheets(true);
    setFeedback(null);
    try {
      const res = await fetch(premierWebhook);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDecklists(data);
        setFeedback({ text: `${data.length} inscrições sincronizadas da planilha com sucesso!`, type: "success" });
      } else {
        setFeedback({ text: "Planilha consultada. Nenhuma inscrição pendente.", type: "success" });
      }
    } catch (err: any) {
      setFeedback({ text: "Erro ao consultar webhook do Google Sheets. Verifique a URL.", type: "error" });
    } finally {
      setIsUpdatingFromSheets(false);
    }
  };

  // Copiar roster para o formato TOM
  const handleCopyToTOM = () => {
    const lines = filteredList.map((d) => `${d.jogadorNome}\t${d.jogadorId || ""}\t${d.categoria || "Master"}`);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedTom(true);
    setTimeout(() => setCopiedTom(false), 2500);
  };

  // Exportar Roster CSV
  const handleExportCSV = () => {
    const headers = "Protocolo,Jogador,POP_ID,Categoria,Deck,Status_PIX,Data_Envio\n";
    const rows = filteredList
      .map(
        (d) =>
          `"${d.protocolo || ""}","${d.jogadorNome}","${d.jogadorId || ""}","${d.categoria || "Master"}","${d.deckNome || ""}","${d.statusPix || "Pendente"}","${d.enviadoEm || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${premierNome.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Alternar Status de Pagamento
  const handleTogglePayment = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "Confirmado" ? "Pendente" : "Confirmado";
    try {
      const res = await fetch("/api/admin/decklists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, statusPix: nextStatus }),
      });
      if (res.ok) {
        setDecklists((prev) =>
          prev.map((d) => (d.id === id ? { ...d, statusPix: nextStatus } : d))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir inscrição
  const handleDeleteRegistration = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta inscrição?")) return;
    try {
      const res = await fetch(`/api/admin/decklists?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setDecklists((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cadastrar inscrição manual
  const handleSaveManualRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/decklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          eventoNome: premierNome,
          etapaData: premierData,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao registrar");

      setDecklists((prev) => [data.item, ...prev]);
      setIsNewRegistrationModalOpen(false);
      setFeedback({ text: "Inscrição cadastrada com sucesso!", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Falha ao registrar", type: "error" });
    }
  };

  // Filtragem da lista
  const filteredList = useMemo(() => {
    return decklists.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.jogadorNome.toLowerCase().includes(q) ||
        (item.jogadorId && item.jogadorId.toLowerCase().includes(q)) ||
        (item.deckNome && item.deckNome.toLowerCase().includes(q)) ||
        (item.protocolo && item.protocolo.toLowerCase().includes(q));

      const matchCategory = !categoryFilter || item.categoria === categoryFilter;
      const matchPayment = !paymentFilter || item.statusPix === paymentFilter;

      return matchSearch && matchCategory && matchPayment;
    });
  }, [decklists, searchQuery, categoryFilter, paymentFilter]);

  const confirmedCount = decklists.filter((d) => d.statusPix === "Confirmado").length;
  const pendingCount = decklists.filter((d) => d.statusPix !== "Confirmado").length;

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-400" />
              <span>Gestão de Inscrições & Decklists (Premier Events)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie, personalize o formulário online e valide o envio de listas de 60 cartas de League Cups e League Challenges.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsNewRegistrationModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/10"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar / Importar Lista</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/10 shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Roster (CSV)</span>
            </button>
          </div>
        </div>

        {/* Card: Personalização & Controle de Inscrições (Premier) */}
        <div className="glass-card rounded-xl p-5 border border-amber-400/20 bg-slate-900/50 mb-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Personalização & Controle de Inscrições (Premier)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalize o banner, regras, taxa PIX, vagas, formato e requisitos de decklist exibidos aos jogadores.
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                premierAbertas
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              }`}
            >
              {premierAbertas ? "🟢 Inscrições Abertas" : "🔴 Inscrições Fechadas / Ocultas"}
            </div>
          </div>

          {/* Vincular a um evento do calendário */}
          <div className="p-3.5 rounded-xl bg-amber-400/[0.06] border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                ⚡ Vincular a um Evento do Calendário Oficial:
              </label>
              <select
                onChange={(e) => handleSelectCalendarEvent(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              >
                <option value="">-- Selecione um evento do calendário para vincular --</option>
                {initialCalendar.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.data} • {cal.evento} ({cal.local})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-400 max-w-xs leading-tight">
              Ao selecionar, o sistema preenche automaticamente o <strong>Nome</strong>, <strong>Data</strong>, <strong>Tipo</strong>, <strong>Local</strong> e <strong>Horário</strong> do torneio.
            </div>
          </div>

          <form onSubmit={handleSavePremierConfig} className="space-y-4 text-xs">
            {/* Linha 1: Status e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status das Inscrições</label>
                <select
                  value={String(premierAbertas)}
                  onChange={(e) => setPremierAbertas(e.target.value === "true")}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="true">🟢 Abertas (Exibir botão e aceitar inscrições)</option>
                  <option value="false">🔴 Fechadas / Ocultas (Ocultar botão no site)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Torneio</label>
                <select
                  value={premierTipo}
                  onChange={(e) => setPremierTipo(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Challenge">League Challenge (1.5x)</option>
                  <option value="Cup">League Cup (1.5x)</option>
                  <option value="Especial">Torneio Especial / Comemorativo</option>
                  <option value="Liga">Sessão Regular de Liga</option>
                </select>
              </div>
            </div>

            {/* Linha 2: Nome e Subtítulo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Oficial do Evento</label>
                <input
                  type="text"
                  required
                  value={premierNome}
                  onChange={(e) => setPremierNome(e.target.value)}
                  placeholder="Ex: League Challenge #2 — Temporada 5"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subtítulo / Destaques / Premiação Resumida</label>
                <input
                  type="text"
                  value={premierSubtitulo}
                  onChange={(e) => setPremierSubtitulo(e.target.value)}
                  placeholder="Ex: Valendo 15 Championship Points (CP) + Premiação em Boosters"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Linha 3: Data, Horário e Local */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Data do Evento</label>
                <input
                  type="date"
                  required
                  value={premierData}
                  onChange={(e) => setPremierData(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Horários / Cronograma</label>
                <input
                  type="text"
                  value={premierHorario}
                  onChange={(e) => setPremierHorario(e.target.value)}
                  placeholder="Ex: Check-in às 13:30 • Rodada 1 às 14:00"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Local do Evento</label>
                <input
                  type="text"
                  value={premierLocal}
                  onChange={(e) => setPremierLocal(e.target.value)}
                  placeholder="Ex: Livraria Atlântica +"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Linha 4: Taxa, Vagas e Exigência de Decklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Taxa de Inscrição (R$)</label>
                <input
                  type="text"
                  value={premierValor}
                  onChange={(e) => setPremierValor(e.target.value)}
                  placeholder="Ex: 35,00"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Capacidade Máxima (Vagas)</label>
                <input
                  type="number"
                  min="4"
                  max="128"
                  value={premierVagas}
                  onChange={(e) => setPremierVagas(e.target.value)}
                  placeholder="Ex: 32"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Exigência de Decklist (60 Cartas)</label>
                <select
                  value={String(premierExigirDecklist)}
                  onChange={(e) => setPremierExigirDecklist(e.target.value === "true")}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="true">📜 Obrigatória no formulário (60 cartas)</option>
                  <option value="false">📝 Opcional (pode entregar até a Rodada 1)</option>
                </select>
              </div>
            </div>

            {/* Linha 5: Chave PIX, Titular e WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chave PIX para Pagamento</label>
                <input
                  type="text"
                  value={premierPix}
                  onChange={(e) => setPremierPix(e.target.value)}
                  placeholder="Ex: felipe.damasceno@pix.com"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Favorecido / Titular do PIX</label>
                <input
                  type="text"
                  value={premierTitular}
                  onChange={(e) => setPremierTitular(e.target.value)}
                  placeholder="Ex: Liga Atlântica TCG (Felipe Damasceno)"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp do Organizador (Envio Direto)</label>
                <input
                  type="text"
                  value={premierWaContato}
                  onChange={(e) => setPremierWaContato(e.target.value)}
                  placeholder="Ex: 5575999999999 (Vazio = padrão)"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            {/* Linha 6: Banner e Tema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL do Banner / Arte de Capa (Opcional)</label>
                <input
                  type="url"
                  value={premierBanner}
                  onChange={(e) => setPremierBanner(e.target.value)}
                  placeholder="https://exemplo.com/banner-cup.jpg"
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tema de Cor / Energia</label>
                <select
                  value={premierTema}
                  onChange={(e) => setPremierTema(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="lightning">⚡ Lightning / Amarelo (Padrão)</option>
                  <option value="fire">🔥 Fire / Vermelho</option>
                  <option value="water">💧 Water / Azul Turquesa</option>
                  <option value="psychic">🔮 Psychic / Roxo</option>
                  <option value="grass">🌿 Grass / Verde Esmeralda</option>
                  <option value="darkness">🌑 Darkness / Azul Petróleo</option>
                  <option value="dragon">🐉 Dragon / Dourado</option>
                  <option value="metal">⚙️ Metal / Prateado</option>
                </select>
              </div>
            </div>

            {/* Linha 7: Instruções e Regras */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Instruções, Regras & Premiação no Modal de Inscrição</label>
              <textarea
                rows={3}
                value={premierObs}
                onChange={(e) => setPremierObs(e.target.value)}
                placeholder="Orientações aos jogadores, estrutura de premiação, regras de check-in..."
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {/* Linha 8: Webhook Google Sheets */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <span>📊 URL do Webhook do Google Sheets (Banco de Inscrições)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Apps Script Web App</span>
              </div>
              <input
                type="url"
                value={premierWebhook}
                onChange={(e) => setPremierWebhook(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400">
                As inscrições feitas pelo formulário do site serão salvas automaticamente na aba <code>Inscricoes</code> da sua planilha.
              </p>
            </div>

            {/* Link Direto Compartilhável */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  🔗 Link Direto para Divulgação (WhatsApp / Instagram)
                </div>
                <input
                  type="text"
                  readOnly
                  value={directLink}
                  className="w-full mt-1 bg-slate-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono select-all"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 self-end sm:self-center cursor-pointer shadow-md"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? "Link Copiado!" : "Copiar Link"}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-50"
              >
                {isSavingConfig ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>💾 Salvar Configurações do Premier</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Sub-navegação: Inscrições Ao Vivo vs Decklists Arquivadas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubtab("online")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subtab === "online"
                  ? "bg-amber-400 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              📥 Inscrições Recebidas Online (Ao Vivo)
            </button>
            <button
              type="button"
              onClick={() => setSubtab("archived")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subtab === "archived"
                  ? "bg-amber-400 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              📁 Decklists Arquivadas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncGoogleSheets}
              disabled={isUpdatingFromSheets}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingFromSheets ? "animate-spin" : ""}`} />
              <span>{isUpdatingFromSheets ? "Atualizando..." : "🔄 Atualizar Planilha"}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyToTOM}
              className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {copiedTom ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedTom ? "Copiado para o TOM!" : "📋 Copiar para o TOM"}</span>
            </button>
          </div>
        </div>

        {/* Filtros da Tabela */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por jogador, POP ID ou protocolo..."
              className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Todas as Categorias</option>
            <option value="Master">Master</option>
            <option value="Senior">Senior</option>
            <option value="Junior">Junior</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="">Todos os Status de Pagamento</option>
            <option value="Confirmado">Confirmado / Pago ✅</option>
            <option value="Pendente">Pendente ⏳</option>
          </select>
        </div>

        {/* Badges de Resumo */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10 font-bold">
            Total Inscritos: {filteredList.length}
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
            Pagamentos Confirmados: {confirmedCount}
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
            Pagamentos Pendentes: {pendingCount}
          </span>
        </div>

        {/* Tabela de Inscrições */}
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-white/5 rounded-xl bg-slate-950/40">
            <p className="text-sm font-semibold">Nenhuma inscrição encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">
              {!premierWebhook
                ? "Configure o Webhook do Google Sheets ou cadastre uma inscrição manual pelo botão acima."
                : "Aguardando novos envios no formulário do site."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase font-bold bg-slate-900/60">
                  <th className="py-3 px-3 w-24">Protocolo</th>
                  <th className="py-3 px-4">Treinador / POP ID</th>
                  <th className="py-3 px-3 text-center w-20">Categoria</th>
                  <th className="py-3 px-4">Baralho / Arquétipo</th>
                  <th className="py-3 px-3 text-center w-24">Lista</th>
                  <th className="py-3 px-3 text-center w-28">Status PIX</th>
                  <th className="py-3 px-3 text-right w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((item) => {
                  const isPaid = item.statusPix === "Confirmado";
                  const hasList = Boolean(item.decklistRaw);

                  return (
                    <tr key={item.id || item.protocolo} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {item.protocolo || `--`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{item.jogadorNome}</div>
                        {item.jogadorId && (
                          <div className="text-[11px] text-slate-400 font-mono">ID: {item.jogadorId}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/10 font-bold">
                          {item.categoria || "Master"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{item.deckNome || "Sem deck"}</span>
                          {item.tipoEnergia && <EnergyBadge energyRaw={item.tipoEnergia} />}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {hasList ? (
                          <button
                            type="button"
                            onClick={() => setViewingDecklist(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            <span>60 Cartas</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(item.id, item.statusPix)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border ${
                            isPaid
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                          }`}
                          title="Clique para alternar status do PIX"
                        >
                          {isPaid ? "Pago ✅" : "Pendente ⏳"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRegistration(item.id)}
                          className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                          title="Excluir Inscrição"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Visualização de Decklist (60 Cartas) */}
      {viewingDecklist && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Decklist de {viewingDecklist.jogadorNome}</h3>
                <p className="text-xs text-amber-300 font-semibold">{viewingDecklist.deckNome}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDecklist(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900/90 p-4 rounded-xl border border-white/10 text-slate-200 font-mono text-xs whitespace-pre-wrap select-all">
              {viewingDecklist.decklistRaw}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">
                Total: {viewingDecklist.totalCartas || 60} cartas
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingDecklist.decklistRaw);
                    alert("Lista copiada!");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Copiar Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDecklist(null)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro Manual de Inscrição */}
      {isNewRegistrationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/20 bg-slate-950 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                <span>Cadastrar / Importar Inscrição</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewRegistrationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRegistration} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Jogador</label>
                  <input
                    type="text"
                    required
                    value={manualForm.jogadorNome}
                    onChange={(e) => setManualForm({ ...manualForm, jogadorNome: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">POP ID (Opcional)</label>
                  <input
                    type="text"
                    value={manualForm.jogadorId}
                    onChange={(e) => setManualForm({ ...manualForm, jogadorId: e.target.value })}
                    placeholder="Ex: 1234567"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria</label>
                  <select
                    value={manualForm.categoria}
                    onChange={(e) => setManualForm({ ...manualForm, categoria: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Master">Master</option>
                    <option value="Senior">Senior</option>
                    <option value="Junior">Junior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status PIX</label>
                  <select
                    value={manualForm.statusPix}
                    onChange={(e) => setManualForm({ ...manualForm, statusPix: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Confirmado">Confirmado / Pago ✅</option>
                    <option value="Pendente">Pendente ⏳</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome do Deck / Arquétipo</label>
                  <input
                    type="text"
                    required
                    value={manualForm.deckNome}
                    onChange={(e) => setManualForm({ ...manualForm, deckNome: e.target.value })}
                    placeholder="Ex: Charizard ex"
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Energia</label>
                  <select
                    value={manualForm.tipoEnergia}
                    onChange={(e) => setManualForm({ ...manualForm, tipoEnergia: e.target.value })}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="fire">🔥 Fire</option>
                    <option value="water">💧 Water</option>
                    <option value="grass">🌿 Grass</option>
                    <option value="lightning">⚡ Lightning</option>
                    <option value="psychic">🔮 Psychic</option>
                    <option value="fighting">🥊 Fighting</option>
                    <option value="darkness">🌑 Darkness</option>
                    <option value="metal">⚙️ Metal</option>
                    <option value="dragon">🐉 Dragon</option>
                    <option value="colorless">⚪ Colorless</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decklist (60 Cartas em Texto - Opcional)</label>
                <textarea
                  rows={4}
                  value={manualForm.decklistRaw}
                  onChange={(e) => setManualForm({ ...manualForm, decklistRaw: e.target.value })}
                  placeholder="Cole a lista de cartas exportada do Pokémon TCG Live..."
                  className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewRegistrationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                >
                  Cadastrar Inscrição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
