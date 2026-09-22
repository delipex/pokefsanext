"use client";

import { useState } from "react";
import { Trophy, Award, Camera, History, Sparkles, ExternalLink, Calendar, X, ChevronRight } from "lucide-react";

export interface ChampionItem {
  id: number;
  temporada: string;
  campeao: string;
  vice: string;
  deckCampeao: string;
  data: string;
  fotoCampeao: string | null;
  urlDeck: string | null;
  imagemDeck: string | null;
  observacaoDeck: string | null;
}

export interface GalleryItem {
  id: number;
  titulo: string;
  descricao: string | null;
  urlImagem: string;
  data: string | null;
}

export interface LegacyScoreItem {
  id: number;
  temporada: string;
  dataFechamento: string | null;
  pos: number;
  jogador: string;
  categoria: string | null;
  pontos: string | null;
  deck: string | null;
}

interface ChampionsClientProps {
  champions: ChampionItem[];
  gallery: GalleryItem[];
  legacyScores: LegacyScoreItem[];
}

export function ChampionsClient({ champions, gallery, legacyScores }: ChampionsClientProps) {
  const [activeTab, setActiveTab] = useState<"campeoes" | "galeria" | "historico">("campeoes");
  const [selectedSeason, setSelectedSeason] = useState<string>("Temporada #4");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Temporadas disponíveis nos scores antigos
  const legacySeasons = Array.from(new Set(legacyScores.map((s) => s.temporada)));

  // Scores da temporada selecionada
  const filteredScores = legacyScores.filter((s) => s.temporada === selectedSeason);

  return (
    <div className="space-y-8">
      {/* Abas Superiores */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("campeoes")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "campeoes"
              ? "bg-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Hall dos Campeões
        </button>

        <button
          onClick={() => setActiveTab("galeria")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "galeria"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Camera className="h-4 w-4" />
          Galeria de Fotos
        </button>

        <button
          onClick={() => setActiveTab("historico")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeTab === "historico"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          Scores das Temporadas Anteriores
        </button>
      </div>

      {/* 1. SEÇÃO: HALL DOS CAMPEÕES */}
      {activeTab === "campeoes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {champions.map((c) => (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-slate-900/80 to-slate-950 p-6 backdrop-blur-xl shadow-2xl space-y-5"
            >
              {/* Badge da Temporada */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-300 border border-yellow-500/30">
                  <Trophy className="h-3.5 w-3.5" />
                  {c.temporada}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {c.data}
                </span>
              </div>

              {/* Campeão & Vice */}
              <div className="flex items-start gap-4">
                {c.fotoCampeao ? (
                  <img
                    src={c.fotoCampeao}
                    alt={c.campeao}
                    className="h-20 w-20 rounded-2xl object-contain bg-slate-950/60 p-2 border border-yellow-500/30 shadow-lg"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/20 text-3xl font-black text-yellow-400">
                    👑
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-yellow-400">
                    Campeão da Liga
                  </span>
                  <h3 className="text-2xl font-black text-white">{c.campeao}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Vice-campeão: <strong className="text-slate-200">{c.vice}</strong>
                  </p>
                </div>
              </div>

              {/* Deck Campeão */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Deck Vencedor:
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-black text-white border border-white/10">
                    {c.deckCampeao}
                  </span>
                </div>

                {c.imagemDeck && (
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                    <img
                      src={c.imagemDeck}
                      alt={c.deckCampeao}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                )}

                {c.observacaoDeck && (
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    "{c.observacaoDeck}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SEÇÃO: GALERIA DE FOTOS */}
      {activeTab === "galeria" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {gallery.map((g) => (
            <div
              key={g.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl shadow-xl space-y-3 transition-all hover:border-blue-500/40"
            >
              <div
                onClick={() => setLightboxImage(g.urlImagem)}
                className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-950/80 cursor-pointer flex items-center justify-center group-hover:opacity-90 transition-opacity"
              >
                <img
                  src={g.urlImagem}
                  alt={g.titulo}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div>
                <h4 className="text-sm font-black text-white line-clamp-1">{g.titulo}</h4>
                {g.descricao && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{g.descricao}</p>}
                {g.data && (
                  <span className="mt-2 block text-[11px] font-mono text-slate-500">
                    Data: {g.data}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. SEÇÃO: SCORES ANTIGOS */}
      {activeTab === "historico" && (
        <div className="space-y-4">
          {/* Seletor de Temporadas Legadas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {legacySeasons.map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                  selectedSeason === season
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5"
                }`}
              >
                {season}
              </button>
            ))}
          </div>

          {/* Tabela de Scores Antigos */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-xl">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="border-b border-white/10 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 pl-4 pr-2 text-center w-12">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-3 py-3 text-center">Categoria</th>
                  <th className="px-4 py-3 text-right font-bold text-yellow-400">Pontos</th>
                  <th className="px-4 py-3">Deck Utilizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredScores.map((score, sIdx) => {
                  const isChampion = score.pos === 1;

                  return (
                    <tr
                      key={sIdx}
                      className={`hover:bg-purple-600/10 transition-colors ${
                        isChampion ? "bg-yellow-500/10 font-bold" : ""
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 text-center">
                        {isChampion ? (
                          <span className="text-sm">🥇</span>
                        ) : score.pos === 2 ? (
                          <span className="text-sm">🥈</span>
                        ) : score.pos === 3 ? (
                          <span className="text-sm">🥉</span>
                        ) : (
                          <span className="font-mono text-slate-400">{score.pos}º</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{score.jogador}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {score.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-sm text-yellow-400">
                        {score.pontos || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{score.deck || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox Modal para Galeria */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img src={lightboxImage} alt="Foto ampliada" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
