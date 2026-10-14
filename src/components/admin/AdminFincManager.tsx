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
} from "lucide-react";

interface FincInscricao {
  id: number;
  protocolo: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  tipoParticipante: string;
  jogos: string;
  dias: string;
  intencao: string;
  possuiDeck: string;
  observacoes: string | null;
  status: string;
  createdAt: string;
}

export function AdminFincManager() {
  const [inscricoes, setInscricoes] = useState<FincInscricao[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGameFilter, setSelectedGameFilter] = useState("todos");
  const [selectedDayFilter, setSelectedDayFilter] = useState("todos");
  const [copiedProtocol, setCopiedProtocol] = useState<string | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes();
  }, []);

  const filteredList = useMemo(() => {
    return inscricoes.filter((item) => {
      // Busca texto
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        item.nome.toLowerCase().includes(q) ||
        item.whatsapp.includes(q) ||
        item.protocolo.toLowerCase().includes(q);

      if (!matchText) return false;

      // Filtro de jogo
      if (selectedGameFilter !== "todos") {
        try {
          const jogos: string[] = JSON.parse(item.jogos || "[]");
          if (!jogos.some((j) => j.toLowerCase().includes(selectedGameFilter))) {
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
            if (!dias.some((d) => d.includes("21"))) return false;
          } else if (selectedDayFilter === "22") {
            if (!dias.some((d) => d.includes("22"))) return false;
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
            Controle de participantes por jogo e dimensionamento de mesas para os dias 21 (17h-22h) e 22 (14h-20h).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/finc"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-all cursor-pointer"
          >
            <span>Ver Página Pública</span>
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

      {/* MÉTRICAS RÁPIDAS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Inscritos</span>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <span className="text-[10px] text-slate-500">Geral acumulado</span>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase">Pokémon</span>
            <div className="text-2xl font-black text-white">{stats.jogos.pokemon}</div>
            <span className="text-[10px] text-amber-400/70">Standard & Oficinas</span>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-purple-400 uppercase">Yu-Gi-Oh!</span>
            <div className="text-2xl font-black text-white">{stats.jogos.yugioh}</div>
            <span className="text-[10px] text-purple-400/70">Avançado & Casual</span>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-rose-400 uppercase">One Piece</span>
            <div className="text-2xl font-black text-white">{stats.jogos.onepiece}</div>
            <span className="text-[10px] text-rose-400/70">Oficial Bandai</span>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-blue-400 uppercase">Digimon</span>
            <div className="text-2xl font-black text-white">{stats.jogos.digimon}</div>
            <span className="text-[10px] text-blue-400/70">Oficial Bandai</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase">Riftbound</span>
            <div className="text-2xl font-black text-white">{stats.jogos.riftbound}</div>
            <span className="text-[10px] text-emerald-400/70">LoL TCG</span>
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
                  <th className="py-3 px-4">Objetivo</th>
                  <th className="py-3 px-4">Deck</th>
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
                        <div className="text-[10px] text-slate-400 font-normal">
                          {item.tipoParticipante === "externo"
                            ? "Público Externo"
                            : item.tipoParticipante.toUpperCase()}
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

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.intencao === "torneio"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : item.intencao === "casual"
                              ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                              : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {item.intencao === "torneio"
                            ? "Torneio"
                            : item.intencao === "casual"
                            ? "Casual"
                            : "Aprender"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[11px]">
                        {item.possuiDeck === "sim" ? (
                          <span className="text-emerald-400">Tem deck</span>
                        ) : (
                          <span className="text-amber-400 font-bold">Precisa de deck</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(item.protocolo)}
                            title="Copiar Protocolo"
                            className="p-1.5 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            {copiedProtocol === item.protocolo ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <a
                            href={getDirectWhatsAppLink(item.whatsapp, item.nome, item.protocolo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                            className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
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
    </div>
  );
}
