import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores, jogadorDecklists } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { validatePopId, verifyPin, checkRateLimit } from "@/lib/security";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { formatDateToBR, calculatePokemonAgeCategory } from "@/lib/tournament-utils";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { error: "Muitas tentativas em pouco tempo. Aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { popId, pin } = body;

    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json(
        { error: popCheck.error || "Informe um POP ID válido." },
        { status: 400 }
      );
    }
    const cleanId = popCheck.cleanId!;

    await ensureDatabaseSchema();

    // 1. Busca atleta na tabela de jogadores
    let athlete: any = null;
    try {
      const rows = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
      if (rows && rows.length > 0) {
        athlete = rows[0];
      }
    } catch {}

    // Fallback: busca em jogadores.json se ainda não estiver no banco
    if (!athlete) {
      try {
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (found) {
            athlete = {
              id: cleanId,
              nome: found.jogador || found.Jogador || found.nome || "Treinador",
              categoria: found.categoria || found.Categoria || "Master",
              pinHash: null,
            };
          }
        }
      } catch {}
    }

    // Fallback adicional: busca última inscrição já feita por esse POP ID
    let lastRegistration: any = null;
    try {
      const regRows = await db
        .select()
        .from(jogadorDecklists)
        .where(eq(jogadorDecklists.jogadorId, cleanId))
        .orderBy(desc(jogadorDecklists.id))
        .limit(1);
      if (regRows && regRows.length > 0) {
        lastRegistration = regRows[0];
      }
    } catch {}

    if (!athlete && !lastRegistration) {
      return NextResponse.json(
        {
          found: false,
          error: "Nenhum cadastro ou histórico encontrado para este POP ID. Preencha seus dados abaixo para se cadastrar.",
        },
        { status: 404 }
      );
    }

    const athleteNome = athlete?.nome || lastRegistration?.jogadorNome || "Treinador";
    const rawBirth = athlete?.dataNascimento || lastRegistration?.dataNascimento || "";
    const formattedBirth = rawBirth ? formatDateToBR(rawBirth) : "";
    const catCheck = formattedBirth ? calculatePokemonAgeCategory(formattedBirth) : null;
    const finalCategory = catCheck?.isValid ? catCheck.categoria : athlete?.categoria || lastRegistration?.categoria || "Master";
    const whatsapp = athlete?.whatsapp || lastRegistration?.whatsapp || "";
    const deckNome = athlete?.deckAtivoNome || lastRegistration?.deckNome || "";

    const hasPin = Boolean(athlete?.pinHash);

    // Se o atleta tem PIN e o PIN foi enviado no request, valida
    if (hasPin) {
      if (!pin) {
        // Retorna que o atleta existe e exige o PIN para preenchimento completo seguro
        return NextResponse.json({
          found: true,
          hasPin: true,
          requirePin: true,
          nome: athleteNome,
          message: `Conta encontrada para ${athleteNome}. Digite seu PIN de 4 dígitos para preencher em 1 clique.`,
        });
      }

      const cleanPin = String(pin).trim().replace(/\D/g, "");
      const isPinOk = verifyPin(cleanPin, athlete.pinHash);
      if (!isPinOk) {
        return NextResponse.json(
          { found: true, hasPin: true, error: "PIN incorreto. Tente novamente ou preencha manualmente." },
          { status: 401 }
        );
      }

      // PIN correto! Registra sessão do atleta em cookie
      try {
        const cookieStore = await cookies();
        cookieStore.set("player_session", cleanId, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 dias
        });
      } catch {}
    }

    // Retorna todos os dados para preenchimento automático em 1 clique
    return NextResponse.json({
      found: true,
      hasPin,
      authenticated: hasPin && Boolean(pin),
      popId: cleanId,
      nome: athleteNome,
      categoria: finalCategory,
      dataNascimento: formattedBirth,
      whatsapp,
      deckNome,
      message: `Dados de ${athleteNome} carregados com sucesso!`,
    });
  } catch (err: any) {
    console.error("Erro na busca rápida de atleta:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar atleta." },
      { status: 500 }
    );
  }
}
