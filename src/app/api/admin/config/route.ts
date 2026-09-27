import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { getConfigMap, clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

async function syncConfigJson() {
  try {
    const configMap = await getConfigMap();

    const p1 = path.join(process.cwd(), "src", "data", "config.json");
    if (fs.existsSync(p1)) {
      fs.writeFileSync(p1, JSON.stringify(configMap, null, 4), "utf-8");
    }

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "config.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(configMap, null, 4), "utf-8");
      } catch {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar config.json:", err);
  }
  clearFileCache();
}

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const configs = await getConfigMap();
    return NextResponse.json({ success: true, configs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();

    // Se vier um objeto com múltiplas configs: { configs: { chave: valor, ... } }
    if (body.configs && typeof body.configs === "object") {
      const entries = Object.entries(body.configs);
      for (const [chave, valor] of entries) {
        await db
          .insert(configuracoes)
          .values({
            chave,
            valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
          })
          .onConflictDoUpdate({
            target: configuracoes.chave,
            set: {
              valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
            },
          });
      }

      await syncConfigJson();

      revalidatePath("/");
      revalidatePath("/ranking");
      revalidatePath("/metagame");
      revalidatePath("/calendario");
      revalidatePath("/campeoes");
      revalidatePath("/regras");
      revalidatePath("/admin");
      revalidatePath("/portal");

      return NextResponse.json({ success: true, message: "Todas as configurações foram salvas com sucesso!" });
    }

    const { chave, valor } = body;

    if (!chave) {
      return NextResponse.json({ error: "Chave é obrigatória" }, { status: 400 });
    }

    await db
      .insert(configuracoes)
      .values({
        chave,
        valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
      })
      .onConflictDoUpdate({
        target: configuracoes.chave,
        set: {
          valor: typeof valor === "object" ? JSON.stringify(valor) : String(valor),
        },
      });

    await syncConfigJson();

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/calendario");
    revalidatePath("/campeoes");
    revalidatePath("/regras");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({ success: true, message: "Configuração atualizada com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
