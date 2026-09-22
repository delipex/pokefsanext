import { NextResponse } from "next/server";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(jogadores).orderBy(jogadores.nome);
    return NextResponse.json({ success: true, players: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, categoria } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    await db
      .insert(jogadores)
      .values({
        id: String(id).trim(),
        nome: String(nome).trim(),
        categoria: ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master",
        ativo: true,
      })
      .onConflictDoUpdate({
        target: jogadores.id,
        set: {
          nome: String(nome).trim(),
          categoria: ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master",
        },
      });

    return NextResponse.json({ success: true, message: "Jogador salvo com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, categoria } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    await db
      .update(jogadores)
      .set({
        nome: String(nome).trim(),
        categoria: ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master",
      })
      .where(eq(jogadores.id, String(id).trim()));

    return NextResponse.json({ success: true, message: "Jogador atualizado com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do jogador é obrigatório" }, { status: 400 });
    }

    await db.delete(jogadores).where(eq(jogadores.id, id));

    return NextResponse.json({ success: true, message: "Jogador excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
