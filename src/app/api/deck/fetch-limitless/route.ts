import { NextResponse } from "next/server";
import { parsePTCGDecklist, formatCardsToPTCGText, ParsedCardItem, getCardImageUrl } from "@/lib/decklist-parser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "Parâmetro 'url' do Limitless é obrigatório." }, { status: 400 });
    }

    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const parsedUrl = new URL(cleanUrl);
    if (!parsedUrl.hostname.includes("limitlesstcg.com")) {
      return NextResponse.json({ error: "A URL informada deve ser do domínio limitlesstcg.com" }, { status: 400 });
    }

    // Se for link de arquétipo genérico (ex: /decks/350), tenta obter uma lista
    let fetchUrl = cleanUrl;
    const isArchetypeOverview = /\/decks\/\d+$/.test(parsedUrl.pathname);

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Não foi possível acessar a página do Limitless (${res.status}).` }, { status: 502 });
    }

    let html = await res.text();

    // Se for página de arquétipo, tenta redirecionar para a primeira lista de deck
    if (isArchetypeOverview) {
      const listMatch = html.match(/href="(\/decks\/list\/[^"]+)"/);
      if (listMatch) {
        const subRes = await fetch(`https://limitlesstcg.com${listMatch[1]}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (subRes.ok) {
          html = await subRes.text();
        }
      }
    }

    // Extrai o Título do Deck / Evento
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let deckTitle = titleMatch ? titleMatch[1].replace(/ – Limitless/gi, "").replace(/ - Deck Overview/gi, "").trim() : "Deck Limitless";
    
    // Tenta limpar títulos longos como "5th Place Deck City League Saitama 05/03"
    const headingMatch = html.match(/<div class="decklist-title">([\s\S]*?)<\/div>/i);
    if (headingMatch) {
      const textOnly = headingMatch[1].replace(/<[^>]+>/g, "").trim();
      if (textOnly && textOnly.length < 50) {
        deckTitle = textOnly;
      }
    }

    // Extrai as cartas via Regex HTML do Limitless
    const cardRegex = /<div class="decklist-card"[^>]*data-set="([^"]+)"[^>]*data-number="([^"]+)"[^>]*>[\s\S]*?<span class="card-count">(\d+)<\/span>[\s\S]*?<span class="card-name">([^<]+)<\/span>/g;

    const cards: ParsedCardItem[] = [];
    let match;
    let totalCount = 0;

    while ((match = cardRegex.exec(html)) !== null) {
      const set = match[1].toUpperCase();
      const number = match[2];
      const count = parseInt(match[3], 10);
      const name = match[4].trim();

      const item: ParsedCardItem = {
        count,
        name,
        set,
        number,
        category: "pokemon",
        imageUrl: getCardImageUrl(set, number),
        fallbackImageUrl: "https://limitless3.nyc3.cdn.digitaloceanspaces.com/limitless/social-preview.png",
      };

      cards.push(item);
      totalCount += count;
    }

    if (cards.length === 0) {
      return NextResponse.json({
        error: "Nenhuma decklist pública com cartas foi encontrada neste link do Limitless.",
      }, { status: 404 });
    }

    // Gera texto PTCG Live
    const rawText = formatCardsToPTCGText(cards);
    const parsedData = parsePTCGDecklist(rawText);

    return NextResponse.json({
      success: true,
      deckTitle,
      totalCards: parsedData.totalCards || totalCount,
      decklistRaw: rawText,
      parsedData,
    });
  } catch (err: any) {
    console.error("Erro ao puxar lista do Limitless:", err);
    return NextResponse.json({ error: err.message || "Erro interno ao processar URL do Limitless." }, { status: 500 });
  }
}
