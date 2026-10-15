"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Gamepad2,
  Users,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  CheckCircle2,
  Filter,
  Pencil,
  Trash2,
  X,
  Save,
  AlertCircle,
  Trophy,
  BookOpen,
  Globe,
  GraduationCap,
  Building,
} from "lucide-react";

interface FincInscricao {
  id: number;
  protocolo: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  tipoParticipante: string;
  ra: string | null;
  jogos: string;
  dias: string;
  intencao: string;
  possuiDeck: string;
  observacoes: string | null;
  status: string;
  createdAt: string;
}

const ALL_GAMES = [
  { id: "pokemon", name: "Pokémon TCG", color: "text-amber-400" },
  { id: "yugioh", name: "Yu-Gi-Oh! TCG", color: "text-purple-400" },
  { id: "onepiece", name: "One Piece Card Game", color: "text-rose-400" },
  { id: "digimon", name: "Digimon Card Game", color: "text-blue-400" },
  { id: "riftbound", name: "Riftbound TCG", color: "text-emerald-400" },
];

const ALL_TURNOS = [
  { id: "21_noite", label: "21/10 (Quarta) • Noite (17h-22h)" },
  { id: "22_tarde", label: "22/10 (Quinta) • Tarde (14h-18h)" },
  { id: "22_noite", label: "22/10 (Quinta) • Noite (18h-20h)" },
];

