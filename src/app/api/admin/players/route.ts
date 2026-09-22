import { NextResponse } from "next/server";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";

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
