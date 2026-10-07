import { NextResponse } from "next/server";
import { db } from "@/db";
import { client } from "@/db/index";
import { jogadorDecklists, jogadores, configuracoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  parseAndValidateDecklist,
  sanitizeText,
  validatePopId,
  validatePlayerName,
  checkRateLimit,
} from "@/lib/security";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { inferDeckEnergy } from "@/lib/deck-normalizer";
import { revalidatePath } from "next/cache";

// GET: Retorna as configurações do torneio ativo e total de inscritos
export async function GET() {
  try {
    await ensureDatabaseSchema();
    const configRows = await db.select().from(configuracoes);
    const configMap: Record<string, any> = {};
    for (const row of configRows) {
      try {
        configMap[row.chave] = JSON.parse(row.valor);
      } catch {
        configMap[row.chave] = row.valor;
      }
    }

    const isAbertas =
      configMap.premierAbertas === "true" || configMap.premierAbertas === true;
    const eventDate = configMap.premierData || "";
    const eventName = configMap.premierNome || "Torneio Oficial";

    // Contagem de inscritos para este evento específico
    let allDecklists: any[] = [];
    try {
      allDecklists = await db
        .select()
        .from(jogadorDecklists)
        .orderBy(desc(jogadorDecklists.createdAt));
    } catch {
      const res = await client.execute("SELECT * FROM jogador_decklists ORDER BY created_at DESC;");
      allDecklists = res.rows as any[];
    }

    const enrolledList = allDecklists.filter((d) => {
      if (eventDate && (d.etapaData === eventDate || d.etapa_data === eventDate)) return true;
      const dEventName = d.eventoNome || d.evento_nome || "";
      if (eventName && dEventName.toLowerCase().includes(eventName.toLowerCase())) return true;
      return false;
    });

    const enrolledCount = enrolledList.length;
    const maxVagas = parseInt(configMap.premierVagas || "32", 10);
    const vagasRestantes = Math.max(0, maxVagas - enrolledCount);

    return NextResponse.json({
      abertas: isAbertas,
      config: configMap,
      totalInscritos: enrolledCount,
      vagasRestantes,
      limiteVagas: maxVagas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Submissão de inscrição pública com validação de 60 cartas e geração de protocolo
export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();

    // 1. Rate Limiting por IP
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip, 15, 60000)) {
      return NextResponse.json(
        { error: "Muitas tentativas em sequência. Por favor, aguarde um momento antes de enviar novamente." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      jogadorNome,
      jogadorId,
      dataNascimento,
      categoria,
      deckNome,
      tipoEnergia,
      decklistRaw,
      limitlessUrl,
      eventoNome,
      etapaData,
      metodoPagamento,
    } = body;

    // 2. Validações de Identidade
    const nameVal = validatePlayerName(jogadorNome || "");
    if (!nameVal.isValid) {
      return NextResponse.json({ error: nameVal.error }, { status: 400 });
    }

    const popVal = validatePopId(jogadorId || "");
    if (!popVal.isValid) {
      return NextResponse.json({ error: popVal.error }, { status: 400 });
    }

    // 3. Busca Configurações Atuais do Torneio
    const configRows = await db.select().from(configuracoes);
    const configMap: Record<string, any> = {};
    for (const row of configRows) {
      try {
        configMap[row.chave] = JSON.parse(row.valor);
      } catch {
        configMap[row.chave] = row.valor;
      }
    }

    const isAbertas = configMap.premierAbertas === "true" || configMap.premierAbertas === true;
    if (!isAbertas) {
      return NextResponse.json(
        { error: "As inscrições para este torneio estão encerradas no momento." },
        { status: 403 }
      );
    }

    const exigirDecklist = configMap.premierExigirDecklist === "true" || configMap.premierExigirDecklist === true;
    const rawDecklistText = (decklistRaw || "").trim();

    let totalCartas = 0;
    let isValidDeck = false;

    if (rawDecklistText) {
      const parsed = parseAndValidateDecklist(rawDecklistText);
      totalCartas = parsed.totalCards;
      isValidDeck = parsed.isValid;

      if (exigirDecklist && !parsed.isValid && parsed.error) {
        return NextResponse.json(
          { error: `Erro na Decklist: ${parsed.error}`, warnings: parsed.warnings },
          { status: 400 }
        );
      }
    } else if (exigirDecklist && !limitlessUrl) {
      return NextResponse.json(
        { error: "A lista de 60 cartas é obrigatória para este torneio. Insira a lista ou o link do Limitless." },
        { status: 400 }
      );
    }

    // 4. Geração de Protocolo Oficial Único
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const protocolo = `LA-${dateStr}-${randomSuffix}`;

    const finalEventName = eventoNome || configMap.premierNome || "League Challenge — Liga Atlântica";
    const finalEventDate = etapaData || configMap.premierData || now.toISOString().split("T")[0];
    
    // Calcula categoria oficial Play! Pokémon com base no ano de nascimento (Temporada Oficial)
    let finalCategory = categoria || "Master";
    if (dataNascimento) {
      const parts = dataNascimento.split("-");
      if (parts.length === 3) {
        const yr = parseInt(parts[0], 10);
        if (!isNaN(yr)) {
          if (yr >= 2014) finalCategory = "Junior";
          else if (yr >= 2010) finalCategory = "Senior";
          else finalCategory = "Master";
        }
      }
    }

    const finalDeckNome = sanitizeText(deckNome) || "A definir";

    // Auto-detecta energia inteligente caso o usuário não tenha selecionado ou seja genérica
    const finalTipoEnergia =
      tipoEnergia && tipoEnergia !== "auto"
        ? tipoEnergia
        : inferDeckEnergy(finalDeckNome, rawDecklistText);

    // Define status inicial baseado na forma de pagamento escolhida
    const isPresencial = metodoPagamento === "presencial" || metodoPagamento === "local";
    const initialStatusPix = isPresencial ? "Pagar no Local" : "Pendente";

    // 5. Inserção na Tabela de Decklists / Inscrições (com proteção contra discrepâncias de esquema)
    let insertedItem: any = null;
    try {
      const [inserted] = await db
        .insert(jogadorDecklists)
        .values({
          protocolo,
          jogadorId: popVal.cleanId,
          jogadorNome: nameVal.cleanName!,
          categoria: finalCategory,
          eventoNome: finalEventName,
          etapaData: finalEventDate,
          deckNome: finalDeckNome,
          tipoEnergia: finalTipoEnergia,
          decklistRaw: rawDecklistText || (limitlessUrl ? `Link: ${limitlessUrl}` : ""),
          totalCartas: totalCartas || (rawDecklistText ? 60 : 0),
          validada: isValidDeck,
          statusPix: initialStatusPix,
        })
        .returning();
      insertedItem = inserted;
    } catch (drizzleErr) {
      // Fallback robusto via client direto SQL do Turso
      const res = await client.execute({
        sql: `INSERT INTO jogador_decklists (
          protocolo, jogador_id, jogador_nome, categoria, evento_nome, etapa_data,
          deck_nome, tipo_energia, decklist_raw, total_cartas, validada, status_pix, cards_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]') RETURNING *;`,
        args: [
          protocolo,
          popVal.cleanId,
          nameVal.cleanName!,
          finalCategory,
          finalEventName,
          finalEventDate,
          finalDeckNome,
          finalTipoEnergia,
          rawDecklistText || (limitlessUrl ? `Link: ${limitlessUrl}` : ""),
          totalCartas || (rawDecklistText ? 60 : 0),
          isValidDeck ? 1 : 0,
          initialStatusPix,
        ],
      });
      insertedItem = res.rows[0] || { protocolo, jogadorNome: nameVal.cleanName };
    }

    // 6. Atualização/Registro do Atleta na Tabela de Jogadores (se não existir)
    try {
      const existingPlayer = await db
        .select()
        .from(jogadores)
        .where(eq(jogadores.id, popVal.cleanId!))
        .limit(1);

      if (existingPlayer.length === 0) {
        await db.insert(jogadores).values({
          id: popVal.cleanId!,
          nome: nameVal.cleanName!,
          categoria: finalCategory,
          dataNascimento: dataNascimento || null,
          ativo: true,
          deckAtivoNome: finalDeckNome,
          decklistTexto: rawDecklistText,
        });
      } else {
        await db
          .update(jogadores)
          .set({
            categoria: finalCategory,
            dataNascimento: dataNascimento || existingPlayer[0].dataNascimento,
            deckAtivoNome: finalDeckNome,
            decklistTexto: rawDecklistText || existingPlayer[0].decklistTexto,
          })
          .where(eq(jogadores.id, popVal.cleanId!));
      }
    } catch {
      // Silencioso se der warning no perfil do jogador
    }

    // 7. Montar Link Direto do WhatsApp para Envio do Comprovante ou Confirmação
    const formattedNasc = dataNascimento
      ? dataNascimento.includes("-")
        ? dataNascimento.split("-").reverse().join("/")
        : dataNascimento
      : "";

    const waContact = (configMap.premierWaContato || "").replace(/\D/g, "");
    let waMsg = `🏆 *INSCRIÇÃO & DECKLIST - LIGA ATLÂNTICA*\n`;
    waMsg += `🔖 *Protocolo:* \`${protocolo}\`\n`;
    waMsg += `📍 *Evento:* ${finalEventName}\n`;
    waMsg += `👤 *Jogador:* ${nameVal.cleanName}\n`;
    waMsg += `🆔 *POP ID:* ${popVal.cleanId}\n`;
    waMsg += `🎂 *Nascimento:* ${formattedNasc ? `${formattedNasc} (${finalCategory})` : finalCategory}\n`;
    waMsg += `🃏 *Deck:* ${finalDeckNome} (${totalCartas}/60 cartas)\n`;
    if (limitlessUrl) {
      waMsg += `🔗 *Limitless:* ${limitlessUrl}\n`;
    }
    if (rawDecklistText) {
      waMsg += `\n📜 *LISTA (${totalCartas} cartas):*\n${rawDecklistText}\n`;
    }

    if (isPresencial) {
      waMsg += `\n💰 *Pagamento:* No Dia do Evento (Presencial no Balcão)\n⚠️ *Aviso:* Realizar o pagamento na recepção antes do início da Rodada 1.`;
    } else {
      waMsg += `\n💰 *Pagamento:* PIX Antecipado (R$ ${configMap.premierValor || "0,00"})\n📎 *Comprovante:* Segue anexo o comprovante PIX da inscrição.`;
    }


    const encodedWa = encodeURIComponent(waMsg);
    const waUrl = waContact
      ? `https://api.whatsapp.com/send?phone=${waContact}&text=${encodedWa}`
      : `https://api.whatsapp.com/send?text=${encodedWa}`;

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/portal");
    revalidatePath("/calendario");

    return NextResponse.json({
      success: true,
      protocolo,
      item: insertedItem,
      waUrl,
      chavePix: configMap.premierPix || "",
      titularPix: configMap.premierTitular || "",
      valor: configMap.premierValor || "0,00",
      message: "Inscrição confirmada com sucesso! Guarde seu protocolo e envie o comprovante PIX.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
