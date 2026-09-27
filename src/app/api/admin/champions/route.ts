import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { campeoes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

async function syncCampeoesJson() {
  try {
    const list = await db.select().from(campeoes);
    const map = new Map<string, any>();
    for (const c of list) {
      const key = String(c.temporada || "").trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, c);
      }
    }
    const deduplicated = Array.from(map.values());
    const sorted = deduplicated.sort((a, b) =>
      (b.temporada || "").localeCompare(a.temporada || "", undefined, { numeric: true })
    );

    const mapped = sorted.map((c) => ({
      Temporada: c.temporada,
      Campeao: c.campeao,
      Vice: c.vice,
      DeckCampeao: c.deckCampeao,
      Data: c.data,
      FotoCampeao: c.fotoCampeao || "",
      URLDeck: c.urlDeck || "",
      ImagemDeck: c.imagemDeck || "",
      ObservacaoDeck: c.observacaoDeck || "",
    }));

    const p1 = path.join(process.cwd(), "src", "data", "campeoes.json");
    fs.writeFileSync(p1, JSON.stringify(mapped, null, 4), "utf-8");

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "campeoes.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(mapped, null, 4), "utf-8");
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar campeoes.json:", err);
  }
}

// GET: Listar todos os campeões do Hall da Fama (com deduplicação estrita por temporada)
export async function GET() {
  try {
    const list = await db.select().from(campeoes);
    const map = new Map<string, any>();
    for (const c of list) {
      const key = String(c.temporada || "").trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, c);
      }
    }
    const sorted = Array.from(map.values()).sort((a, b) =>
      (b.temporada || "").localeCompare(a.temporada || "", undefined, { numeric: true })
    );
    return NextResponse.json(sorted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Cadastrar ou atualizar campeão (upsert por temporada)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temporada, campeao, vice, deckCampeao, data, fotoCampeao, urlDeck, imagemDeck, observacaoDeck } = body;

    if (!temporada || !campeao || !deckCampeao) {
      return NextResponse.json({ error: "Temporada, Campeão e Deck do Campeão são obrigatórios." }, { status: 400 });
    }

    const seasonLabel = String(temporada).startsWith("Temporada #")
      ? String(temporada).trim()
      : `Temporada #${String(temporada).trim()}`;

    const existing = await db
      .select()
      .from(campeoes)
      .where(eq(campeoes.temporada, seasonLabel));

    let finalItem: any;

    if (existing && existing.length > 0) {
      const [updated] = await db
        .update(campeoes)
        .set({
          campeao: String(campeao).trim(),
          vice: String(vice || "A definir").trim(),
          deckCampeao: String(deckCampeao).trim(),
          data: String(data || new Date().toISOString().split("T")[0]).trim(),
          fotoCampeao: fotoCampeao ? String(fotoCampeao).trim() : null,
          urlDeck: urlDeck ? String(urlDeck).trim() : null,
          imagemDeck: imagemDeck ? String(imagemDeck).trim() : null,
          observacaoDeck: observacaoDeck ? String(observacaoDeck).trim() : null,
        })
        .where(eq(campeoes.id, existing[0].id))
        .returning();
      finalItem = updated;
    } else {
      const [inserted] = await db
        .insert(campeoes)
        .values({
          temporada: seasonLabel,
          campeao: String(campeao).trim(),
          vice: String(vice || "A definir").trim(),
          deckCampeao: String(deckCampeao).trim(),
          data: String(data || new Date().toISOString().split("T")[0]).trim(),
          fotoCampeao: fotoCampeao ? String(fotoCampeao).trim() : null,
          urlDeck: urlDeck ? String(urlDeck).trim() : null,
          imagemDeck: imagemDeck ? String(imagemDeck).trim() : null,
          observacaoDeck: observacaoDeck ? String(observacaoDeck).trim() : null,
        })
        .returning();
      finalItem = inserted;
    }

    await syncCampeoesJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/campeoes");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Campeão salvo com sucesso no Hall da Fama!", item: finalItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar dados de um campeão existente
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, temporada, campeao, vice, deckCampeao, data, fotoCampeao, urlDeck, imagemDeck, observacaoDeck } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do campeão não informado." }, { status: 400 });
    }

    const seasonLabel = String(temporada).startsWith("Temporada #")
      ? String(temporada).trim()
      : `Temporada #${String(temporada).trim()}`;

    const [updated] = await db
      .update(campeoes)
      .set({
        temporada: seasonLabel,
        campeao: String(campeao).trim(),
        vice: String(vice || "A definir").trim(),
        deckCampeao: String(deckCampeao).trim(),
        data: String(data || "").trim(),
        fotoCampeao: fotoCampeao ? String(fotoCampeao).trim() : null,
        urlDeck: urlDeck ? String(urlDeck).trim() : null,
        imagemDeck: imagemDeck ? String(imagemDeck).trim() : null,
        observacaoDeck: observacaoDeck ? String(observacaoDeck).trim() : null,
      })
      .where(eq(campeoes.id, Number(id)))
      .returning();

    await syncCampeoesJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/campeoes");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Campeão atualizado com sucesso!", item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir campeão do Hall da Fama
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do campeão não informado." }, { status: 400 });
    }

    await db.delete(campeoes).where(eq(campeoes.id, Number(id)));

    await syncCampeoesJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/campeoes");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Campeão excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
