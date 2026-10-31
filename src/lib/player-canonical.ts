import { db } from "@/db";
import { jogadores } from "@/db/schema";
import defaultJogadores from "@/data/jogadores.json";

export interface CanonicalPlayer {
  id: string;
  nome: string;
  categoria: "Master" | "Senior" | "Junior";
  deckAtivoNome?: string | null;
}

export function formatTitleCase(str: string): string {
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

export function formatCanonicalDisplayName(str: string): string {
  if (!str) return "";
  const trimmed = str.trim();
  // Se estiver em ALL-CAPS (ex: "ANDERSON SANTOS" ou "DAVI TELES"), converter para Title Case
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
    return formatTitleCase(trimmed);
  }
  return trimmed;
}

/**
 * Carrega e indexa o dicionário canônico de jogadores oficiais da Liga
 * Prioriza os nomes de comunidade oficiais estabelecidos em jogadores.json (ex: Carlos Morais, Davi Soledade, Cristian S)
 */
export async function getCanonicalPlayersMap(): Promise<{
  byId: Map<string, CanonicalPlayer>;
  byNormalizedName: Map<string, CanonicalPlayer>;
}> {
  const byId = new Map<string, CanonicalPlayer>();
  const byNormalizedName = new Map<string, CanonicalPlayer>();

  const registerName = (name: string, item: CanonicalPlayer, isAlias = false) => {
    if (!name) return;
    const clean = name.trim();
    const lower = clean.toLowerCase();
    const norm = clean
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    const existingLower = byNormalizedName.get(lower);
    const existingNorm = byNormalizedName.get(norm);

    const shouldSetLower =
      !existingLower ||
      (!isAlias && existingLower.id.startsWith("sem-id") && !item.id.startsWith("sem-id")) ||
      (!existingLower.deckAtivoNome && item.deckAtivoNome);

    if (shouldSetLower) {
      byNormalizedName.set(lower, item);
    }

    const shouldSetNorm =
      !existingNorm ||
      (!isAlias && existingNorm.id.startsWith("sem-id") && !item.id.startsWith("sem-id")) ||
      (!existingNorm.deckAtivoNome && item.deckAtivoNome);

    if (shouldSetNorm) {
      byNormalizedName.set(norm, item);
    }
  };

  // 1. Fonte Primária Curada: jogadores.json (Nomes de Comunidade Oficiais da Liga Atlântica)
  if (Array.isArray(defaultJogadores)) {
    for (const j of defaultJogadores as any[]) {
      const cleanId = String(j.id || j.ID || "").trim();
      const rawName = String(j.jogador || j.Jogador || j.nome || "").trim();
      if (!cleanId && !rawName) continue;

      const cleanName = formatCanonicalDisplayName(rawName);
      const cat = ((j.categoria || j.Categoria || "Master") as any) || "Master";

      const item: CanonicalPlayer = {
        id: cleanId,
        nome: cleanName,
        categoria: cat,
      };

      if (cleanId) byId.set(cleanId, item);
      registerName(cleanName, item);
    }
  }

  // 2. Mesclar com a tabela 'jogadores' do banco de dados (novos atletas, deck ativo e apelidos/nomes civis)
  try {
    const allPlayers = await db.select().from(jogadores);
    for (const p of allPlayers) {
      const cleanId = String(p.id || "").trim();
      const dbRawName = String(p.nome || "").trim();
      const dbCleanName = formatCanonicalDisplayName(dbRawName);

      const existingById = cleanId ? byId.get(cleanId) : undefined;

      // Se o jogador já possui nome canônico oficial em jogadores.json, preservamos o nome oficial!
      // Ex: se no banco estiver 'Carlos Henrique Dantas Morais', mantemos 'Carlos Morais'.
      const canonicalName = existingById ? existingById.nome : dbCleanName;
      const canonicalCat = (p.categoria as any) || existingById?.categoria || "Master";

      const item: CanonicalPlayer = {
        id: cleanId || existingById?.id || "",
        nome: canonicalName,
        categoria: canonicalCat,
        deckAtivoNome: p.deckAtivoNome || existingById?.deckAtivoNome,
      };

      if (cleanId) {
        byId.set(cleanId, item);
      }

      // Indexa o nome canônico
      registerName(canonicalName, item);

      // Se o banco continha um nome civil completo diferente (ex: 'Carlos Henrique Dantas Morais'),
      // indexamos como alias secundário para apontar para o atleta oficial
      if (dbCleanName && dbCleanName.toLowerCase() !== canonicalName.toLowerCase()) {
        registerName(dbCleanName, item, true);
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

  // 3. Busca por Nome Normalizado / Case-Insensitive / Aliases
  if (maps.byNormalizedName.has(lowerName)) {
    const found = maps.byNormalizedName.get(lowerName)!;
    return {
      id: found.id && !found.id.startsWith("sem-id") ? found.id : cleanId || found.id,
      nome: found.nome,
      categoria: (raw.categoria as any) || found.categoria,
    };
  }

  if (maps.byNormalizedName.has(normName)) {
    const found = maps.byNormalizedName.get(normName)!;
    return {
      id: found.id && !found.id.startsWith("sem-id") ? found.id : cleanId || found.id,
      nome: found.nome,
      categoria: (raw.categoria as any) || found.categoria,
    };
  }

  // Fallback: se não encontrado, mantém com formatação limpa (Title Case)
  return {
    id: cleanId,
    nome: formatCanonicalDisplayName(rawName),
    categoria: (raw.categoria as any) || "Master",
  };
}
