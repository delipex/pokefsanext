import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { scoresAntigos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

async function syncScoresAntigosJson() {
  try {
    const list = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.pos));
    const seen = new Set<string>();
    const deduplicated = [];
    for (const s of list) {
      const key = `${s.temporada || ""}-${s.pos}-${(s.jogador || "").toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(s);
      }
    }
    const mapped = deduplicated.map((s) => ({
      temporada: s.temporada,
      dataFechamento: s.dataFechamento || "",
      pos: s.pos,
      jogador: s.jogador,
      categoria: s.categoria || "ME",
      pontos: s.pontos || "0",
      deck: s.deck || "",
    }));

    const p1 = path.join(process.cwd(), "src", "data", "scores_antigos.json");
    fs.writeFileSync(p1, JSON.stringify(mapped, null, 4), "utf-8");

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "scores_antigos.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(mapped, null, 4), "utf-8");
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar scores_antigos.json:", err);
  }
}

// GET: Listar todos os scores antigos
export async function GET() {
  try {
    const list = await db.select().from(scoresAntigos).orderBy(asc(scoresAntigos.temporada), asc(scoresAntigos.pos));
    const seen = new Set<string>();
    const deduplicated = [];
    for (const s of list) {
      const key = `${s.temporada || ""}-${s.pos}-${(s.jogador || "").toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(s);
      }
    }
    return NextResponse.json(deduplicated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Inserir novo score antigo
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temporada, pos, jogador, categoria, pontos, deck, dataFechamento } = body;

    if (!temporada || !jogador) {
      return NextResponse.json({ error: "Temporada e Jogador são obrigatórios." }, { status: 400 });
    }

    const cleanTemporada = String(temporada).trim();
    const cleanJogador = String(jogador).trim();
    const cleanPos = Number(pos) || 1;

    // Remove existing duplicates for same season and player or pos to maintain integrity
    const existing = await db
      .select({ id: scoresAntigos.id, jogador: scoresAntigos.jogador, pos: scoresAntigos.pos })
      .from(scoresAntigos)
      .where(eq(scoresAntigos.temporada, cleanTemporada));

    const duplicate = existing.find(
      (s) =>
        s.jogador.trim().toLowerCase() === cleanJogador.toLowerCase() ||
        s.pos === cleanPos
    );
    if (duplicate) {
      await db.delete(scoresAntigos).where(eq(scoresAntigos.id, duplicate.id));
    }

    const [inserted] = await db
      .insert(scoresAntigos)
      .values({
        temporada: cleanTemporada,
        pos: cleanPos,
        jogador: cleanJogador,
        categoria: categoria || "ME",
        pontos: String(pontos || "0").trim(),
        deck: String(deck || "").trim(),
        dataFechamento: dataFechamento ? String(dataFechamento).trim() : null,
      })
      .returning();

    await syncScoresAntigosJson();
    clearFileCache();
    try {
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Score histórico cadastrado com sucesso!", item: inserted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualizar score antigo
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, temporada, pos, jogador, categoria, pontos, deck, dataFechamento } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do score não informado." }, { status: 400 });
    }

    const [updated] = await db
      .update(scoresAntigos)
      .set({
        temporada: String(temporada).trim(),
        pos: Number(pos) || 1,
        jogador: String(jogador).trim(),
        categoria: categoria || "ME",
        pontos: String(pontos || "0").trim(),
        deck: String(deck || "").trim(),
        dataFechamento: dataFechamento ? String(dataFechamento).trim() : null,
      })
      .where(eq(scoresAntigos.id, Number(id)))
      .returning();

    await syncScoresAntigosJson();
    clearFileCache();
    try {
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Score histórico atualizado com sucesso!", item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Excluir score antigo
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do score não informado." }, { status: 400 });
    }

    await db.delete(scoresAntigos).where(eq(scoresAntigos.id, Number(id)));

    await syncScoresAntigosJson();
    clearFileCache();
    try {
      revalidatePath("/campeoes");
      revalidatePath("/portal");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Score histórico excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
