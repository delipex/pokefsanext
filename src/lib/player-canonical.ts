import { db } from "@/db";
import { jogadores } from "@/db/schema";

export interface CanonicalPlayer {
  id: string;
  nome: string;
  categoria: "Master" | "Senior" | "Junior";
  deckAtivoNome?: string | null;
}

/**
 * Carrega e indexa o dicionário canônico de jogadores oficiais da Liga
 */
export async function getCanonicalPlayersMap(): Promise<{
  byId: Map<string, CanonicalPlayer>;
  byNormalizedName: Map<string, CanonicalPlayer>;
}> {
  const byId = new Map<string, CanonicalPlayer>();
  const byNormalizedName = new Map<string, CanonicalPlayer>();

  try {
    const allPlayers = await db.select().from(jogadores);
    for (const p of allPlayers) {
      const cleanId = String(p.id || "").trim();
      const cleanName = String(p.nome || "").trim();
      const normalizedName = cleanName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      const item: CanonicalPlayer = {
        id: cleanId,
        nome: cleanName,
        categoria: (p.categoria as any) || "Master",
        deckAtivoNome: p.deckAtivoNome,
      };

      if (cleanId) byId.set(cleanId, item);

      // Priorizar atleta com POP ID real sobre dummy "sem-id"
      const existing = normalizedName ? byNormalizedName.get(normalizedName) : undefined;
      const shouldSet =
        !existing ||
        (existing.id.startsWith("sem-id") && !cleanId.startsWith("sem-id")) ||
        (!existing.deckAtivoNome && item.deckAtivoNome);

      if (shouldSet) {
        if (normalizedName) byNormalizedName.set(normalizedName, item);
        if (cleanName) byNormalizedName.set(cleanName.toLowerCase().trim(), item);
      }
    }
  } catch (err) {
    console.warn("Aviso ao carregar mapa canônico de jogadores:", err);
  }

  return { byId, byNormalizedName };
}

/**
 * Normaliza o nome e ID de qualquer jogador para a versão oficial registrada
 */
export function resolveCanonicalPlayer(
  raw: { id?: string | null; nome: string; categoria?: string },
  maps: {
    byId: Map<string, CanonicalPlayer>;
    byNormalizedName: Map<string, CanonicalPlayer>;
  }
): { id: string; nome: string; categoria: "Master" | "Senior" | "Junior" } {
  const cleanId = raw.id ? String(raw.id).trim() : "";
  const rawName = String(raw.nome || "").trim();
  const lowerName = rawName.toLowerCase().trim();
  const normName = rawName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. Busca por Nome Normalizado primeiro se o ID recebido for nulo ou temporário ("sem-id")
  if (!cleanId || cleanId.startsWith("sem-id")) {
    const foundByName = maps.byNormalizedName.get(lowerName) || maps.byNormalizedName.get(normName);
    if (foundByName && foundByName.id && !foundByName.id.startsWith("sem-id")) {
      return {
        id: foundByName.id,
        nome: foundByName.nome,
        categoria: (raw.categoria as any) || foundByName.categoria,
      };
    }
  }

  // 2. Busca por POP ID oficial (Chave primária imutável)
  if (cleanId && maps.byId.has(cleanId)) {
    const found = maps.byId.get(cleanId)!;
    return {
      id: cleanId,
      nome: found.nome,
      categoria: (raw.categoria as any) || found.categoria,
    };
  }

  // 3. Busca por Nome Normalizado / Case-Insensitive
  if (maps.byNormalizedName.has(lowerName)) {
    const found = maps.byNormalizedName.get(lowerName)!;
    return {
      id: (found.id && !found.id.startsWith("sem-id")) ? found.id : (cleanId || found.id),
      nome: found.nome,
      categoria: (raw.categoria as any) || found.categoria,
    };
  }

  if (maps.byNormalizedName.has(normName)) {
    const found = maps.byNormalizedName.get(normName)!;
    return {
      id: (found.id && !found.id.startsWith("sem-id")) ? found.id : (cleanId || found.id),
      nome: found.nome,
      categoria: (raw.categoria as any) || found.categoria,
    };
  }

  // Fallback: se não encontrado, mantém com formatação limpa (Title Case)
  return {
    id: cleanId,
    nome: formatTitleCase(rawName),
    categoria: (raw.categoria as any) || "Master",
  };
}

function formatTitleCase(str: string): string {
  if (!str) return "";
  const lowerWords = ["da", "de", "do", "das", "dos", "e"];
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return "";
      if (idx > 0 && lowerWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
