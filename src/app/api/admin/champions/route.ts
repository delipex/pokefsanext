import { NextResponse } from "next/server";
import { db } from "@/db";
import { campeoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET: Listar todos os campeões do Hall da Fama
export async function GET() {
  try {
    const list = await db.select().from(campeoes).orderBy(desc(campeoes.id));
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Cadastrar novo campeão
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temporada, campeao, vice, deckCampeao, data, fotoCampeao, urlDeck, imagemDeck, observacaoDeck } = body;

    if (!temporada || !campeao || !deckCampeao) {
      return NextResponse.json({ error: "Temporada, Campeão e Deck do Campeão são obrigatórios." }, { status: 400 });
    }

    const [inserted] = await db
      .insert(campeoes)
      .values({
        temporada: String(temporada).trim(),
        campeao: String(campeao).trim(),
        vice: String(vice || "A definir").trim(),
        deckCampeao: String(deckCampeao).trim(),
        data: String(data || new Date().toISOString().split("T")[0]).trim(),
        fotoCampeao: fotoCampeao ? String(fotoCampeao).trim() : null,
        urlDeck: urlDeck ? String(urlDeck).trim() : null,
        imagemDeck: imagemDeck ? String(imagemDeck).trim() : null,
        observacaoDeck: observacaoDeck ? String(observacaoDeck).trim() : null,
      })
      .returning();

    return NextResponse.json({ success: true, message: "Campeão cadastrado com sucesso!", item: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar dados de um campeão existente
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, temporada, campeao, vice, deckCampeao, data, fotoCampeao, urlDeck, imagemDeck, observacaoDeck } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do campeão não informado." }, { status: 400 });
    }

    const [updated] = await db
      .update(campeoes)
      .set({
        temporada: String(temporada).trim(),
        campeao: String(campeao).trim(),
        vice: String(vice || "A definir").trim(),
        deckCampeao: String(deckCampeao).trim(),
        data: String(data || "").trim(),
        fotoCampeao: fotoCampeao ? String(fotoCampeao).trim() : null,
        urlDeck: urlDeck ? String(urlDeck).trim() : null,
        imagemDeck: imagemDeck ? String(imagemDeck).trim() : null,
        observacaoDeck: observacaoDeck ? String(observacaoDeck).trim() : null,
      })
      .where(eq(campeoes.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, message: "Campeão atualizado com sucesso!", item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir campeão do Hall da Fama
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do campeão não informado." }, { status: 400 });
    }

    await db.delete(campeoes).where(eq(campeoes.id, Number(id)));

    return NextResponse.json({ success: true, message: "Campeão excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
