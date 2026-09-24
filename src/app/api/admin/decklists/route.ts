import { NextResponse } from "next/server";
import { db } from "@/db";
import { jogadorDecklists, jogadores, configuracoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET: Buscar todas as decklists e inscrições
export async function GET() {
  try {
    const list = await db.select().from(jogadorDecklists).orderBy(desc(jogadorDecklists.createdAt));
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Cadastrar ou importar nova inscrição / decklist manualmente pelo Admin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      jogadorId,
      jogadorNome,
      eventoNome,
      etapaData,
      deckNome,
      tipoEnergia,
      decklistRaw,
      totalCartas,
      validada,
      categoria,
      statusPix,
      protocolo,
    } = body;

    if (!jogadorNome || !deckNome) {
      return NextResponse.json({ error: "Nome do jogador e nome do deck são obrigatórios." }, { status: 400 });
    }

    const genProtocolo = protocolo || `LA-${Date.now().toString(36).toUpperCase()}`;

    const [inserted] = await db
      .insert(jogadorDecklists)
      .values({
        jogadorId: jogadorId ? String(jogadorId).trim() : null,
        jogadorNome: String(jogadorNome).trim(),
        eventoNome: eventoNome || "Torneio Premier",
        etapaData: etapaData || new Date().toISOString().split("T")[0],
        deckNome: String(deckNome).trim(),
        tipoEnergia: tipoEnergia || "colorless",
        decklistRaw: decklistRaw || "",
        totalCartas: Number(totalCartas) || (decklistRaw ? 60 : 0),
        validada: Boolean(validada),
        statusPix: statusPix || "Pendente",
        protocolo: genProtocolo,
        categoria: categoria || "Master",
      })
      .returning();

    return NextResponse.json({ success: true, message: "Inscrição registrada com sucesso!", item: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar status de pagamento (Confirmado/Pendente), validação ou dados da inscrição
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, statusPix, validada, deckNome, tipoEnergia, categoria } = body;

    if (!id) {
      return NextResponse.json({ error: "ID da inscrição não informado." }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (statusPix !== undefined) updateData.statusPix = statusPix;
    if (validada !== undefined) updateData.validada = validada;
    if (deckNome !== undefined) updateData.deckNome = deckNome;
    if (tipoEnergia !== undefined) updateData.tipoEnergia = tipoEnergia;
    if (categoria !== undefined) updateData.categoria = categoria;

    const [updated] = await db
      .update(jogadorDecklists)
      .set(updateData)
      .where(eq(jogadorDecklists.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, message: "Inscrição atualizada com sucesso!", item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remover inscrição / decklist
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da inscrição não informado." }, { status: 400 });
    }

    await db.delete(jogadorDecklists).where(eq(jogadorDecklists.id, Number(id)));

    return NextResponse.json({ success: true, message: "Inscrição removida com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
