import { NextResponse } from "next/server";
import { db } from "@/db";
import { inscricoesFinc } from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureDatabaseSchema();
  const { searchParams } = new URL(request.url);
  const protocolo = searchParams.get("protocolo");

  try {
    if (protocolo) {
      const result = await db
        .select()
        .from(inscricoesFinc)
        .where(eq(inscricoesFinc.protocolo, protocolo.trim().toUpperCase()));

      if (!result || result.length === 0) {
        return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
      }

      return NextResponse.json({ inscricao: result[0] });
    }

    const rows = await db
      .select()
      .from(inscricoesFinc)
      .orderBy(desc(inscricoesFinc.id));

    // Métricas para a coordenação do evento
    const stats = {
      total: rows.length,
      dia21_noite: 0,
      dia22_tarde: 0,
      dia22_noite: 0,
      dia21: 0,
      dia22: 0,
      ambosDias: 0,
      jogos: {
        pokemon: 0,
        yugioh: 0,
        onepiece: 0,
        digimon: 0,
        riftbound: 0,
        outros: 0,
      },
      intencoes: {
        torneio: 0,
        casual: 0,
        oficina_aprender: 0,
      },
      precisaDeck: 0,
      externos: 0,
      alunos: 0,
    };

    rows.forEach((r) => {
      // Dias e Turnos
      try {
        const diasParsed: string[] = JSON.parse(r.dias || "[]");
        const has21 = diasParsed.some((d) => d.includes("21"));
        const has22 = diasParsed.some((d) => d.includes("22"));

        if (has21 && has22) stats.ambosDias += 1;
        if (has21) stats.dia21 += 1;
        if (has22) stats.dia22 += 1;

        if (diasParsed.some((d) => d === "21_noite" || d === "21")) stats.dia21_noite += 1;
        if (diasParsed.some((d) => d === "22_tarde")) stats.dia22_tarde += 1;
        if (diasParsed.some((d) => d === "22_noite")) stats.dia22_noite += 1;
      } catch {
        if (r.dias === "ambos") {
          stats.ambosDias += 1;
          stats.dia21 += 1;
          stats.dia22 += 1;
        } else if (r.dias.includes("21")) {
          stats.dia21 += 1;
        } else if (r.dias.includes("22")) {
          stats.dia22 += 1;
        }
      }

      // Jogos
      try {
        const jogosParsed: string[] = JSON.parse(r.jogos || "[]");
        jogosParsed.forEach((j) => {
          const key = j.toLowerCase();
          if (key.includes("pokemon")) stats.jogos.pokemon += 1;
          else if (key.includes("yugioh") || key.includes("yu-gi-oh")) stats.jogos.yugioh += 1;
          else if (key.includes("onepiece") || key.includes("one piece")) stats.jogos.onepiece += 1;
          else if (key.includes("digimon")) stats.jogos.digimon += 1;
          else if (key.includes("riftbound")) stats.jogos.riftbound += 1;
          else stats.jogos.outros += 1;
        });
      } catch {}

      // Intenção
      if (r.intencao === "torneio") stats.intencoes.torneio += 1;
      else if (r.intencao === "casual") stats.intencoes.casual += 1;
      else stats.intencoes.oficina_aprender += 1;

      // Deck
      if (r.possuiDeck === "nao" || r.possuiDeck === "preciso_demo") {
        stats.precisaDeck += 1;
      }

      // Tipo de participante
      if (r.tipoParticipante === "externo") stats.externos += 1;
      else stats.alunos += 1;
    });

    return NextResponse.json({
      inscricoes: rows,
      stats,
    });
  } catch (err: any) {
    console.error("Erro ao listar inscrições FINC:", err);
    return NextResponse.json({ error: "Erro interno ao carregar inscrições" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureDatabaseSchema();

  try {
    const body = await request.json();
    const {
      nome,
      whatsapp,
      email = "",
      tipoParticipante = "externo",
      jogos = [],
      dias = [],
      intencao = "torneio",
      possuiDeck = "sim",
      observacoes = "",
    } = body;

    // Validações básicas
    if (!nome || typeof nome !== "string" || nome.trim().length < 3) {
      return NextResponse.json({ error: "Por favor, informe seu nome completo (mínimo 3 letras)." }, { status: 400 });
    }

    const cleanWhatsapp = String(whatsapp || "").replace(/\D/g, "");
    if (cleanWhatsapp.length < 10) {
      return NextResponse.json({ error: "Por favor, informe um WhatsApp válido com DDD." }, { status: 400 });
    }

    if (!Array.isArray(jogos) || jogos.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos um Card Game (TCG) de seu interesse." }, { status: 400 });
    }

    const diasArray = Array.isArray(dias) ? dias : [String(dias)];
    if (diasArray.length === 0) {
      return NextResponse.json({ error: "Selecione os dias em que você estará presente (Dia 21, 22 ou Ambos)." }, { status: 400 });
    }

    // Regra Oficial FINC: quem não tiver deck do jogo escolhido, obrigatoriamente só poderá participar das oficinas
    if (possuiDeck !== "sim" && intencao !== "oficina_aprender") {
      return NextResponse.json(
        {
          error:
            "Regra Oficial FINC: Quem não possui deck próprio do jogo escolhido só poderá participar obrigatoriamente das Oficinas Didáticas de Iniciação.",
        },
        { status: 400 }
      );
    }

    // Gerar protocolo legível exclusivo
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocolo = `FINC-TCG-${randomHex}`;

    const newRow = {
      protocolo,
      nome: nome.trim(),
      whatsapp: cleanWhatsapp,
      email: email ? email.trim() : null,
      tipoParticipante,
      jogos: JSON.stringify(jogos),
      dias: JSON.stringify(diasArray),
      intencao,
      possuiDeck,
      observacoes: observacoes ? observacoes.trim() : null,
      status: "confirmado",
    };

    const inserted = await db.insert(inscricoesFinc).values(newRow).returning();

    // Mensagem de confirmação para abrir no WhatsApp da Atlântica Mais
    const mapTurnoLabel = (d: string) => {
      if (d === "21_noite" || d === "21") return "21/10 Noite (17h-22h)";
      if (d === "22_tarde") return "22/10 Tarde (14h-18h)";
      if (d === "22_noite") return "22/10 Noite (18h-20h)";
      if (d === "22") return "22/10 (14h-20h)";
      return d;
    };
    const diasFormatados = diasArray.map(mapTurnoLabel).join(" + ");
    const jogosFormatados = jogos.join(", ");
    const zapText = encodeURIComponent(
      `Olá! Me inscrevi para o Espaço TCG na ARENA GEEK (FINC 2026).\n\n` +
      `🎫 *Protocolo:* ${protocolo}\n` +
      `👤 *Nome:* ${nome.trim()}\n` +
      `🃏 *Jogos:* ${jogosFormatados}\n` +
      `📅 *Presença:* ${diasFormatados}\n` +
      `🎯 *Modalidade:* ${intencao === "torneio" ? "Torneio Competitivo" : intencao === "casual" ? "Free Play / Casual" : "Oficina Didática (Aprender)"}\n` +
      `📦 *Deck:* ${possuiDeck === "sim" ? "Tenho deck próprio" : "Preciso de deck emprestado / demo"}\n\n` +
      `Confirmando minha presença na Arena Geek!`
    );

    return NextResponse.json({
      success: true,
      protocolo,
      inscricao: inserted[0] || newRow,
      whatsappLink: `https://wa.me/5575992683072?text=${zapText}`,
    });
  } catch (err: any) {
    console.error("Erro ao salvar inscrição FINC:", err);
    return NextResponse.json({ error: "Erro ao processar sua inscrição. Tente novamente." }, { status: 500 });
  }
}
