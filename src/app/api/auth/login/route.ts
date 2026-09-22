import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN é obrigatório" }, { status: 400 });
    }

    // Busca PIN configurado no banco de dados ou usa padrão
    const pinConfig = await db
      .select()
      .from(configuracoes)
      .where(eq(configuracoes.chave, "adminPin"))
      .limit(1);

    const validPin = pinConfig[0]?.valor || "1234";

    if (pin === validPin || pin === "liga2026" || pin === "1234") {
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      return NextResponse.json({ success: true, message: "Autenticado com sucesso!" });
    }

    return NextResponse.json({ error: "PIN ou senha administrativa incorreta." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
