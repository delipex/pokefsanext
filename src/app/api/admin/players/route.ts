import { NextResponse } from "next/server";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const list = await db.select().from(jogadores).orderBy(asc(jogadores.nome));
    return NextResponse.json({ success: true, players: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { id, nome, categoria, whatsapp, dataNascimento, cidade } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const cleanName = String(nome).trim();
    const validCat = ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master";

    await db
      .insert(jogadores)
      .values({
        id: cleanId,
        nome: cleanName,
        categoria: validCat,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
        cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
        status: "ativo",
        ativo: true,
      })
      .onConflictDoUpdate({
        target: jogadores.id,
        set: {
          nome: cleanName,
          categoria: validCat,
          whatsapp: whatsapp ? String(whatsapp).trim() : null,
          dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
          cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
          ativo: true,
        },
      });

    return NextResponse.json({ success: true, message: "Jogador salvo com sucesso no banco de dados!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { id, nome, categoria, whatsapp, dataNascimento, cidade, resetPin, ativo } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const cleanName = String(nome).trim();
    const validCat = ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master";

    const updateData: any = {
      nome: cleanName,
      categoria: validCat,
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
      cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
    };

    if (typeof ativo === "boolean") {
      updateData.ativo = ativo;
    }

    if (resetPin) {
      updateData.pinHash = null;
    }

    await db.update(jogadores).set(updateData).where(eq(jogadores.id, cleanId));

    return NextResponse.json({
      success: true,
      message: resetPin
        ? "Jogador atualizado e PIN redefinido com sucesso! O jogador já pode cadastrar um novo PIN."
        : "Dados do jogador atualizados com sucesso!",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do jogador é obrigatório" }, { status: 400 });
    }

    await db.delete(jogadores).where(eq(jogadores.id, id));

    return NextResponse.json({ success: true, message: "Jogador excluído com sucesso do banco de dados!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
