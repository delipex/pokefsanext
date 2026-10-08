import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { jogadores, jogadorDecklists } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const popId = cookieStore.get("player_session")?.value;

    if (!popId) {
      return NextResponse.json({ loggedIn: false });
    }

    const cleanId = String(popId).trim();

    // Busca atleta no banco
    let athlete: any = null;
    try {
      const rows = await db.select().from(jogadores).where(eq(jogadores.id, cleanId)).limit(1);
      if (rows && rows.length > 0) {
        athlete = rows[0];
      }
    } catch {}

    // Fallback se não estiver no banco
    if (!athlete) {
      try {
        const filePath = path.join(process.cwd(), "src", "data", "jogadores.json");
        if (fs.existsSync(filePath)) {
          const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          const found = raw.find((j: any) => String(j.id || j.ID || "").trim() === cleanId);
          if (found) {
            athlete = {
              id: cleanId,
              nome: found.jogador || found.Jogador || found.nome || "Treinador",
              categoria: found.categoria || found.Categoria || "Master",
            };
          }
        }
      } catch {}
    }

    if (!athlete) {
      return NextResponse.json({
        loggedIn: true,
        popId: cleanId,
        nome: "Treinador",
        categoria: "Master",
        whatsapp: "",
        dataNascimento: "",
        deckAtivoNome: "",
        decklistTexto: "",
      });
    }

    let decklistTexto = athlete.decklistTexto || "";
    let deckAtivoNome = athlete.deckAtivoNome || "";

    // Se não tiver decklist salvo no registro, busca da última decklist enviada
    if (!decklistTexto) {
      try {
        const dls = await db
          .select()
          .from(jogadorDecklists)
          .where(eq(jogadorDecklists.jogadorId, cleanId))
          .orderBy(desc(jogadorDecklists.createdAt))
          .limit(1);
        if (dls && dls.length > 0) {
          decklistTexto = dls[0].decklistRaw || "";
          if (!deckAtivoNome) {
            deckAtivoNome = dls[0].deckNome || "";
          }
        }
      } catch {}
    }

    return NextResponse.json({
      loggedIn: true,
      popId: athlete.id,
      nome: athlete.nome,
      categoria: athlete.categoria || "Master",
      whatsapp: athlete.whatsapp || "",
      dataNascimento: athlete.dataNascimento || "",
      cidade: athlete.cidade || "",
      deckAtivoNome: deckAtivoNome || "",
      decklistTexto: decklistTexto || "",
    });
  } catch (error) {
    return NextResponse.json({ loggedIn: false });
  }
}

