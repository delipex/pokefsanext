import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN é obrigatório" }, { status: 400 });
    }

    const trimmedPin = String(pin).trim();

    // 1. PINs Master / Default
    const masterPins = ["1234", "liga2026", "admin"];

    // 2. Busca PIN do arquivo config.json
    try {
      const configPath = path.join(process.cwd(), "src", "data", "config.json");
      if (fs.existsSync(configPath)) {
        const fileContent = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (fileContent.adminPin) {
          masterPins.push(String(fileContent.adminPin).trim());
        }
      }
    } catch {
      // Ignora erro de leitura de arquivo
    }

    // 3. Busca PIN configurado no banco de dados (se tabela existir)
    try {
      const pinConfig = await db
        .select()
        .from(configuracoes)
        .where(eq(configuracoes.chave, "adminPin"))
        .limit(1);

      if (pinConfig[0]?.valor) {
        masterPins.push(String(pinConfig[0].valor).trim());
      }
    } catch {
      // Falha graciosa se a tabela do banco de dados ainda não foi criada
    }

    if (masterPins.includes(trimmedPin)) {
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
    return NextResponse.json({ error: "Erro ao processar login: " + error.message }, { status: 500 });
  }
}

