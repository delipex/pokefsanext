import { Metadata } from "next";
import { FincRegistrationView } from "./FincRegistrationView";

export const metadata: Metadata = {
  metadataBase: new URL("https://pokefsa.vercel.app"),
  title: "Inscrições Espaço TCG • Arena Geek | FINC 2026",
  description:
    "Garanta sua vaga nos torneios e oficinas de Pokémon, Yu-Gi-Oh!, One Piece, Digimon e Riftbound no Espaço TCG da Arena Geek na FINC 2026 (21 e 22 de Outubro).",
  icons: {
    icon: [
      { url: "/finc/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/finc/icon.png",
    apple: [
      { url: "/finc/apple-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Arena Geek • Espaço TCG @ FINC 2026",
    description: "Inscrições abertas para torneios e oficinas de TCG nos dias 21 e 22 de Outubro. Gestão Técnica: Atlântica Mais.",
    images: ["/finc/arena-geek-tcg.png"],
  },
};

export default async function FincPage({
  searchParams,
}: {
  searchParams?: Promise<{ protocolo?: string; preview_closed?: string }>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  return (
    <div className="min-h-screen py-4 sm:py-8">
      <FincRegistrationView
        initialProtocol={resolved?.protocolo}
        previewClosed={resolved?.preview_closed}
      />
    </div>
  );
}
