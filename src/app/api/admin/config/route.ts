import { NextResponse } from "next/server";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chave, valor } = body;

    if (!chave) {
      return NextResponse.json({ error: "Chave é obrigatória" }, { status: 400 });
    }

    await db
      .insert(configuracoes)
      .values({
        chave,
        valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
      })
      .onConflictDoUpdate({
        target: configuracoes.chave,
        set: {
          valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
        },
      });

    return NextResponse.json({ success: true, message: "Configuração atualizada com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
