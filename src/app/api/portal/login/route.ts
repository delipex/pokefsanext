import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatePopId, verifyPin, checkRateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: "Muitas tentativas de login. Aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { popId, pin } = body;

    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json({ error: popCheck.error }, { status: 400 });
    }
    const cleanId = popCheck.cleanId!;

    if (!pin) {
      return NextResponse.json({ error: "Informe seu PIN de acesso." }, { status: 400 });
    }

    const player = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);

    if (player.length === 0) {
      return NextResponse.json(
        { error: "POP ID não encontrado. Cadastre-se na aba de primeiro acesso." },
        { status: 404 }
      );
    }

    const athlete = player[0];

    // Se o atleta já jogou mas ainda não criou PIN, orienta criação de primeiro acesso
    if (!athlete.pinHash) {
      return NextResponse.json(
        {
          error: "Você já está na base da Liga, mas ainda não ativou seu PIN pessoal. Clique em 'Primeiro Acesso / Ativar Perfil' para definir seu PIN.",
          needActivation: true,
        },
        { status: 403 }
      );
    }

    const isMatch = verifyPin(String(pin).trim(), athlete.pinHash);
    if (!isMatch) {
      return NextResponse.json({ error: "PIN incorreto. Tente novamente." }, { status: 401 });
    }

    // Define cookie de sessão
    const cookieStore = await cookies();
    cookieStore.set("player_session", cleanId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return NextResponse.json({
      success: true,
      message: `Bem-vindo de volta, ${athlete.nome}!`,
      player: {
        id: athlete.id,
        nome: athlete.nome,
        categoria: athlete.categoria,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
