import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const list = await db.select().from(decks).orderBy(decks.nome);
    return NextResponse.json({ success: true, decks: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, tipoEnergia, imagem, limitless, icone } = body;

    if (!nome || !tipoEnergia) {
      return NextResponse.json({ error: "Nome e Tipo de Energia são obrigatórios" }, { status: 400 });
    }

    await db
      .insert(decks)
      .values({
        nome: String(nome).trim(),
        tipoEnergia: String(tipoEnergia).trim(),
        imagem: imagem || null,
        limitless: limitless || null,
        icone: icone || null,
        ativo: true,
      })
      .onConflictDoUpdate({
        target: decks.nome,
        set: {
          tipoEnergia: String(tipoEnergia).trim(),
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
        },
      });

    return NextResponse.json({ success: true, message: "Deck salvo com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, tipoEnergia, imagem, limitless, icone } = body;

    if (!id && !nome) {
      return NextResponse.json({ error: "ID ou Nome do deck é obrigatório" }, { status: 400 });
    }

    if (id) {
      await db
        .update(decks)
        .set({
          nome: String(nome).trim(),
          tipoEnergia: String(tipoEnergia).trim(),
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
        })
        .where(eq(decks.id, Number(id)));
    } else {
      await db
        .update(decks)
        .set({
          tipoEnergia: String(tipoEnergia).trim(),
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
        })
        .where(eq(decks.nome, String(nome).trim()));
    }

    return NextResponse.json({ success: true, message: "Deck atualizado com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const nomeParam = searchParams.get("nome");

    if (idParam) {
      await db.delete(decks).where(eq(decks.id, Number(idParam)));
    } else if (nomeParam) {
      await db.delete(decks).where(eq(decks.nome, nomeParam));
    } else {
      return NextResponse.json({ error: "ID ou Nome do deck é obrigatório" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Deck excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
