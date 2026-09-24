import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatePopId, verifyPin, checkRateLimit } from "@/lib/security";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 12, 60000)) {
      return NextResponse.json(
        { error: "Não foi possível entrar devido a muitas tentativas em pouco tempo. Por segurança, aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { popId, pin } = body;

    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível entrar devido a: ${popCheck.error}` },
        { status: 400 }
      );
    }
    const cleanId = popCheck.cleanId!;

    if (!pin) {
      return NextResponse.json(
        { error: "Não foi possível entrar devido a: informe seu PIN de acesso de 4 a 8 dígitos." },
        { status: 400 }
      );
    }

    // Auto-heal / garante tabelas e colunas atualizadas no Turso
    await ensureDatabaseSchema();

    let player: any[] = [];
    try {
      player = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
    } catch (dbErr: any) {
      console.error("Erro ao buscar jogador no login:", dbErr);
    }

    // Fallback de busca em jogadores.json caso o banco remoto ainda não tenha importado
    if (player.length === 0) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (found) {
            return NextResponse.json(
              {
                error: `Olá, ${found.nome || found.jogador}! Seu POP ID já consta no histórico da Liga, mas ainda não foi ativado com seu PIN pessoal. Clique na aba 'Primeiro Acesso / Novo' para definir seu PIN.`,
                needActivation: true,
              },
              { status: 403 }
            );
          }
        }
      } catch {}

      return NextResponse.json(
        { error: "Não foi possível entrar devido a: POP ID não encontrado. Se é a sua primeira vez na Liga, cadastre-se na aba 'Primeiro Acesso / Novo'." },
        { status: 404 }
      );
    }

    const athlete = player[0];

    // Se o atleta já jogou mas ainda não criou PIN, orienta criação de primeiro acesso
    if (!athlete.pinHash) {
      return NextResponse.json(
        {
          error: `Olá, ${athlete.nome}! Você já está cadastrado na Liga, mas ainda não ativou seu PIN pessoal. Clique na aba 'Primeiro Acesso / Novo' para definir sua senha.`,
          needActivation: true,
        },
        { status: 403 }
      );
    }

    const isMatch = verifyPin(String(pin).trim(), athlete.pinHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Não foi possível entrar devido a: PIN de acesso incorreto. Verifique os números e tente novamente." },
        { status: 401 }
      );
    }

    // Define cookie de sessão segura
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
    console.error("Erro interno no login:", error);
    return NextResponse.json(
      { error: "Não foi possível entrar devido a uma instabilidade no servidor. Por favor, tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
