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

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 12, 60000)) {
      return NextResponse.json(
        { error: "Muitas tentativas em pouco tempo. Por segurança, aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { popId, nome, whatsapp, dataNascimento, pin, cidade, honeypot } = body;

    // 1. Defesa Anti-Bot (Honeypot)
    if (honeypot) {
      return NextResponse.json({ error: "Cadastro rejeitado por segurança." }, { status: 400 });
    }

    // 2. Validação Rigorosa de POP ID
    const popCheck = validatePopId(popId || "");
    if (!popCheck.isValid) {
      return NextResponse.json({ error: popCheck.error }, { status: 400 });
    }
    const cleanId = popCheck.cleanId!;

    // 3. Validação de Nome Completo
    const nameCheck = validatePlayerName(nome || "");
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }
    const cleanName = nameCheck.cleanName!;

    // 4. Validação de WhatsApp
    const phoneCheck = validateWhatsApp(whatsapp || "");
    if (!phoneCheck.isValid) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }
    const cleanPhone = phoneCheck.cleanPhone!;

    // 5. Validação de Data de Nascimento e Cálculo de Categoria Oficial
    const catCheck = calculatePokemonCategory(dataNascimento || "");
    if (!catCheck.isValid) {
      return NextResponse.json({ error: catCheck.error }, { status: 400 });
    }
    const categoria = catCheck.categoria;

    // 6. Validação de PIN de Acesso
    if (!pin || String(pin).trim().length < 4 || String(pin).trim().length > 8) {
      return NextResponse.json(
        { error: "O PIN de acesso deve ter entre 4 e 8 dígitos numéricos." },
        { status: 400 }
      );
    }
    const hashedPin = hashPin(String(pin).trim());

    // 7. Persistência Segura no Banco de Dados
    let existingAthlete: any = null;

    try {
      const existing = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
      if (existing.length > 0) existingAthlete = existing[0];
    } catch {
      // Ignora erro de DB
    }

    // Se o banco ainda não tiver o registro, busca em jogadores.json (dados TOM)
    if (!existingAthlete) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id).trim() === cleanId || String(j.nome).toLowerCase() === cleanName.toLowerCase());
          if (found) {
            existingAthlete = { id: cleanId, nome: found.nome, categoria: found.categoria || "Master", pinHash: null };
          }
        }
      } catch {
        // Ignora erro de leitura
      }
    }

    if (existingAthlete) {
      // Se o atleta já tiver PIN ativo, impede sobrescrita sem redefinição autorizada
      if (existingAthlete.pinHash) {
        return NextResponse.json(
          { error: "Este perfil já foi ativado anteriormente. Faça login com seu PIN ou solicite redefinição à organização da Liga." },
          { status: 403 }
        );
      }

      // Validação de Razoabilidade da Identidade do Atleta (Fuzzy Matching)
      const identityCheck = matchPlayerIdentity(cleanName, existingAthlete.nome);
      if (!identityCheck.isMatch) {
        return NextResponse.json(
          {
            error: `O nome informado não confere com o titular cadastrado para este POP ID (${existingAthlete.nome}). Verifique a digitação ou contate o organizador da Liga.`,
          },
          { status: 403 }
        );
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
        console.warn("Aviso ao salvar jogador no DB:", dbErr);
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
        console.warn("Aviso ao inserir jogador no DB:", dbErr);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
