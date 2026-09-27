import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { calendario } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clearFileCache } from "@/lib/queries";
import fs from "fs";
import path from "path";

function parseEventSortKey(dateStr: string, timeStr?: string | null): number {
  if (!dateStr) return 0;
  const clean = dateStr.replace(/\//g, "-").trim();
  const parts = clean.split("-");
  let y = 2026, m = 1, d = 1;
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    }
  }
  let hr = 14, min = 0;
  if (timeStr) {
    const tParts = timeStr.trim().split(":");
    hr = parseInt(tParts[0] || "14", 10);
    min = parseInt(tParts[1] || "0", 10);
  }
  return new Date(y, m - 1, d, hr, min).getTime();
}

function toBRDate(dateStr: string): string {
  if (!dateStr) return "";
  const clean = dateStr.replace(/\//g, "-").trim();
  const parts = clean.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    } else {
      return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2]}`;
    }
  }
  return dateStr;
}

async function syncCalendarioJson() {
  try {
    const events = await db.select().from(calendario);
    // Deduplicação estrita antes de sincronizar JSON
    const uniqueMap = new Map<string, any>();
    for (const ev of events) {
      const cleanDate = toBRDate(ev.data);
      const cleanName = (ev.evento || "").trim().toLowerCase();
      const key = `${cleanDate}_${cleanName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ev);
      } else {
        const isConcluded = String(ev.status || "").toLowerCase().includes("conclui");
        if (isConcluded) uniqueMap.set(key, ev);
      }
    }
    const list = Array.from(uniqueMap.values());
    list.sort((a, b) => parseEventSortKey(a.data, a.horario) - parseEventSortKey(b.data, b.horario));
    const mapped = list.map((e) => ({
      data: toBRDate(e.data),
      evento: e.evento,
      local: e.local || "Livraria Atlântica +",
      horario: e.horario || "14:00",
      status: e.status || "confirmado",
      descricao: e.descricao || "",
      linkMaps: e.linkMaps || "",
      linkInscricao: e.linkInscricao || "",
      foto: e.foto || "",
    }));

    const p1 = path.join(process.cwd(), "src", "data", "calendario.json");
    fs.writeFileSync(p1, JSON.stringify(mapped, null, 4), "utf-8");

    const p2 = path.resolve(process.cwd(), "..", "LigaAtlântica", "calendario.json");
    if (fs.existsSync(p2)) {
      try {
        fs.writeFileSync(p2, JSON.stringify(mapped, null, 4), "utf-8");
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar calendario.json:", err);
  }
}

export async function GET() {
  try {
    const events = await db.select().from(calendario);
    const uniqueMap = new Map<string, any>();
    for (const ev of events) {
      const cleanDate = toBRDate(ev.data);
      const cleanName = (ev.evento || "").trim().toLowerCase();
      const key = `${cleanDate}_${cleanName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, ev);
      } else {
        const isConcluded = String(ev.status || "").toLowerCase().includes("conclui");
        if (isConcluded) uniqueMap.set(key, ev);
      }
    }
    const list = Array.from(uniqueMap.values());
    list.sort((a, b) => parseEventSortKey(a.data, a.horario) - parseEventSortKey(b.data, b.horario));
    return NextResponse.json({ success: true, events: list });
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

    const normalizedDate = toBRDate(data);
    const trimmedEvento = String(evento).trim();

    // Checar se já existe evento na mesma data para evitar duplicatas acidentais
    const existing = await db
      .select()
      .from(calendario)
      .where(eq(calendario.data, normalizedDate));

    let finalEvent: any;

    if (existing && existing.length > 0) {
      // Atualiza o existente ao invés de duplicar
      const [updated] = await db
        .update(calendario)
        .set({
          evento: trimmedEvento,
          local: local ? String(local).trim() : "Livraria Atlântica +",
          horario: horario ? String(horario).trim() : "14:00",
          status: status ? String(status).trim() : "confirmado",
          descricao: descricao ? String(descricao).trim() : "",
          linkMaps: linkMaps ? String(linkMaps).trim() : "",
          linkInscricao: linkInscricao ? String(linkInscricao).trim() : "",
          foto: foto ? String(foto).trim() : "",
        })
        .where(eq(calendario.id, existing[0].id))
        .returning();
      finalEvent = updated;
    } else {
      const inserted = await db
        .insert(calendario)
        .values({
          data: normalizedDate,
          evento: trimmedEvento,
          local: local ? String(local).trim() : "Livraria Atlântica +",
          horario: horario ? String(horario).trim() : "14:00",
          status: status ? String(status).trim() : "confirmado",
          descricao: descricao ? String(descricao).trim() : "",
          linkMaps: linkMaps ? String(linkMaps).trim() : "",
          linkInscricao: linkInscricao ? String(linkInscricao).trim() : "",
          foto: foto ? String(foto).trim() : "",
        })
        .returning();
      finalEvent = inserted[0];
    }

    await syncCalendarioJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/calendario");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, event: finalEvent });
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

    const normalizedDate = data ? toBRDate(data) : undefined;

    const updatePayload: Record<string, any> = {};
    if (normalizedDate) updatePayload.data = normalizedDate;
    if (evento !== undefined) updatePayload.evento = String(evento).trim();
    if (local !== undefined) updatePayload.local = String(local).trim() || "Livraria Atlântica +";
    if (horario !== undefined) updatePayload.horario = String(horario).trim() || "14:00";
    if (status !== undefined) updatePayload.status = String(status).trim() || "confirmado";
    if (descricao !== undefined) updatePayload.descricao = String(descricao).trim();
    if (linkMaps !== undefined) updatePayload.linkMaps = String(linkMaps).trim();
    if (linkInscricao !== undefined) updatePayload.linkInscricao = String(linkInscricao).trim();
    if (foto !== undefined) updatePayload.foto = String(foto).trim();

    const updated = await db
      .update(calendario)
      .set(updatePayload)
      .where(eq(calendario.id, Number(id)))
      .returning();

    await syncCalendarioJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/calendario");
      revalidatePath("/admin");
    } catch (e) {}

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

    await syncCalendarioJson();
    clearFileCache();
    try {
      revalidatePath("/");
      revalidatePath("/calendario");
      revalidatePath("/admin");
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Evento excluído com sucesso!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
