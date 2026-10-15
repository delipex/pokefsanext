import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN é obrigatório" }, { status: 400 });
    }

    const trimmedPin = String(pin).trim();

    // 1. PINs Master / Default (fsa2026 é a senha oficial principal)
    const masterPins: string[] = ["fsa2026", "1234", "liga2026", "admin"];

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

    // 3. Busca PIN configurado no banco de dados
    try {
      const { ensureDatabaseSchema } = await import("@/db/migrate-auto");
      await ensureDatabaseSchema();

      const pinConfig = await db
        .select()
        .from(configuracoes)
        .where(eq(configuracoes.chave, "adminPin"))
        .limit(1);

      if (pinConfig[0]?.valor) {
        let val = String(pinConfig[0].valor).trim();
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === "string") val = parsed.trim();
        } catch {}
        if (val) {
          masterPins.push(val);
        }
      }
    } catch (err) {
      console.warn("Aviso ao buscar adminPin no banco de dados:", err);
    }

    // Validação insensível a maiúsculas/minúsculas e sem espaços
    const normalizedPin = trimmedPin.toLowerCase();
    const isAuthorized = masterPins.some((p) => p.toLowerCase().trim() === normalizedPin);

    if (isAuthorized) {
      const isProd = process.env.NODE_ENV === "production";
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      const response = NextResponse.json({ success: true, message: "Autenticado com sucesso!" });
      response.cookies.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({ error: "PIN ou senha administrativa incorreta." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao processar login: " + error.message }, { status: 500 });
  }
}

