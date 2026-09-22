import { getAllJogadores, getAllDecks, getConfigMap } from "@/lib/queries";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel do Organizador | Liga Atlântica TCG",
  description: "Área restrita para gestão de etapas TOM, consolidação de ranking e configurações da Liga.",
};

export default async function AdminPage() {
  const [jogadores, decks, config] = await Promise.all([
    getAllJogadores(),
    getAllDecks(),
    getConfigMap(),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <AdminDashboard
        initialPlayers={jogadores}
        initialDecks={decks}
        initialConfig={config}
      />
    </div>
  );
}
