import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllJogadores, getAllDecks, getConfigMap, getCalendario } from "@/lib/queries";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel do Organizador | Liga Atlântica TCG",
  description: "Área restrita para gestão de etapas TOM, consolidação de ranking e configurações da Liga.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated") {
    redirect("/login");
  }

  const [jogadores, decks, config, calendar] = await Promise.all([
    getAllJogadores(),
    getAllDecks(),
    getConfigMap(),
    getCalendario(),
  ]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <AdminDashboard
        initialPlayers={jogadores}
        initialDecks={decks}
        initialConfig={config}
        initialCalendar={calendar}
      />
    </div>
  );
}
