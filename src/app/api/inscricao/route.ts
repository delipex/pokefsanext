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

    const finalEventName = eventoNome || configMap.premierNome || "League Challenge — Liga Atlântica";
    const finalEventDate = etapaData || configMap.premierData || new Date().toISOString().split("T")[0];
    
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

    // 4. Verificação de Inscrição Existente para o Mesmo Evento (Unificação & Atualização)
    let existingItem: any = null;
    try {
      const existingList = await db
        .select()
        .from(jogadorDecklists)
        .where(eq(jogadorDecklists.jogadorId, popVal.cleanId!));

      existingItem = existingList.find((item: any) => {
        if (finalEventDate && item.etapaData === finalEventDate) return true;
        if (finalEventName && item.eventoNome && item.eventoNome.toLowerCase().includes(finalEventName.toLowerCase())) return true;
        return false;
      });
    } catch {
      try {
        const res = await client.execute({
          sql: `SELECT * FROM jogador_decklists WHERE jogador_id = ?;`,
          args: [popVal.cleanId!],
        });
        existingItem = (res.rows as any[]).find((item: any) => {
          if (finalEventDate && (item.etapaData === finalEventDate || item.etapa_data === finalEventDate)) return true;
          const ev = item.eventoNome || item.evento_nome || "";
          if (finalEventName && ev && ev.toLowerCase().includes(finalEventName.toLowerCase())) return true;
          return false;
        });
      } catch {}
    }

    const isUpdate = Boolean(existingItem);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const protocolo = existingItem?.protocolo || `LA-${dateStr}-${randomSuffix}`;

    let savedItem: any = null;

    if (isUpdate && existingItem) {
      // 5A. Registro no Histórico de Edições / Log para o Organizador
      const alteracoes: string[] = [];
      const oldDeck = existingItem.deckNome || existingItem.deck_nome || "";
      if (oldDeck !== finalDeckNome) {
        alteracoes.push(`Baralho: "${oldDeck}" ➔ "${finalDeckNome}"`);
      }
      const oldDl = existingItem.decklistRaw || existingItem.decklist_raw || "";
      if (rawDecklistText && oldDl !== rawDecklistText) {
        alteracoes.push(`Decklist de 60 cartas atualizada (${totalCartas} cartas)`);
      }
      const oldCat = existingItem.categoria || "";
      if (oldCat !== finalCategory) {
        alteracoes.push(`Categoria: "${oldCat}" ➔ "${finalCategory}"`);
      }
      if (body.whatsapp && existingItem.whatsapp !== body.whatsapp) {
        alteracoes.push(`WhatsApp atualizado`);
      }

      let history: any[] = [];
      try {
        const rawHist = existingItem.historicoEdicoes || existingItem.historico_edicoes || "[]";
        history = JSON.parse(rawHist);
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }

      if (alteracoes.length > 0) {
        history.push({
          dataHora: now.toISOString(),
          editadoPor: "jogador",
          alteracoes,
          deckAnterior: oldDeck,
          deckNovo: finalDeckNome,
        });
      }

      const updatedHistoryStr = JSON.stringify(history);

      try {
        const [updated] = await db
          .update(jogadorDecklists)
          .set({
            jogadorNome: nameVal.cleanName!,
            categoria: finalCategory,
            dataNascimento: dataNascimento || existingItem.dataNascimento,
            whatsapp: body.whatsapp || existingItem.whatsapp,
            deckNome: finalDeckNome,
            tipoEnergia: finalTipoEnergia,
            decklistRaw: rawDecklistText || existingItem.decklistRaw,
            totalCartas: totalCartas || existingItem.totalCartas,
            validada: isValidDeck ? true : existingItem.validada,
            updatedAt: now.toISOString(),
            historicoEdicoes: updatedHistoryStr,
          })
          .where(eq(jogadorDecklists.id, existingItem.id))
          .returning();
        savedItem = updated;
      } catch {
        await client.execute({
          sql: `UPDATE jogador_decklists SET
            jogador_nome = ?, categoria = ?, data_nascimento = ?, whatsapp = ?,
            deck_nome = ?, tipo_energia = ?, decklist_raw = ?, total_cartas = ?,
            validada = ?, updated_at = ?, historico_edicoes = ?
          WHERE id = ?;`,
          args: [
            nameVal.cleanName!,
            finalCategory,
            dataNascimento || existingItem.dataNascimento || null,
            body.whatsapp || existingItem.whatsapp || null,
            finalDeckNome,
            finalTipoEnergia,
            rawDecklistText || existingItem.decklistRaw || "",
            totalCartas || existingItem.totalCartas || 60,
            isValidDeck ? 1 : 0,
            now.toISOString(),
            updatedHistoryStr,
            existingItem.id,
          ],
        });
        savedItem = { ...existingItem, deckNome: finalDeckNome, decklistRaw: rawDecklistText };
      }
    } else {
      // 5B. Inserção Nova na Tabela de Decklists
      try {
        const [inserted] = await db
          .insert(jogadorDecklists)
          .values({
            protocolo,
            jogadorId: popVal.cleanId,
            jogadorNome: nameVal.cleanName!,
            categoria: finalCategory,
            dataNascimento: dataNascimento || null,
            whatsapp: body.whatsapp || null,
            eventoNome: finalEventName,
            etapaData: finalEventDate,
            deckNome: finalDeckNome,
            tipoEnergia: finalTipoEnergia,
            decklistRaw: rawDecklistText || (limitlessUrl ? `Link: ${limitlessUrl}` : ""),
            totalCartas: totalCartas || (rawDecklistText ? 60 : 0),
            validada: isValidDeck,
            statusPix: initialStatusPix,
            historicoEdicoes: "[]",
          })
          .returning();
        savedItem = inserted;
      } catch (drizzleErr) {
        const res = await client.execute({
          sql: `INSERT INTO jogador_decklists (
            protocolo, jogador_id, jogador_nome, categoria, data_nascimento, whatsapp, evento_nome, etapa_data,
            deck_nome, tipo_energia, decklist_raw, total_cartas, validada, status_pix, cards_json, historico_edicoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]') RETURNING *;`,
          args: [
            protocolo,
            popVal.cleanId,
            nameVal.cleanName!,
            finalCategory,
            dataNascimento || null,
            body.whatsapp || null,
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
        savedItem = res.rows[0] || { protocolo, jogadorNome: nameVal.cleanName };
      }
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
      isUpdate,
      protocolo,
      item: savedItem,
      waUrl,
      chavePix: configMap.premierPix || "",
      titularPix: configMap.premierTitular || "",
      valor: configMap.premierValor || "0,00",
      message: isUpdate
        ? "Inscrição atualizada com sucesso! Suas alterações foram registradas no sistema."
        : "Inscrição confirmada com sucesso! Guarde seu protocolo e envie o comprovante PIX.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
