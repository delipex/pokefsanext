import { NextResponse } from "next/server";
import { db } from "@/db";
import { scoresAntigos } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

// GET: Listar todos os scores antigos
export async function GET() {
  try {
    const list = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.temporada), asc(scoresAntigos.pos));
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Inserir novo score antigo
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temporada, pos, jogador, categoria, pontos, deck, dataFechamento } = body;

    if (!temporada || !jogador) {
      return NextResponse.json({ error: "Temporada e Jogador são obrigatórios." }, { status: 400 });
    }

    const [inserted] = await db
      .insert(scoresAntigos)
      .values({
        temporada: String(temporada).trim(),
        pos: Number(pos) || 1,
        jogador: String(jogador).trim(),
        categoria: categoria || "ME",
        pontos: String(pontos || "0").trim(),
        deck: String(deck || "").trim(),
        dataFechamento: dataFechamento ? String(dataFechamento).trim() : null,
      })
      .returning();

    return NextResponse.json({ success: true, message: "Score histórico cadastrado com sucesso!", item: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar score antigo
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, temporada, pos, jogador, categoria, pontos, deck, dataFechamento } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do score não informado." }, { status: 400 });
    }

    const [updated] = await db
      .update(scoresAntigos)
      .set({
        temporada: String(temporada).trim(),
        pos: Number(pos) || 1,
        jogador: String(jogador).trim(),
        categoria: categoria || "ME",
        pontos: String(pontos || "0").trim(),
        deck: String(deck || "").trim(),
        dataFechamento: dataFechamento ? String(dataFechamento).trim() : null,
      })
      .where(eq(scoresAntigos.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, message: "Score histórico atualizado com sucesso!", item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir score antigo
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do score não informado." }, { status: 400 });
    }

    await db.delete(scoresAntigos).where(eq(scoresAntigos.id, Number(id)));

    return NextResponse.json({ success: true, message: "Score histórico excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
