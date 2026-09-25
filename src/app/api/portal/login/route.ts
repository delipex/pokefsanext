import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatePopId, verifyPin, hashPin, checkRateLimit } from "@/lib/security";
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
    const { popId, pin, activate, confirmPin } = body;

    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível entrar devido a: ${popCheck.error}` },
        { status: 400 }
      );
    }
    const cleanId = popCheck.cleanId!;

    const cleanPin = String(pin || "").trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 4) {
      return NextResponse.json(
        { error: "Não foi possível entrar devido a: informe seu PIN de acesso de exatamente 4 dígitos numéricos." },
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

    // Fallback de busca em jogadores.json caso o banco ainda não tenha importado
    if (player.length === 0) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (found) {
            const newPlayer = {
              id: cleanId,
              nome: found.jogador || found.Jogador || found.nome || "Treinador Oficial",
              categoria: found.categoria || found.Categoria || "Master",
              status: "ativo",
              ativo: true,
            };
            await db.insert(jogadores).values(newPlayer).onConflictDoNothing();
            player = [newPlayer];
          }
        }
      } catch {}

      if (player.length === 0) {
        return NextResponse.json(
          { error: "Não foi possível entrar devido a: POP ID não encontrado. Se é a sua primeira vez na Liga, cadastre-se na aba 'Primeiro Acesso / Novo'." },
          { status: 404 }
        );
      }
    }

    const athlete = player[0];

    // MODO DE ATIVAÇÃO DE PRIMEIRO ACESSO
    if (activate) {
      if (confirmPin) {
        const cleanConfirm = String(confirmPin).trim().replace(/\D/g, "");
        if (cleanPin !== cleanConfirm) {
          return NextResponse.json(
            { error: "Os PINs digitados não coincidem. Digite o mesmo PIN de 4 dígitos nos dois campos." },
            { status: 400 }
          );
        }
      }

      if (athlete.pinHash) {
        return NextResponse.json(
          { error: "Este atleta já possui um PIN cadastrado. Acesse normalmente com seu PIN." },
          { status: 400 }
        );
      }

      const hashedPin = hashPin(cleanPin);

      // Salva no banco de dados
      await db
        .update(jogadores)
        .set({ pinHash: hashedPin, status: "ativo", ativo: true })
        .where(eq(jogadores.id, cleanId));

      // Sincroniza em jogadores.json se gravável
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const idx = raw.findIndex((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (idx >= 0) {
            raw[idx] = { ...raw[idx], pinHash: hashedPin };
            fs.writeFileSync(filePath, JSON.stringify(raw, null, 4), "utf-8");
          }
        }
      } catch {}

      // Cria sessão segura de 30 dias
      const resObj = NextResponse.json({
        success: true,
        message: `PIN ativado com sucesso! Bem-vindo(a), ${athlete.nome}!`,
        player: {
          id: athlete.id,
          nome: athlete.nome,
          categoria: athlete.categoria,
        },
      });

      resObj.cookies.set("player_session", cleanId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return resObj;
    }

    // Se o atleta oficial ainda não definiu PIN, retorna instrução com dados completos
    if (!athlete.pinHash) {
      return NextResponse.json({
        needActivation: true,
        popId: cleanId,
        athlete: {
          id: athlete.id,
          nome: athlete.nome,
          categoria: athlete.categoria,
        },
        pinEntered: cleanPin,
        message: `Olá, ${athlete.nome}! Identificamos seu cadastro oficial na Liga. Como este é o seu primeiro acesso ao Portal, confirme seu PIN de 4 dígitos para ativar sua conta e entrar diretamente.`,
      });
    }

    const isMatch = verifyPin(cleanPin, athlete.pinHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Não foi possível entrar devido a: PIN de acesso incorreto. Verifique os números e tente novamente." },
        { status: 401 }
      );
    }

    // Define cookie de sessão segura
    const resObj = NextResponse.json({
      success: true,
      message: `Bem-vindo de volta, ${athlete.nome}!`,
      player: {
        id: athlete.id,
        nome: athlete.nome,
        categoria: athlete.categoria,
      },
    });

    resObj.cookies.set("player_session", cleanId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
    });

    return resObj;
  } catch (error: any) {
    console.error("Erro interno no login:", error);
    return NextResponse.json(
      { error: "Não foi possível entrar devido a uma instabilidade no servidor. Por favor, tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const popId = searchParams.get("popId");

    if (!popId) {
      return NextResponse.json({ exists: false });
    }

    const popCheck = validatePopId(popId);
    if (!popCheck.isValid) {
      return NextResponse.json({ exists: false, error: popCheck.error });
    }
    const cleanId = popCheck.cleanId!;

    await ensureDatabaseSchema();

    let player: any[] = [];
    try {
      player = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
    } catch {}

    if (player.length === 0) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (found) {
            return NextResponse.json({
              exists: true,
              athlete: {
                id: cleanId,
                nome: found.jogador || found.Jogador || found.nome || "Treinador Oficial",
                categoria: found.categoria || found.Categoria || "Master",
                hasPin: Boolean(found.pinHash),
              },
            });
          }
        }
      } catch {}

      return NextResponse.json({ exists: false });
    }

    const athlete = player[0];
    return NextResponse.json({
      exists: true,
      athlete: {
        id: athlete.id,
        nome: athlete.nome,
        categoria: athlete.categoria,
        hasPin: Boolean(athlete.pinHash),
      },
    });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
