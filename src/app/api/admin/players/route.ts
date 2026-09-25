import { NextResponse } from "next/server";
import { db } from "@/db";
import { jogadores } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { getAllJogadores } from "@/lib/queries";
import { hashPin } from "@/lib/security";
import fs from "fs";
import path from "path";

// Helper para salvar em jogadores.json quando em ambiente com permissão de escrita
function syncJogadoresJson(fn: (list: any[]) => any[]) {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const updated = fn(raw);
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 4), "utf-8");
    }
  } catch {}
}

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const list = await db.select().from(jogadores).orderBy(asc(jogadores.nome));
    if (list && list.length > 0) {
      return NextResponse.json({ success: true, players: list });
    }
    const fallbackList = await getAllJogadores();
    return NextResponse.json({ success: true, players: fallbackList });
  } catch (error: any) {
    const fallbackList = await getAllJogadores();
    return NextResponse.json({ success: true, players: fallbackList });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { id, nome, categoria, whatsapp, dataNascimento, cidade } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const cleanName = String(nome).trim();
    const validCat = ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master";

    await db
      .insert(jogadores)
      .values({
        id: cleanId,
        nome: cleanName,
        categoria: validCat,
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
        cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
        status: "ativo",
        ativo: true,
      })
      .onConflictDoUpdate({
        target: jogadores.id,
        set: {
          nome: cleanName,
          categoria: validCat,
          whatsapp: whatsapp ? String(whatsapp).trim() : null,
          dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
          cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
          ativo: true,
        },
      });

    syncJogadoresJson((list) => {
      const idx = list.findIndex((j: any) => String(j.id || j.ID || "").trim() === cleanId);
      const item = {
        id: cleanId,
        jogador: cleanName,
        categoria: validCat,
        whatsapp: whatsapp ? String(whatsapp).trim() : undefined,
        dataNascimento: dataNascimento ? String(dataNascimento).trim() : undefined,
        cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
      };
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...item };
      } else {
        list.push(item);
      }
      return list;
    });

    return NextResponse.json({ success: true, message: "Jogador salvo com sucesso no banco de dados!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { id, nome, categoria, whatsapp, dataNascimento, cidade, resetPin, newPin, ativo } = body;

    if (!id || !nome) {
      return NextResponse.json({ error: "ID e Nome são obrigatórios" }, { status: 400 });
    }

    const cleanId = String(id).trim();
    const cleanName = String(nome).trim();
    const validCat = ["Master", "Senior", "Junior"].includes(categoria) ? categoria : "Master";

    const updateData: any = {
      nome: cleanName,
      categoria: validCat,
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      dataNascimento: dataNascimento ? String(dataNascimento).trim() : null,
      cidade: cidade ? String(cidade).trim() : "Feira de Santana - BA",
    };

    if (typeof ativo === "boolean") {
      updateData.ativo = ativo;
    }

    let definedPinHash: string | null = null;
    if (resetPin) {
      updateData.pinHash = null;
    } else if (newPin) {
      const cleanPin = String(newPin).trim().replace(/\D/g, "");
      if (cleanPin.length === 4) {
        definedPinHash = hashPin(cleanPin);
        updateData.pinHash = definedPinHash;
      }
    }

    await db.update(jogadores).set(updateData).where(eq(jogadores.id, cleanId));

    syncJogadoresJson((list) => {
      const idx = list.findIndex((j: any) => String(j.id || j.ID || "").trim() === cleanId);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          jogador: cleanName,
          categoria: validCat,
          whatsapp: whatsapp ? String(whatsapp).trim() : list[idx].whatsapp,
          dataNascimento: dataNascimento ? String(dataNascimento).trim() : list[idx].dataNascimento,
          cidade: cidade ? String(cidade).trim() : list[idx].cidade,
        };
        if (resetPin) {
          list[idx].pinHash = null;
        } else if (definedPinHash) {
          list[idx].pinHash = definedPinHash;
        }
      }
      return list;
    });

    let returnMessage = "Dados do jogador atualizados com sucesso!";
    if (resetPin) {
      returnMessage = "Jogador atualizado e PIN redefinido com sucesso! O jogador já pode cadastrar um novo PIN.";
    } else if (definedPinHash) {
      returnMessage = "PIN do jogador definido com sucesso!";
    }

    return NextResponse.json({
      success: true,
      message: returnMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID do jogador é obrigatório" }, { status: 400 });
    }

    await db.delete(jogadores).where(eq(jogadores.id, id));

    syncJogadoresJson((list) => list.filter((j: any) => String(j.id || j.ID || "").trim() !== id));

    return NextResponse.json({ success: true, message: "Jogador excluído com sucesso do banco de dados!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
