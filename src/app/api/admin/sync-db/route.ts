import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  jogadores,
  decks,
  etapas,
  rankingConsolidado,
  configuracoes,
  campeoes,
  galeria,
  scoresAntigos,
  calendario,
} from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import { clearFileCache } from "@/lib/queries";
import defaultJogadores from "@/data/jogadores.json";
import defaultDecks from "@/data/decks.json";
import defaultCalendario from "@/data/calendario.json";
import defaultCampeoes from "@/data/campeoes.json";
import defaultScoresAntigos from "@/data/scores_antigos.json";
import defaultConfig from "@/data/config.json";
import defaultGaleria from "@/data/galeria.json";
import defaultEtapas from "@/data/etapas.json";

export async function POST() {
  try {
    console.log("⚡ Sincronizando banco de dados...");
    await ensureDatabaseSchema();

    // 1. Configurações
    await db.delete(configuracoes);
    const configs: Record<string, any> = (defaultConfig as Record<string, any>) || {};
    for (const [chave, valor] of Object.entries(configs)) {
      await db.insert(configuracoes).values({
        chave,
        valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
      });
    }

    // 2. Decks
    await db.delete(decks);
    const rawDecks = (defaultDecks as any[]) || [];
    const seenDecks = new Set<string>();
    for (const d of rawDecks) {
      const dNome = (d.deck || d.nome || "").trim();
      if (!dNome || seenDecks.has(dNome.toLowerCase())) continue;
      seenDecks.add(dNome.toLowerCase());
      await db.insert(decks).values({
        nome: dNome,
        tipoEnergia: d.tipoEnergia || "colorless",
        imagem: d.imagem || null,
        limitless: d.limitless || null,
        icone: d.icone || null,
        ativo: true,
      });
    }

    // 3. Jogadores (com leitura segura de jogador/Jogador/nome e auto-ID)
    await db.delete(jogadores);
    const rawJogadores = (defaultJogadores as any[]) || [];
    const seenPlayerIds = new Set<string>();
    for (let i = 0; i < rawJogadores.length; i++) {
      const j = rawJogadores[i];
      const nome = String(j.jogador || j.Jogador || j.nome || "").trim();
      if (!nome) continue;
      const rawId = String(j.id || j.ID || "").trim();
      const id = rawId || `sem-id-${i + 1}`;
      if (seenPlayerIds.has(id)) continue;
      seenPlayerIds.add(id);
      const cat = ["Master", "Senior", "Junior"].includes(j.categoria || j.Categoria)
        ? (j.categoria || j.Categoria)
        : "Master";

      await db.insert(jogadores).values({
        id,
        nome,
        categoria: cat,
        whatsapp: j.whatsapp ? String(j.whatsapp).trim() : null,
        dataNascimento: j.dataNascimento ? String(j.dataNascimento).trim() : null,
        cidade: j.cidade ? String(j.cidade).trim() : "Feira de Santana - BA",
        pinHash: j.pinHash || null,
        status: "ativo",
        ativo: true,
      });
    }

    // 4. Campeões (limpa antes para impedir duplicação a cada clique)
    await db.delete(campeoes);
    const rawCampeoes = (defaultCampeoes as any[]) || [];
    for (const c of rawCampeoes) {
      const seasonLabel = String(c.Temporada || c.temporada || "1").trim();
      await db
        .insert(campeoes)
        .values({
          temporada: seasonLabel,
          campeao: c.Campeao || c.campeao || c.nome || "Desconhecido",
          vice: c.Vice || c.vice || "Desconhecido",
          deckCampeao: c.DeckCampeao || c.deckCampeao || c.deck || "Desconhecido",
          data: c.Data || c.data || "2026-01-01",
          fotoCampeao: c.FotoCampeao || c.fotoCampeao || c.foto || null,
          urlDeck: c.URLDeck || c.urlDeck || null,
          imagemDeck: c.ImagemDeck || c.imagemDeck || null,
          observacaoDeck: c.ObservacaoDeck || c.observacaoDeck || null,
        });
    }

    // Galeria de Fotos
    await db.delete(galeria);
    const rawGaleria = (defaultGaleria as any[]) || [];
    for (const g of rawGaleria) {
      if (!g.urlImagem) continue;
      await db.insert(galeria).values({
        titulo: g.titulo || "Foto do Evento",
        descricao: g.descricao || null,
        urlImagem: g.urlImagem,
        data: g.data || null,
      });
    }

    // 5. Calendário
    await db.delete(calendario);
    const rawCal = (defaultCalendario as any[]) || [];
    for (const cal of rawCal) {
      await db
        .insert(calendario)
        .values({
          data: cal.data,
          evento: cal.evento || cal.titulo || "Torneio Semanal",
          local: cal.local || "Livraria Atlântica +",
          horario: cal.horario || "14:00",
          status: cal.status || "confirmado",
          descricao: cal.descricao || null,
          linkMaps: cal.linkMaps || cal.linkMapa || null,
          linkInscricao: cal.linkInscricao || null,
        });
    }

    // 6. Scores Antigos
    const rawScores = (defaultScoresAntigos as any[]) || [];
    await db.delete(scoresAntigos);
    for (const s of rawScores) {
      await db.insert(scoresAntigos).values({
        temporada: String(s.temporada || "1"),
        pos: Number(s.pos) || 1,
        jogador: s.jogador,
        categoria: s.categoria || "ME",
        pontos: String(s.pontos || "0"),
        deck: s.deck || "Desconhecido",
      });
    }

    // 7. Etapas
    await db.delete(etapas);
    const rawEtapas = (defaultEtapas as any[]) || [];
    for (const etapa of rawEtapas) {
      if (!etapa.data) continue;
      const mult = Number(etapa.multiplicador) || 1.0;
      await db.insert(etapas).values({
        data: etapa.data,
        tipo: etapa.tipo || "Liga",
        multiplicador: mult,
        temporada: etapa.temporada || 5,
        status: "concluida",
      });
    }

    // 8. Recalcular Ranking Consolidado a partir das etapas
    try {
      await recalculateRankingConsolidado(5);
    } catch (e) {
      console.warn("Aviso ao recalcular ranking em sync-db:", e);
    }

    clearFileCache();

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/etapas");
    revalidatePath("/campeoes");
    revalidatePath("/calendario");
    revalidatePath("/regras");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({
      success: true,
      message: "Banco de dados sincronizado e tabelas populadas com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro na sincronizacao do banco:", error);
    return NextResponse.json(
      { error: "Falha ao sincronizar banco: " + error.message },
      { status: 500 }
    );
  }
}
