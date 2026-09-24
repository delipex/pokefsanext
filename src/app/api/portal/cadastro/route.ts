import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  validatePopId,
  validatePlayerName,
  validateWhatsApp,
  calculatePokemonCategory,
  hashPin,
  checkRateLimit,
  matchPlayerIdentity,
} from "@/lib/security";
import { ensureDatabaseSchema } from "@/db/migrate-auto";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 12, 60000)) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido ao excesso de tentativas em pouco tempo. Por segurança, aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { popId, nome, whatsapp, dataNascimento, pin, cidade, honeypot } = body;

    // 1. Defesa Anti-Bot (Honeypot)
    if (honeypot) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido a restrições automáticas de segurança." },
        { status: 400 }
      );
    }

    // 2. Validação de POP ID
    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível se cadastrar devido a: ${popCheck.error}` },
        { status: 400 }
      );
    }
    const cleanId = popCheck.cleanId!;

    // 3. Validação de Nome Completo
    const nameCheck = validatePlayerName(nome || "");
    if (!nameCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível se cadastrar devido a: ${nameCheck.error}` },
        { status: 400 }
      );
    }
    const cleanName = nameCheck.cleanName!;

    // 4. Validação de WhatsApp
    const phoneCheck = validateWhatsApp(whatsapp || "");
    if (!phoneCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível se cadastrar devido a: ${phoneCheck.error}` },
        { status: 400 }
      );
    }
    const cleanPhone = phoneCheck.cleanPhone!;

    // 5. Validação de Data de Nascimento e Cálculo de Categoria Oficial
    const catCheck = calculatePokemonCategory(dataNascimento || "");
    if (!catCheck.isValid) {
      return NextResponse.json(
        { error: `Não foi possível se cadastrar devido a: ${catCheck.error}` },
        { status: 400 }
      );
    }
    const categoria = catCheck.categoria;

    // 6. Validação de PIN de Acesso
    const cleanPin = String(pin || "").trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 4) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido a: crie um PIN de exatamente 4 dígitos numéricos (Ex: 1234)." },
        { status: 400 }
      );
    }
    const hashedPin = hashPin(cleanPin);

    // Auto-heal / garante tabelas e colunas atualizadas no Turso
    await ensureDatabaseSchema();

    // 7. Persistência Segura no Banco de Dados
    let existingAthlete: any = null;

    try {
      const existing = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
      if (existing.length > 0 && existing[0]) {
        existingAthlete = existing[0];
      }
    } catch (dbErr) {
      console.error("Erro ao consultar jogador no banco:", dbErr);
    }

    // Se o banco ainda não tiver o registro, busca em jogadores.json (dados históricos TOM)
    if (!existingAthlete) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => {
            const jId = String(j.id || j.ID || "").trim();
            const jName = (j.jogador || j.Jogador || j.nome || "").toString().toLowerCase().trim();
            return (jId && jId === cleanId) || (jName && jName === cleanName.toLowerCase().trim());
          });
          if (found) {
            const foundNome = found.jogador || found.Jogador || found.nome || cleanName;
            existingAthlete = {
              id: String(found.id || found.ID || cleanId).trim(),
              nome: foundNome,
              categoria: found.categoria || found.Categoria || categoria || "Master",
              pinHash: null,
            };
          }
        }
      } catch {}
    }

    if (existingAthlete) {
      // Se o atleta já tiver PIN ativo, orienta login
      if (existingAthlete.pinHash) {
        return NextResponse.json(
          {
            error: "Não foi possível se cadastrar devido a: este POP ID já possui um PIN ativo. Acesse a aba 'Já sou Cadastrado' para entrar ou contate a organização da Liga para redefinir.",
          },
          { status: 403 }
        );
      }

      // Validação de Identidade do Atleta (Fuzzy Matching) se houver nome cadastrado
      if (existingAthlete.nome) {
        const identityCheck = matchPlayerIdentity(cleanName, existingAthlete.nome);
        if (!identityCheck.isMatch) {
          return NextResponse.json(
            {
              error: `Não foi possível se cadastrar devido a: o nome informado (${cleanName}) não confere com o titular cadastrado para este POP ID (${existingAthlete.nome}). Verifique a digitação ou contate o organizador.`,
            },
            { status: 403 }
          );
        }
      }

      // Jogador validado: ativação de perfil
      try {
        await db
          .insert(jogadores)
          .values({
            id: cleanId,
            nome: cleanName,
            categoria,
            whatsapp: cleanPhone,
            dataNascimento,
            cidade: cidade || "Feira de Santana - BA",
            pinHash: hashedPin,
            status: "ativo",
            ativo: true,
          })
          .onConflictDoUpdate({
            target: jogadores.id,
            set: {
              nome: cleanName,
              categoria,
              whatsapp: cleanPhone,
              dataNascimento,
              cidade: cidade || "Feira de Santana - BA",
              pinHash: hashedPin,
              status: "ativo",
              ativo: true,
            },
          });
      } catch (dbErr) {
        console.error("Erro ao salvar jogador no DB:", dbErr);
      }
    } else {
      // Atleta novo
      try {
        await db.insert(jogadores).values({
          id: cleanId,
          nome: cleanName,
          categoria,
          whatsapp: cleanPhone,
          dataNascimento,
          cidade: cidade || "Feira de Santana - BA",
          pinHash: hashedPin,
          status: "ativo",
          ativo: true,
        });
      } catch (dbErr) {
        console.error("Erro ao inserir novo jogador no DB:", dbErr);
      }
    }

    // 8. Criação de Sessão Segura via Cookie HTTP-only
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
      message: "Cadastro realizado e ativado com sucesso!",
      player: {
        id: cleanId,
        nome: cleanName,
        categoria,
      },
    });
  } catch (error: any) {
    console.error("Erro interno no cadastro:", error);
    return NextResponse.json(
      { error: "Não foi possível se cadastrar devido a uma instabilidade no servidor. Por favor, tente novamente em instantes." },
      { status: 500 }
    );
  }
}