export function AdminFincManager() {
  const [inscricoes, setInscricoes] = useState<FincInscricao[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGameFilter, setSelectedGameFilter] = useState("todos");
  const [selectedDayFilter, setSelectedDayFilter] = useState("todos");
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado do Modal de Edição
  const [editingInscricao, setEditingInscricao] = useState<FincInscricao | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTipo, setEditTipo] = useState("externo");
  const [editRa, setEditRa] = useState("");
  const [editTorneio, setEditTorneio] = useState<string[]>([]);
  const [editOficina, setEditOficina] = useState<string[]>([]);
  const [editTurnos, setEditTurnos] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("confirmado");
  const [editObs, setEditObs] = useState("");

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const fetchInscricoes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/finc");
      if (res.ok) {
        const data = await res.json();
        setInscricoes(data.inscricoes || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Erro ao carregar inscricoes FINC:", err);
      showNotification("Erro ao carregar inscrições", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes();
  }, []);

  // Excluir inscrição
  const handleDelete = async (item: FincInscricao) => {
    const confirmDelete = window.confirm(
      `Deseja realmente EXCLUIR a inscrição de "${item.nome}" (${item.protocolo})?\n\nEsta ação é irreversível!`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/finc?id=${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao excluir inscrição");
      }

      setInscricoes((prev) => prev.filter((i) => i.id !== item.id));
      showNotification(`Inscrição de ${item.nome} (${item.protocolo}) excluída com sucesso!`, "success");
      fetchInscricoes();
    } catch (err: any) {
      showNotification(err.message || "Erro ao excluir inscrição", "error");
    }
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (item: FincInscricao) => {
    setEditingInscricao(item);
    setEditNome(item.nome || "");
    setEditWhatsapp(item.whatsapp || "");
    setEditEmail(item.email || "");
    setEditTipo(item.tipoParticipante || "externo");
    setEditRa(item.ra || "");
    setEditStatus(item.status || "confirmado");
    setEditObs(item.observacoes || "");

    let tGames: string[] = [];
    let oGames: string[] = [];
    try {
      const parsed = JSON.parse(item.jogos || "{}");
      if (Array.isArray(parsed)) {
        tGames = parsed;
      } else if (parsed && typeof parsed === "object") {
        tGames = parsed.torneio || [];
        oGames = parsed.oficinas || [];
      }
    } catch {
      tGames = [item.jogos];
    }
    setEditTorneio(tGames);
    setEditOficina(oGames);

    let dDays: string[] = [];
    try {
      dDays = JSON.parse(item.dias || "[]");
    } catch {
      dDays = [item.dias];
    }
    setEditTurnos(dDays);

    setIsEditModalOpen(true);
  };

  const handleToggleEditTorneio = (gameId: string) => {
    if (editTorneio.includes(gameId)) {
      setEditTorneio((prev) => prev.filter((g) => g !== gameId));
    } else {
      if (editTorneio.length >= 3) {
        alert("Máximo de 3 opções para Torneios.");
        return;
      }
      setEditTorneio((prev) => [...prev, gameId]);
    }
  };

  const handleToggleEditOficina = (gameId: string) => {
    if (editOficina.includes(gameId)) {
      setEditOficina((prev) => prev.filter((g) => g !== gameId));
    } else {
      if (editOficina.length >= 3) {
        alert("Máximo de 3 opções para Oficinas.");
        return;
      }
      setEditOficina((prev) => [...prev, gameId]);
    }
  };

  const handleToggleEditTurno = (turnoId: string) => {
    setEditTurnos((prev) =>
      prev.includes(turnoId) ? prev.filter((t) => t !== turnoId) : [...prev, turnoId]
    );
  };

  // Salvar Edição
  const handleSaveEdit = async () => {
    if (!editingInscricao) return;

    if (!editNome.trim() || editNome.trim().length < 3) {
      alert("Por favor, informe o nome completo do jogador.");
      return;
    }

    const cleanPhone = editWhatsapp.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    if ((editTipo === "unef" || editTipo === "unifan") && !editRa.trim()) {
      alert(`Para participante da ${editTipo.toUpperCase()}, é obrigatório informar o RA / Matrícula.`);
      return;
    }

    if (editTorneio.length === 0 && editOficina.length === 0) {
      alert("Selecione ao menos uma opção de Torneio ou Oficina.");
      return;
    }

    if (editTurnos.length === 0) {
      alert("Selecione ao menos um turno de presença.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/finc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInscricao.id,
          nome: editNome.trim(),
          whatsapp: cleanPhone,
          email: editEmail.trim(),
          tipoParticipante: editTipo,
          ra: editRa ? editRa.trim() : null,
          jogosTorneio: editTorneio,
          jogosOficina: editOficina,
          dias: editTurnos,
          status: editStatus,
          observacoes: editObs.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar alterações");
      }

      showNotification(`Inscrição de ${editNome} atualizada com sucesso!`, "success");
      setIsEditModalOpen(false);
      setEditingInscricao(null);
      fetchInscricoes();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar alterações");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredList = useMemo(() => {
    return inscricoes.filter((item) => {
      // Busca texto
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        item.nome.toLowerCase().includes(q) ||
        item.whatsapp.includes(q) ||
        item.protocolo.toLowerCase().includes(q) ||
        (item.ra && item.ra.toLowerCase().includes(q));

      if (!matchText) return false;

      // Filtro de jogo
      if (selectedGameFilter !== "todos") {
        try {
          const parsed = JSON.parse(item.jogos || "{}");
          const all = Array.isArray(parsed)
            ? parsed
            : [...(parsed.torneio || []), ...(parsed.oficinas || []), ...(parsed.lista || [])];
          if (!all.some((j: string) => j.toLowerCase().includes(selectedGameFilter))) {
            return false;
          }
        } catch {
          if (!item.jogos.toLowerCase().includes(selectedGameFilter)) return false;
        }
      }

      // Filtro de dia / turno
      if (selectedDayFilter !== "todos") {
        try {
          const dias: string[] = JSON.parse(item.dias || "[]");
          if (selectedDayFilter === "21") {
            if (!dias.some((d) => String(d).includes("21"))) return false;
          } else if (selectedDayFilter === "22") {
            if (!dias.some((d) => String(d).includes("22"))) return false;
          } else if (selectedDayFilter === "ambos") {
            const has21 = dias.some((d) => String(d).includes("21"));
            const has22 = dias.some((d) => String(d).includes("22"));
            if (!has21 || !has22) return false;
          } else {
            if (!dias.includes(selectedDayFilter)) return false;
          }
        } catch {
          if (!item.dias.includes(selectedDayFilter)) return false;
        }
      }

      return true;
    });
  }, [inscricoes, search, selectedGameFilter, selectedDayFilter]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedProtocol(text);
    setTimeout(() => setCopiedProtocol(null), 2500);
  };

  const getDirectWhatsAppLink = (phone: string, name: string, protocolo: string) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.startsWith("55") ? clean : `55${clean}`;
    const text = encodeURIComponent(
      `Olá ${name}! Aqui é da organização da Atlântica Mais / Arena Geek da FINC 2026. Recebemos sua inscrição (Protocolo: ${protocolo}). Estamos preparando as mesas e aguardamos você no Cajueiro Convenções!`
    );
    return `https://wa.me/${formatted}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-cyan-300">
            <Gamepad2 className="h-3.5 w-3.5" />
            FINC 2026 • Gestão Atlântica Mais
          </div>
          <h2 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            Inscrições Arena Geek • Espaço TCG
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Gerencie, edite ou exclua participantes, dimensione mesas e acompanhe o quórum por dia e turno.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/finc"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-all cursor-pointer"
          >
            <span>Ver Formulário Público</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={fetchInscricoes}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE STATUS / SUCESSO */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/60 border-rose-500/50 text-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* MÉTRICAS RÁPIDAS & QUÓRUM EXECUTIVO */}
      {stats && (
        <div className="space-y-4">
          {/* 1. SEÇÃO POR CARD GAME */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gamepad2 className="h-4 w-4 text-cyan-400" />
                Interesse por Card Game (Torneios & Oficinas)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                Clique no card para filtrar a tabela
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total Geral */}
              <div
                onClick={() => setSelectedGameFilter("todos")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "todos"
                    ? "border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50 shadow-lg"
                    : "border-white/10 bg-slate-900/60 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Inscritos</span>
                  <Users className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.total}</div>
                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 flex-wrap">
                  <span>
                    🏆 {stats.torneios ? Number(Object.values(stats.torneios).reduce((a: any, b: any) => a + Number(b || 0), 0)) : 0} vagas
                  </span>
                  <span>•</span>
                  <span>
                    📚 {stats.oficinas ? Number(Object.values(stats.oficinas).reduce((a: any, b: any) => a + Number(b || 0), 0)) : 0} ofic.
                  </span>
                </div>
              </div>

              {/* Pokémon */}
              <div
                onClick={() => setSelectedGameFilter(selectedGameFilter === "pokemon" ? "todos" : "pokemon")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "pokemon"
                    ? "border-amber-400 bg-amber-950/60 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10"
                    : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">Pokémon</span>
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.jogos?.pokemon || 0}</div>
                <div className="text-[10px] text-amber-300/80 font-medium flex items-center gap-1 flex-wrap">
                  <span>🏆 {stats.torneios?.pokemon || 0} Torneio</span>
                  <span>•</span>
                  <span>📚 {stats.oficinas?.pokemon || 0} Ofic.</span>
                </div>
              </div>

              {/* One Piece */}
              <div
                onClick={() => setSelectedGameFilter(selectedGameFilter === "onepiece" ? "todos" : "onepiece")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "onepiece"
                    ? "border-rose-400 bg-rose-950/60 ring-1 ring-rose-400/50 shadow-lg shadow-rose-500/10"
                    : "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400 uppercase">One Piece</span>
                  <Trophy className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.jogos?.onepiece || 0}</div>
                <div className="text-[10px] text-rose-300/80 font-medium flex items-center gap-1 flex-wrap">
                  <span>🏆 {stats.torneios?.onepiece || 0} Torneio</span>
                  <span>•</span>
                  <span>📚 {stats.oficinas?.onepiece || 0} Ofic.</span>
                </div>
              </div>

              {/* Yu-Gi-Oh! */}
              <div
                onClick={() => setSelectedGameFilter(selectedGameFilter === "yugioh" ? "todos" : "yugioh")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "yugioh"
                    ? "border-purple-400 bg-purple-950/60 ring-1 ring-purple-400/50 shadow-lg shadow-purple-500/10"
                    : "border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-400 uppercase">Yu-Gi-Oh!</span>
                  <Trophy className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.jogos?.yugioh || 0}</div>
                <div className="text-[10px] text-purple-300/80 font-medium flex items-center gap-1 flex-wrap">
                  <span>🏆 {stats.torneios?.yugioh || 0} Torneio</span>
                  <span>•</span>
                  <span>📚 {stats.oficinas?.yugioh || 0} Ofic.</span>
                </div>
              </div>

              {/* Digimon */}
              <div
                onClick={() => setSelectedGameFilter(selectedGameFilter === "digimon" ? "todos" : "digimon")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "digimon"
                    ? "border-blue-400 bg-blue-950/60 ring-1 ring-blue-400/50 shadow-lg shadow-blue-500/10"
                    : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-400 uppercase">Digimon</span>
                  <Trophy className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.jogos?.digimon || 0}</div>
                <div className="text-[10px] text-blue-300/80 font-medium flex items-center gap-1 flex-wrap">
                  <span>🏆 {stats.torneios?.digimon || 0} Torneio</span>
                  <span>•</span>
                  <span>📚 {stats.oficinas?.digimon || 0} Ofic.</span>
                </div>
              </div>

              {/* Riftbound */}
              <div
                onClick={() => setSelectedGameFilter(selectedGameFilter === "riftbound" ? "todos" : "riftbound")}
                className={`rounded-2xl border p-4 space-y-1.5 cursor-pointer transition-all ${
                  selectedGameFilter === "riftbound"
                    ? "border-emerald-400 bg-emerald-950/60 ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
                    : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Riftbound</span>
                  <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats.jogos?.riftbound || 0}</div>
                <div className="text-[10px] text-emerald-300/80 font-medium flex items-center gap-1 flex-wrap">
                  <span>🏆 {stats.torneios?.riftbound || 0} Torneio</span>
                  <span>•</span>
                  <span>📚 {stats.oficinas?.riftbound || 0} Ofic.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO POR TURNO DE PRESENÇA (HORÁRIOS & DIAS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-fuchsia-400" />
                Quórum de Presença por Turno & Dia
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                Dimensionamento de mesas por período
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Turno 1: 21 Noite */}
              <div
                onClick={() => setSelectedDayFilter(selectedDayFilter === "21_noite" ? "todos" : "21_noite")}
                className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
                  selectedDayFilter === "21_noite"
                    ? "border-cyan-400 bg-cyan-950/60 ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-500/10"
                    : "border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-slate-900/40 hover:border-cyan-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase">Quarta 21 • Noite</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    17h às 22h
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-white">{stats.dia21_noite || 0}</div>
                  <span className="text-xs text-slate-400">jogadores</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? Math.min(100, Math.round(((stats.dia21_noite || 0) / stats.total) * 100)) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{stats.total > 0 ? Math.round(((stats.dia21_noite || 0) / stats.total) * 100) : 0}% do total</span>
                  <span className="text-cyan-300 font-semibold">Início dos torneios</span>
                </div>
              </div>

              {/* Turno 2: 22 Tarde */}
              <div
                onClick={() => setSelectedDayFilter(selectedDayFilter === "22_tarde" ? "todos" : "22_tarde")}
                className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
                  selectedDayFilter === "22_tarde"
                    ? "border-fuchsia-400 bg-fuchsia-950/60 ring-1 ring-fuchsia-400/50 shadow-lg shadow-fuchsia-500/10"
                    : "border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/30 via-slate-900/60 to-slate-900/40 hover:border-fuchsia-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-300 uppercase">Quinta 22 • Tarde</span>
                  <span className="text-[10px] font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                    14h às 18h
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-white">{stats.dia22_tarde || 0}</div>
                  <span className="text-xs text-slate-400">jogadores</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-fuchsia-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? Math.min(100, Math.round(((stats.dia22_tarde || 0) / stats.total) * 100)) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{stats.total > 0 ? Math.round(((stats.dia22_tarde || 0) / stats.total) * 100) : 0}% do total</span>
                  <span className="text-fuchsia-300 font-semibold">Oficinas e Suíço</span>
                </div>
              </div>

              {/* Turno 3: 22 Noite */}
              <div
                onClick={() => setSelectedDayFilter(selectedDayFilter === "22_noite" ? "todos" : "22_noite")}
                className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
                  selectedDayFilter === "22_noite"
                    ? "border-amber-400 bg-amber-950/60 ring-1 ring-amber-400/50 shadow-lg shadow-amber-500/10"
                    : "border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-900/40 hover:border-amber-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase">Quinta 22 • Noite</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    18h às 20h
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-white">{stats.dia22_noite || 0}</div>
                  <span className="text-xs text-slate-400">jogadores</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? Math.min(100, Math.round(((stats.dia22_noite || 0) / stats.total) * 100)) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{stats.total > 0 ? Math.round(((stats.dia22_noite || 0) / stats.total) * 100) : 0}% do total</span>
                  <span className="text-amber-300 font-semibold">Finais & Premiações</span>
                </div>
              </div>

              {/* Ambos os Dias */}
              <div
                onClick={() => setSelectedDayFilter(selectedDayFilter === "ambos" ? "todos" : "ambos")}
                className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-all ${
                  selectedDayFilter === "ambos"
                    ? "border-emerald-400 bg-emerald-950/60 ring-1 ring-emerald-400/50 shadow-lg shadow-emerald-500/10"
                    : "border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/40 hover:border-emerald-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase">Ambos os Dias (21 & 22)</span>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-white">{stats.ambosDias || 0}</div>
                  <span className="text-xs text-slate-400">jogadores</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? Math.min(100, Math.round(((stats.ambosDias || 0) / stats.total) * 100)) : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>{stats.total > 0 ? Math.round(((stats.ambosDias || 0) / stats.total) * 100) : 0}% nos dois dias</span>
                  <span className="text-emerald-300 font-semibold">{stats.todosTurnos || 0} em todos os turnos</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RESUMO DE PÚBLICO E EQUIPAMENTO */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Público:</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 text-cyan-300 font-semibold">
                <Globe className="h-3 w-3" /> {stats.publico?.externo || 0} Externos
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 text-blue-300 font-semibold">
                <GraduationCap className="h-3 w-3" /> {stats.publico?.unef || 0} UNEF
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 text-purple-300 font-semibold">
                <GraduationCap className="h-3 w-3" /> {stats.publico?.unifan || 0} UNIFAN
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-white/10 px-2 py-0.5 text-slate-300 font-semibold">
                <Building className="h-3 w-3" /> {stats.publico?.outra || 0} Outras
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Decks:</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-emerald-300 font-semibold">
                🃏 {stats.possuiDeck || 0} Com Deck Próprio
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 text-amber-300 font-semibold">
                📚 {stats.precisaDeck || 0} Usarão Oficina
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS E BUSCA */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome, WhatsApp ou protocolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <select
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="todos">Todos os Card Games</option>
              <option value="pokemon">Pokémon TCG</option>
              <option value="yugioh">Yu-Gi-Oh!</option>
              <option value="onepiece">One Piece</option>
              <option value="digimon">Digimon</option>
              <option value="riftbound">Riftbound</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="todos">Todos os Turnos / Dias</option>
              <option value="ambos">Ambos os Dias (21 e 22)</option>
              <option value="21">Dia 21 de Outubro (Qualquer turno)</option>
              <option value="21_noite">Quarta 21 • Noite (17h-22h)</option>
              <option value="22">Dia 22 de Outubro (Qualquer turno)</option>
              <option value="22_tarde">Quinta 22 • Tarde (14h-18h)</option>
              <option value="22_noite">Quinta 22 • Noite (18h-20h)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE INSCRITOS */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Inscritos Homologados ({filteredList.length})</span>
          </h3>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-2">
            <Gamepad2 className="h-10 w-10 mx-auto opacity-30 text-cyan-400" />
            <p className="text-xs">Nenhuma inscrição encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-white/10 bg-slate-950/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Protocolo</th>
                  <th className="py-3 px-4">Jogador</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">TCGs Pretendidos</th>
                  <th className="py-3 px-4">Presença</th>
                  <th className="py-3 px-4">Deck</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredList.map((item) => {
                  let parsedGames: string[] = [];
                  let torneioGames: string[] = [];
                  let oficinaGames: string[] = [];
                  let parsedDays: string[] = [];
                  try {
                    const parsed = JSON.parse(item.jogos);
                    if (Array.isArray(parsed)) {
                      parsedGames = parsed;
                    } else if (parsed && typeof parsed === "object") {
                      torneioGames = parsed.torneio || [];
                      oficinaGames = parsed.oficinas || [];
                      parsedGames = parsed.lista || [...torneioGames, ...oficinaGames];
                    }
                  } catch {
                    parsedGames = [item.jogos];
                  }
                  try {
                    parsedDays = JSON.parse(item.dias);
                  } catch {
                    parsedDays = [item.dias];
                  }

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {item.protocolo}
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        <div>{item.nome}</div>
                        <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>
                            {item.tipoParticipante === "externo"
                              ? "Público Externo"
                              : item.tipoParticipante === "unef"
                              ? "Aluno UNEF"
                              : item.tipoParticipante === "unifan"
                              ? "Aluno UNIFAN"
                              : "Outra Instituição"}
                          </span>
                          {item.ra && (
                            <span className="font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              RA: {item.ra}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {item.whatsapp}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5">
                          {torneioGames.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                🏆 Torneio
                              </span>
                              {torneioGames.map((g, idx) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-500/30 bg-amber-950/40 text-amber-300 uppercase"
                                >
                                  {idx + 1}º {g}
                                </span>
                              ))}
                            </div>
                          )}
                          {oficinaGames.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                📚 Oficina
                              </span>
                              {oficinaGames.map((g, idx) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 uppercase"
                                >
                                  {idx + 1}º {g}
                                </span>
                              ))}
                            </div>
                          )}
                          {torneioGames.length === 0 && oficinaGames.length === 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsedGames.map((g) => (
                                <span
                                  key={g}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 bg-slate-800 text-slate-200 uppercase"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-300">
                        <div className="flex flex-col gap-1">
                          {parsedDays.map((d) => {
                            if (d === "21_noite" || d === "21") {
                              return (
                                <span key={d} className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                  21/10 • Noite (17h-22h)
                                </span>
                              );
                            }
                            if (d === "22_tarde") {
                              return (
                                <span key={d} className="inline-flex items-center gap-1 text-[11px] font-semibold text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-800/40 px-2 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                                  22/10 • Tarde (14h-18h)
                                </span>
                              );
                            }
                            if (d === "22_noite") {
                              return (
                                <span key={d} className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  22/10 • Noite (18h-20h)
                                </span>
                              );
                            }
                            return (
                              <span key={d} className="text-xs text-slate-300">
                                {d}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        {item.possuiDeck === "sim" ? (
                          <span className="text-emerald-400 font-bold">Deck Próprio</span>
                        ) : (
                          <span className="text-cyan-400">Usa da Oficina</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === "cancelado"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {item.status || "confirmado"}
                        </span>
                      </td>

                      {/* AÇÕES: COPIAR, WHATSAPP, EDITAR, EXCLUIR */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* COPIAR PROTOCOLO */}
                          <button
                            onClick={() => handleCopy(item.protocolo)}
                            title="Copiar Protocolo"
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                          >
                            {copiedProtocol === item.protocolo ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* WHATSAPP */}
                          <a
                            href={getDirectWhatsAppLink(item.whatsapp, item.nome, item.protocolo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 cursor-pointer transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>

                          {/* EDITAR */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Editar Inscrição"
                            className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 cursor-pointer transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* EXCLUIR */}
                          <button
                            onClick={() => handleDelete(item)}
                            title="Excluir Inscrição"
                            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* MODAL DE EDIÇÃO DE INSCRIÇÃO */}
      {isEditModalOpen && editingInscricao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl space-y-6 text-left">
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  Editar Participante • FINC 2026
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {editNome || "Inscrição"}
                </h3>
                <span className="text-xs font-mono text-cyan-300">
                  Protocolo: {editingInscricao.protocolo}
                </span>
              </div>

              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CAMPOS DO FORMULÁRIO */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Nome Completo *</label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">WhatsApp (com DDD) *</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Vínculo / Tipo de Participante</label>
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="externo">Público Externo / Comunidade</option>
                    <option value="unef">Aluno(a) ou Egresso(a) UNEF</option>
                    <option value="unifan">Aluno(a) ou Egresso(a) UNIFAN</option>
                    <option value="outra">Estudante de Outra Instituição</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Status da Inscrição</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">E-mail (opcional)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>
                      RA / Matrícula {editTipo === "unef" || editTipo === "unifan" ? `(${editTipo.toUpperCase()} *)` : "(Opcional)"}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editRa}
                    onChange={(e) => setEditRa(e.target.value)}
                    placeholder="Ex: 202410123"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* SELEÇÃO DE TORNEIOS (COM PRIORIDADE) */}
              <div className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" />
                    Torneios Competitivos (Até 3 Opções por clique)
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    {editTorneio.length}/3 selecionados
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_GAMES.map((g) => {
                    const idx = editTorneio.indexOf(g.id);
                    const isSelected = idx !== -1;
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleToggleEditTorneio(g.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-amber-400 bg-amber-950/60 text-white font-bold"
                            : "border-white/10 bg-slate-950/60 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        <span className="text-xs">{g.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                            {idx + 1}º
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELEÇÃO DE OFICINAS (COM PRIORIDADE) */}
              <div className="space-y-2 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Oficinas Didáticas (Até 3 Opções por clique)
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-mono">
                    {editOficina.length}/3 selecionadas
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_GAMES.map((g) => {
                    const idx = editOficina.indexOf(g.id);
                    const isSelected = idx !== -1;
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleToggleEditOficina(g.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/60 text-white font-bold"
                            : "border-white/10 bg-slate-950/60 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        <span className="text-xs">{g.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-black bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded-full">
                            {idx + 1}º
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TURNOS DE PRESENÇA */}
              <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Turnos Autorizados
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ALL_TURNOS.map((t) => {
                    const isSelected = editTurnos.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleToggleEditTurno(t.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-cyan-400 bg-cyan-950/60 text-white font-bold"
                            : "border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-[11px] leading-tight">{t.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OBSERVAÇÕES */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Observações Internas</label>
                <textarea
                  rows={2}
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  placeholder="Informações adicionais da organização..."
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-white focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO MODAL */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-black text-white shadow-lg shadow-cyan-600/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
