import { Metadata } from "next";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDatabaseSchema } from "@/db/migrate-auto";
import { SeasonFinalBrackets, generateEmptyMasterTop16, generateEmptySeniorJuniorTop8 } from "@/lib/bracket-types";
import { BracketPublicView } from "@/components/bracket/BracketPublicView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finais da Temporada • Chaveamento Top Cut | Liga Atlântica TCG",
  description: "Acompanhe ao vivo o chaveamento oficial da Grande Final da temporada: Top 16 Master e Top 8 Senior/Junior.",
};

async function getInitialBrackets(): Promise<SeasonFinalBrackets> {
  await ensureDatabaseSchema();
  let temporada = 5;
  try {
    const cfg = await db.select().from(configuracoes).where(eq(configuracoes.chave, "temporadaAtual"));
    temporada = Number(cfg[0]?.valor) || 5;
  } catch {}

  try {
    const rows = await db.select().from(configuracoes).where(eq(configuracoes.chave, "season_final_brackets"));
    if (rows && rows.length > 0 && rows[0]?.valor) {
      return JSON.parse(rows[0].valor);
    }
  } catch {}

  return {
    temporada,
    tituloEvento: `Torneio dos Campeões • Finais da Temporada ${temporada}`,
    dataEvento: "A definir",
    localEvento: "Livraria Atlântica +",
    statusGeral: "aguardando",
    master: generateEmptyMasterTop16([]),
    seniorJunior: generateEmptySeniorJuniorTop8([]),
    updatedAt: new Date().toISOString(),
  };
}

export default async function FinalPage() {
  const initialBrackets = await getInitialBrackets();
  let exibirTopCut = false;
  try {
    const cfg = await db.select().from(configuracoes).where(eq(configuracoes.chave, "exibirTopCut"));
    exibirTopCut = cfg[0]?.valor === "true";
  } catch {}

  return (
    <div className="py-2 sm:py-6 max-w-7xl mx-auto px-2 sm:px-4">
      {!exibirTopCut && (
        <div className="mb-6 p-4 rounded-2xl border border-purple-500/30 bg-purple-950/40 backdrop-blur-xl flex items-center gap-3 text-purple-200 text-xs sm:text-sm font-semibold shadow-lg">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span>
            <strong>Chaveamento em Preparação:</strong> O Top Cut ainda não foi ativado no menu principal pela organização.
          </span>
        </div>
      )}
      <BracketPublicView initialBrackets={initialBrackets} />
    </div>
  );
}
