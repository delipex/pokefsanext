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
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(ip, 20, 60000)) {
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

    // Auto-heal / garante schema do banco pronto
    await ensureDatabaseSchema();

    // 3. Busca se atleta já existe no banco ou em jogadores.json
    let existingAthlete: any = null;

    try {
      const existing = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
      if (existing.length > 0 && existing[0]) {
        existingAthlete = existing[0];
      }
    } catch (dbErr) {
      console.error("Erro ao consultar jogador no banco:", dbErr);
    }

    if (!existingAthlete) {
      try {
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => {
            const jId = String(j.id || j.ID || "").trim();
            return jId && jId === cleanId;
          });
          if (found) {
            existingAthlete = {
              id: String(found.id || found.ID || cleanId).trim(),
              nome: found.jogador || found.Jogador || found.nome,
              categoria: found.categoria || found.Categoria || "Master",
              pinHash: null,
            };
          }
        }
      } catch {}
    }

    // Se já existe com PIN ativo, orienta a fazer login
    if (existingAthlete && existingAthlete.pinHash) {
      return NextResponse.json(
        {
          error: "Não foi possível se cadastrar devido a: este POP ID já possui um PIN cadastrado. Acesse a aba 'Já sou Cadastrado' para entrar ou contate o organizador para redefinir seu PIN.",
        },
        { status: 403 }
      );
    }

    // 4. Validação de Nome Completo
    let cleanName = "";
    if (existingAthlete && existingAthlete.nome && !nome) {
      cleanName = existingAthlete.nome;
    } else {
      const nameCheck = validatePlayerName(nome || (existingAthlete ? existingAthlete.nome : ""));
      if (!nameCheck.isValid) {
        return NextResponse.json(
          { error: `Não foi possível se cadastrar devido a: ${nameCheck.error}` },
          { status: 400 }
        );
      }
      cleanName = nameCheck.cleanName!;
    }

    // Se existe atleta e informou nome diferente, valida compatibilidade
    if (existingAthlete && existingAthlete.nome && cleanName) {
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

    // 5. Validação de WhatsApp (opcional para quem já é atleta da Liga)
    let cleanPhone: string | null = null;
    if (whatsapp && String(whatsapp).trim()) {
      const phoneCheck = validateWhatsApp(whatsapp);
      if (!phoneCheck.isValid) {
        return NextResponse.json(
          { error: `Não foi possível se cadastrar devido a: ${phoneCheck.error}` },
          { status: 400 }
        );
      }
      cleanPhone = phoneCheck.cleanPhone!;
    } else if (!existingAthlete) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido a: WhatsApp com DDD é obrigatório para novos competidores." },
        { status: 400 }
      );
    }

    // 6. Categoria e Nascimento (se já é atleta oficial, preserva categoria cadastrada)
    let categoria = existingAthlete?.categoria || "Master";
    if (dataNascimento && String(dataNascimento).trim()) {
      const catCheck = calculatePokemonCategory(dataNascimento);
      if (catCheck.isValid) {
        categoria = catCheck.categoria;
      } else if (!existingAthlete) {
        return NextResponse.json(
          { error: `Não foi possível se cadastrar devido a: ${catCheck.error}` },
          { status: 400 }
        );
      }
    } else if (!existingAthlete) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido a: Data de nascimento é obrigatória para definir sua categoria oficial (Master, Senior ou Junior)." },
        { status: 400 }
      );
    }

    // 7. Validação de PIN de Acesso (Exatamente 4 dígitos numéricos)
    const cleanPin = String(pin || "").trim().replace(/\D/g, "");
    if (!cleanPin || cleanPin.length !== 4) {
      return NextResponse.json(
        { error: "Não foi possível se cadastrar devido a: crie um PIN de exatamente 4 dígitos numéricos (Ex: 1234)." },
        { status: 400 }
      );
    }
    const hashedPin = hashPin(cleanPin);

    // 8. Persistência Atômica no Banco de Dados
    await db
      .insert(jogadores)
      .values({
        id: cleanId,
        nome: cleanName,
        categoria,
        whatsapp: cleanPhone,
        dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
        cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
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
          dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
          cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
          pinHash: hashedPin,
          status: "ativo",
          ativo: true,
        },
      });

    // 8.1 Sincronização redundante com jogadores.json se o sistema de arquivos for gravável
    try {
      const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
      if (fs.existsSync(filePath)) {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const idx = raw.findIndex((j: any) => String(j.id || j.ID || "").trim() === cleanId);
        const itemToSave = {
          id: cleanId,
          jogador: cleanName,
          categoria,
          whatsapp: cleanPhone,
          dataNascimento: dataNascimento ? String(dataNascimento).trim() : undefined,
          cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
          pinHash: hashedPin,
        };
        if (idx >= 0) {
          raw[idx] = { ...raw[idx], ...itemToSave };
        } else {
          raw.push(itemToSave);
        }
        fs.writeFileSync(filePath, JSON.stringify(raw, null, 4), "utf-8");
      }
    } catch {}

    // 9. Criação de Sessão Segura via Cookie HTTP-only
    const resObj = NextResponse.json({
      success: true,
      message: "Cadastro realizado e ativado com sucesso!",
      player: {
        id: cleanId,
        nome: cleanName,
        categoria,
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
    console.error("Erro interno no cadastro:", error);
    return NextResponse.json(
      { error: `Não foi possível se cadastrar devido a: ${error?.message || "instabilidade no servidor. Tente novamente."}` },
      { status: 500 }
    );
  }
}
