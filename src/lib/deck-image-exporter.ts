/**
 * Utilitário de geração e download de imagem oficial do Baralho (Canvas PNG)
 * Gera um pôster de decklist em alta resolução com a marca da Liga Atlântica,
 * quantidades, nomes das cartas e detalhes do jogador.
 */

import { ParsedDecklistResult, ParsedCardItem } from "./decklist-parser";

interface DeckImageOptions {
  deckName: string;
  playerName?: string;
  popId?: string;
  protocolo?: string;
  eventName?: string;
  category?: string;
}

export async function generateDecklistImageBlob(
  parsedData: ParsedDecklistResult,
  options: DeckImageOptions
): Promise<Blob | null> {
  if (typeof window === "undefined" || !parsedData || parsedData.allCards.length === 0) {
    return null;
  }

  const {
    deckName = "Deck Pokémon TCG",
    playerName = "Treinador",
    popId = "",
    protocolo = "",
    eventName = "Liga Atlântica TCG",
    category = "Master",
  } = options;

  // Dimensões do Canvas (alta resolução 1200x1600)
  const width = 1200;
  const cardWidth = 140;
  const cardHeight = 196;
  const cols = 7;
  const gap = 16;
  const padding = 36;

  const totalCardsCount = parsedData.totalCards;
  const pokeCount = parsedData.pokemon.reduce((s, c) => s + c.count, 0);
  const trainerCount = parsedData.trainer.reduce((s, c) => s + c.count, 0);
  const energyCount = parsedData.energy.reduce((s, c) => s + c.count, 0);

  // Calcula altura necessária
  const headerHeight = 160;
  const footerHeight = 80;
  
  // Agrupamentos
  const allGroups = [
    { title: `POKÉMON (${pokeCount})`, color: "#F59E0B", items: parsedData.pokemon },
    { title: `TREINADORES (${trainerCount})`, color: "#3B82F6", items: parsedData.trainer },
    { title: `ENERGIAS (${energyCount})`, color: "#10B981", items: parsedData.energy },
  ].filter((g) => g.items.length > 0);

  // Estimativa de linhas de cada grupo
  let calculatedHeight = headerHeight + footerHeight;
  for (const group of allGroups) {
    const rows = Math.ceil(group.items.length / cols);
    calculatedHeight += 40 + rows * (cardHeight + gap) + 24;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.max(1400, calculatedHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Fundo Gradiente Dark Premium
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#090d16");
  bgGrad.addColorStop(0.5, "#0d1322");
  bgGrad.addColorStop(1, "#050811");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, canvas.height);

  // Efeito de brilho estético no fundo
  const radial = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 800);
  radial.addColorStop(0, "rgba(59, 130, 246, 0.18)");
  radial.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, canvas.height);

  // 2. Borda externa decorativa
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, canvas.height - 32);

  // 3. Cabeçalho Oficial
  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 14px sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText("LIGA ATLÂNTICA TCG • DECKLIST OFICIAL", padding, padding + 20);

  // Nome do Deck
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 36px sans-serif";
  ctx.letterSpacing = "0px";
  ctx.fillText(deckName, padding, padding + 65);

  // Metadados do Atleta & Evento
  ctx.fillStyle = "#94A3B8";
  ctx.font = "500 16px sans-serif";
  const playerLine = `Competidor: ${playerName} ${popId ? `(POP: ${popId})` : ""} • ${category} • ${totalCardsCount}/60 Cartas`;
  ctx.fillText(playerLine, padding, padding + 95);

  if (eventName || protocolo) {
    ctx.fillStyle = "#64748B";
    ctx.font = "500 14px sans-serif";
    ctx.fillText(`Evento: ${eventName} ${protocolo ? `• Protocolo: #${protocolo}` : ""}`, padding, padding + 120);
  }

  // Linha divisória do header
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, headerHeight);
  ctx.lineTo(width - padding, headerHeight);
  ctx.stroke();

  // Helper para carregar imagens com fallback
  const loadImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  // Carrega todas as imagens em paralelo com limite de tempo
  const imageMap = new Map<string, HTMLImageElement | null>();
  const imagePromises = parsedData.allCards.map(async (c) => {
    const key = `${c.set}_${c.number}`;
    if (!imageMap.has(key)) {
      const img = await loadImage(c.imageUrl);
      imageMap.set(key, img);
    }
  });

  await Promise.race([
    Promise.all(imagePromises),
    new Promise((r) => setTimeout(r, 4000)), // timeout de segurança 4s
  ]);

  // 4. Renderiza Grupos e Cartas
  let currentY = headerHeight + 24;

  for (const group of allGroups) {
    // Título do Grupo
    ctx.fillStyle = group.color;
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(group.title, padding, currentY + 14);
    currentY += 28;

    let colIndex = 0;
    let rowStartY = currentY;

    for (let i = 0; i < group.items.length; i++) {
      const card = group.items[i];
      const posX = padding + colIndex * (cardWidth + gap);
      const posY = currentY;

      const img = imageMap.get(`${card.set}_${card.number}`);

      // Fundo do Card
      ctx.fillStyle = "#111827";
      ctx.fillRect(posX, posY, cardWidth, cardHeight);

      if (img) {
        ctx.drawImage(img, posX, posY, cardWidth, cardHeight);
      } else {
        // Fallback estilizado para carta sem foto
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(posX, posY, cardWidth, cardHeight);
        ctx.fillStyle = "#94A3B8";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(card.name.slice(0, 18), posX + cardWidth / 2, posY + cardHeight / 2);
        ctx.font = "10px sans-serif";
        ctx.fillText(`${card.set} ${card.number}`, posX + cardWidth / 2, posY + cardHeight / 2 + 18);
        ctx.textAlign = "left";
      }

      // Borda da carta
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(posX, posY, cardWidth, cardHeight);

      // Badge de Quantidade (Ex: 4x)
      ctx.fillStyle = "rgba(10, 15, 30, 0.92)";
      ctx.fillRect(posX + 4, posY + 4, 30, 22);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(posX + 4, posY + 4, 30, 22);

      ctx.fillStyle = "#FDE68A";
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${card.count}x`, posX + 19, posY + 20);
      ctx.textAlign = "left";

      // Tag do Set
      ctx.fillStyle = "rgba(10, 15, 30, 0.85)";
      ctx.fillRect(posX + cardWidth - 36, posY + 4, 32, 16);
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(card.set, posX + cardWidth - 20, posY + 15);
      ctx.textAlign = "left";

      colIndex++;
      if (colIndex >= cols || i === group.items.length - 1) {
        colIndex = 0;
        currentY += cardHeight + gap;
      }
    }

    currentY += 16;
  }

  // 5. Rodapé Oficial com Verificação
  ctx.fillStyle = "#64748B";
  ctx.font = "500 12px sans-serif";
  ctx.fillText(
    `Gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} • Liga Atlântica TCG • pokefsanext.vercel.app`,
    padding,
    canvas.height - 24
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

/**
 * Dispara o download direto do arquivo PNG no dispositivo
 */
export async function downloadDecklistImage(
  parsedData: ParsedDecklistResult,
  options: DeckImageOptions
): Promise<boolean> {
  try {
    const blob = await generateDecklistImageBlob(parsedData, options);
    if (!blob) return false;

    const fileName = `deck-${options.deckName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${options.protocolo || "liga"}.png`;

    // Compartilhamento nativo em celulares (abre WhatsApp direto com a imagem)
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [new File([blob], fileName, { type: "image/png" })] })
    ) {
      try {
        const file = new File([blob], fileName, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `Decklist - ${options.deckName}`,
          text: `Decklist oficial de ${options.playerName} para o torneio da Liga Atlântica.`,
        });
        return true;
      } catch (shareErr) {
        // Usuário cancelou share nativo, faz fallback pro download tradicional
      }
    }

    // Download tradicional via link <a>
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Erro ao baixar imagem do deck:", err);
    return false;
  }
}
