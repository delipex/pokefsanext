import { NextResponse } from "next/server";
import { db } from "@/db";
import { decks } from "@/db/schema";
import { eq } from "drizzle-orm";

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
