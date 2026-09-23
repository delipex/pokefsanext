import { db } from "./index";
import {
  jogadores,
  decks,
  etapas,
  etapaResultados,
  rankingConsolidado,
  configuracoes,
  metagame,
  campeoes,
  galeria,
  scoresAntigos,
  calendario,
} from "./schema";
import fs from "fs";
import path from "path";

async function seed() {
  console.log("🌱 Iniciando o seed do banco de dados...");

  const sourceDir = path.resolve(__dirname, "../../..", "LigaAtlântica");

  // 1. Seed Configurações
  const configPath = path.join(sourceDir, "config.json");
  if (fs.existsSync(configPath)) {
    const configRaw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    console.log("⚙️ Importando configurações...");
    for (const [chave, valor] of Object.entries(configRaw)) {
      await db
        .insert(configuracoes)
        .values({
          chave,
          valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
        })
        .onConflictDoUpdate({
          target: configuracoes.chave,
          set: {
            valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
          },
        });
    }
  }

  // 2. Seed Decks
  const decksPath = path.join(sourceDir, "decks.json");
  if (fs.existsSync(decksPath)) {
    const decksData = JSON.parse(fs.readFileSync(decksPath, "utf-8"));
    console.log(`🎴 Importando ${decksData.length} decks...`);
    for (const d of decksData) {
      if (!d.deck) continue;
      await db
        .insert(decks)
        .values({
          nome: d.deck,
          tipoEnergia: d.tipoEnergia || "colorless",
          imagem: d.imagem || null,
          limitless: d.limitless || null,
          icone: d.icone || null,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Seed Jogadores
  const jogadoresPath = path.join(sourceDir, "jogadores.json");
  if (fs.existsSync(jogadoresPath)) {
    const jogadoresData = JSON.parse(fs.readFileSync(jogadoresPath, "utf-8"));
    console.log(`👤 Importando ${jogadoresData.length} jogadores...`);
    for (const j of jogadoresData) {
      const id = String(j.id || j.ID || "").trim();
      const nome = String(j.jogador || j.Jogador || "").trim();
      if (!id || !nome) continue;

      const categoria = (j.categoria || j.Categoria || "Master") as "Master" | "Senior" | "Junior";
      const posicaoFinal = j.posicaoFinal ? Number(j.posicaoFinal) : null;

      await db
        .insert(jogadores)
        .values({
          id,
          nome,
          categoria: ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master",
          posicaoFinal: Number.isNaN(posicaoFinal) ? null : posicaoFinal,
        })
        .onConflictDoUpdate({
          target: jogadores.id,
          set: {
            nome,
            categoria: ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master",
          },
        });
    }
  }

  // 4. Carregar metagame.json prévio para vincular decks aos resultados
  const metaPath = path.join(sourceDir, "metagame.json");
  let metaRaw: Record<string, any> = {};
  if (fs.existsSync(metaPath)) {
    metaRaw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }

  const findDeckInMeta = (stageDate: string, playerName: string): string | null => {
    const stage = metaRaw[stageDate];
    if (!stage || !stage.decks) return null;
    if (stage.decks[playerName]) return stage.decks[playerName];
    const norm = playerName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const [pName, dName] of Object.entries(stage.decks)) {
      const pNorm = (pName as string).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (pNorm === norm) return dName as string;
    }
    return null;
  };

  // 5. Seed Etapas & Resultados Individuais
  const etapasPath = path.join(sourceDir, "etapas.json");
  const etapasFolder = path.join(sourceDir, "etapas");

  if (fs.existsSync(etapasPath)) {
    const etapasData = JSON.parse(fs.readFileSync(etapasPath, "utf-8"));
    console.log(`📅 Importando ${etapasData.length} etapas e seus arquivos TDF...`);
    
    await db.delete(etapaResultados);

    for (const e of etapasData) {
      if (!e.data) continue;

      const [insertedEtapa] = await db
        .insert(etapas)
        .values({
          data: e.data,
          tipo: e.tipo || "Liga",
          multiplicador: Number(e.multiplicador) || 1.0,
          temporada: 5,
          status: "concluida",
        })
        .onConflictDoUpdate({
          target: etapas.data,
          set: {
            tipo: e.tipo || "Liga",
            multiplicador: Number(e.multiplicador) || 1.0,
          },
        })
        .returning();

      const etapaId = insertedEtapa?.id;

      const tdfFile = path.join(etapasFolder, `${e.data}.tdf`);
      if (fs.existsSync(tdfFile)) {
        const lines = fs.readFileSync(tdfFile, "utf-8").split(/\r?\n/).filter(Boolean);
        const rows = lines.slice(1);

        for (const row of rows) {
          const cols = row.split("\t");
          if (cols.length < 5) continue;

          const [
            pos,
            id,
            jogador,
            categoria,
            pontos,
            vitorias,
            empates,
            derrotas,
          ] = cols;

          const deckNome = findDeckInMeta(e.data, jogador.trim());

          await db.insert(etapaResultados).values({
            etapaId,
            etapaData: e.data,
            jogadorId: id ? id.trim() : null,
            jogadorNome: jogador.trim(),
            categoria: categoria ? categoria.trim() : "Master",
            colocacao: Number(pos) || 99,
            pontos: Number(pontos) || 0,
            vitorias: Number(vitorias) || 0,
            empates: Number(empates) || 0,
            derrotas: Number(derrotas) || 0,
            deckNome: deckNome || null,
          });
        }
      }
    }
  }

  // 5. Seed Ranking Consolidado a partir do ranking.tdf
  const rankingPath = path.join(sourceDir, "ranking.tdf");
  if (fs.existsSync(rankingPath)) {
    console.log("📊 Importando ranking.tdf...");
    await db.delete(rankingConsolidado);

    const lines = fs.readFileSync(rankingPath, "utf-8").split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1);
    for (const row of rows) {
      const cols = row.split("\t");
      if (cols.length < 12) continue;
      const [
        _pos,
        id,
        jogador,
        categoria,
        pontos,
        vitorias,
        empates,
        derrotas,
        podios,
        mediaColocacao,
        participacoes,
        historicoColocacoes,
      ] = cols;

      await db
        .insert(rankingConsolidado)
        .values({
          temporada: 5,
          jogadorId: id.trim(),
          jogadorNome: jogador.trim(),
          categoria: categoria.trim(),
          pontos: Number(pontos) || 0,
          vitorias: Number(vitorias) || 0,
          empates: Number(empates) || 0,
          derrotas: Number(derrotas) || 0,
          podios: Number(podios) || 0,
          mediaColocacao: Number(mediaColocacao) || 0,
          participacoes: Number(participacoes) || 0,
          historicoColocacoes: historicoColocacoes ? historicoColocacoes.trim() : "",
        });
    }
  }

  // 6. Seed Metagame (metagame.json)
  if (fs.existsSync(metaPath)) {
    console.log("🔥 Importando metagame.json...");
    await db.delete(metagame);

    for (const [dataEtapa, sessao] of Object.entries<any>(metaRaw)) {
      const sessionCode = sessao.sessionCode || null;
      const decksMap = sessao.decks || {};

      for (const [jogadorNome, deckNome] of Object.entries<string>(decksMap)) {
        if (!deckNome || !deckNome.trim()) continue;

        await db.insert(metagame).values({
          etapaData: dataEtapa,
          sessionCode,
          jogadorNome: jogadorNome.trim(),
          deckNome: deckNome.trim(),
        });
      }
    }
  }

  // 7. Seed Campeões (campeoes.json)
  const campeoesPath = path.join(sourceDir, "campeoes.json");
  if (fs.existsSync(campeoesPath)) {
    console.log("🏆 Importando campeoes.json...");
    await db.delete(campeoes);
    const campeoesData = JSON.parse(fs.readFileSync(campeoesPath, "utf-8"));
    for (const c of campeoesData) {
      await db.insert(campeoes).values({
        temporada: c.Temporada || c.temporada,
        campeao: c.Campeao || c.campeao,
        vice: c.Vice || c.vice || "",
        deckCampeao: c.DeckCampeao || c.deckCampeao || "",
        data: c.Data || c.data || "",
        fotoCampeao: c.FotoCampeao || c.fotoCampeao || null,
        urlDeck: c.URLDeck || c.urlDeck || null,
        imagemDeck: c.ImagemDeck || c.imagemDeck || null,
        observacaoDeck: c.ObservacaoDeck || c.observacaoDeck || null,
      });
    }
  }

  // 8. Seed Galeria (galeria.json)
  const galeriaPath = path.join(sourceDir, "galeria.json");
  if (fs.existsSync(galeriaPath)) {
    console.log("📸 Importando galeria.json...");
    await db.delete(galeria);
    const galeriaData = JSON.parse(fs.readFileSync(galeriaPath, "utf-8"));
    for (const g of galeriaData) {
      await db.insert(galeria).values({
        titulo: g.titulo || g.Titulo || "",
        descricao: g.descricao || g.Descricao || "",
        urlImagem: g.urlImagem || g.UrlImagem || "",
        data: g.data || g.Data || "",
      });
    }
  }

  // 9. Seed Scores Antigos (scores_antigos.json)
  const scoresPath = path.join(sourceDir, "scores_antigos.json");
  if (fs.existsSync(scoresPath)) {
    console.log("📜 Importando scores_antigos.json...");
    await db.delete(scoresAntigos);
    const scoresData = JSON.parse(fs.readFileSync(scoresPath, "utf-8"));
    for (const s of scoresData) {
      await db.insert(scoresAntigos).values({
        temporada: s.temporada || "",
        dataFechamento: s.dataFechamento || "",
        pos: Number(s.pos) || 99,
        jogador: s.jogador || "",
        categoria: s.categoria || "ME",
        pontos: String(s.pontos || ""),
        deck: s.deck || "",
      });
    }
  }

  // 10. Seed Calendário (calendario.json)
  const calPath = path.join(sourceDir, "calendario.json");
  if (fs.existsSync(calPath)) {
    console.log("📅 Importando calendario.json...");
    await db.delete(calendario);
    const calData = JSON.parse(fs.readFileSync(calPath, "utf-8"));
    for (const item of calData) {
      await db.insert(calendario).values({
        data: item.data || "",
        evento: item.evento || "",
        local: item.local || "Livraria Atlântica +",
        horario: item.horario || "14:00",
        status: item.status || "confirmado",
        descricao: item.descricao || "",
        linkMaps: item.linkMaps || null,
        linkInscricao: item.linkInscricao || null,
        foto: item.foto || null,
      });
    }
  }

  console.log("✅ Seed 100% completo com calendário, scores, galeria e campeões!");
}

seed()
  .catch((err) => {
    console.error("❌ Erro durante o seed:", err);
    process.exit(1);
  });
