import { NextResponse } from "next/server";
import { db } from "@/db";
import { calendario } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const events = await db.select().from(calendario).orderBy(desc(calendario.data));
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, evento, local, horario, status, descricao, linkMaps, linkInscricao, foto } = body;

    if (!data || !evento) {
      return NextResponse.json({ error: "Data e Nome do Evento são obrigatórios" }, { status: 400 });
    }

    const inserted = await db
      .insert(calendario)
      .values({
        data,
        evento,
        local: local || "Livraria Atlântica +",
        horario: horario || "14:00",
        status: status || "confirmado",
        descricao: descricao || "",
        linkMaps: linkMaps || "",
        linkInscricao: linkInscricao || "",
        foto: foto || "",
      })
      .returning();

    return NextResponse.json({ success: true, event: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, data, evento, local, horario, status, descricao, linkMaps, linkInscricao, foto } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do evento é obrigatório" }, { status: 400 });
    }

    const updated = await db
      .update(calendario)
      .set({
        data,
        evento,
        local,
        horario,
        status,
        descricao,
        linkMaps,
        linkInscricao,
        foto,
      })
      .where(eq(calendario.id, id))
      .returning();

    return NextResponse.json({ success: true, event: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json({ error: "ID do evento é obrigatório" }, { status: 400 });
    }

    const id = Number(idParam);
    await db.delete(calendario).where(eq(calendario.id, id));

    return NextResponse.json({ success: true, message: "Evento excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
