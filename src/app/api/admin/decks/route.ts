import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { decks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { clearFileCache } from "@/lib/queries";
import { recalculateRankingConsolidado } from "@/lib/recalculate-ranking";
import fs from "fs";
import path from "path";

async function syncDecksJson() {
  try {
    const allDecks = await db.select().from(decks).orderBy(asc(decks.nome));
    const seen = new Set<string>();
    const deduplicated = [];
    for (const d of allDecks) {
      const key = (d.nome || "").toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        deduplicated.push(d);
      }
    }
    const mapped = deduplicated.map((d) => ({
      deck: d.nome,
      tipoEnergia: d.tipoEnergia || "colorless",
      imagem: d.imagem || null,
      limitless: d.limitless || null,
      icone: d.icone || null,
    }));

    const p1 = path.join(process.cwd(), "src", "data", "decks.json");
    if (fs.existsSync(p1)) {
      fs.writeFileSync(p1, JSON.stringify(mapped, null, 4), "utf-8");
    }

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "decks.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(mapped, null, 4), "utf-8");
      } catch {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar decks.json:", err);
  }
  clearFileCache();
}

export async function GET() {
  try {
    const list = await db.select().from(decks).orderBy(decks.nome);
    const seen = new Set<string>();
    const deduplicated = [];
    for (const d of list) {
      const key = (d.nome || "").toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        deduplicated.push(d);
      }
    }
    return NextResponse.json({ success: true, decks: deduplicated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, tipoEnergia, imagem, limitless, icone } = body;

    if (!nome || !tipoEnergia) {
      return NextResponse.json({ error: "Nome e Tipo de Energia são obrigatórios" }, { status: 400 });
    }

    const cleanNome = String(nome).trim();
    const cleanTipoEnergia = String(tipoEnergia).trim();

    // Check if deck already exists (case-insensitive safe check)
    const allExisting = await db.select().from(decks);
    const existing = allExisting.find(
      (d) => (d.nome || "").toLowerCase().trim() === cleanNome.toLowerCase()
    );

    if (existing) {
      await db
        .update(decks)
        .set({
          nome: cleanNome,
          tipoEnergia: cleanTipoEnergia,
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
          ativo: true,
        })
        .where(eq(decks.id, existing.id));
    } else {
      await db.insert(decks).values({
        nome: cleanNome,
        tipoEnergia: cleanTipoEnergia,
        imagem: imagem || null,
        limitless: limitless || null,
        icone: icone || null,
        ativo: true,
      });
    }

    await syncDecksJson();
    try {
      await recalculateRankingConsolidado();
    } catch {}

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({ success: true, message: "Deck salvo com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, tipoEnergia, imagem, limitless, icone } = body;

    if (!id && !nome) {
      return NextResponse.json({ error: "ID ou Nome do deck é obrigatório" }, { status: 400 });
    }

    if (id) {
      await db
        .update(decks)
        .set({
          nome: String(nome).trim(),
          tipoEnergia: String(tipoEnergia).trim(),
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
        })
        .where(eq(decks.id, Number(id)));
    } else {
      await db
        .update(decks)
        .set({
          tipoEnergia: String(tipoEnergia).trim(),
          imagem: imagem || null,
          limitless: limitless || null,
          icone: icone || null,
        })
        .where(eq(decks.nome, String(nome).trim()));
    }

    await syncDecksJson();
    try {
      await recalculateRankingConsolidado();
    } catch {}

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({ success: true, message: "Deck atualizado com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const nomeParam = searchParams.get("nome");

    if (idParam) {
      await db.delete(decks).where(eq(decks.id, Number(idParam)));
    } else if (nomeParam) {
      await db.delete(decks).where(eq(decks.nome, nomeParam));
    } else {
      return NextResponse.json({ error: "ID ou Nome do deck é obrigatório" }, { status: 400 });
    }

    await syncDecksJson();
    try {
      await recalculateRankingConsolidado();
    } catch {}

    revalidatePath("/");
    revalidatePath("/ranking");
    revalidatePath("/metagame");
    revalidatePath("/admin");
    revalidatePath("/portal");

    return NextResponse.json({ success: true, message: "Deck excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
