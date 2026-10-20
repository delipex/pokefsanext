import { Metadata } from "next";
import { FincRegistrationView } from "./FincRegistrationView";

export const metadata: Metadata = {
  metadataBase: new URL("https://pokefsa.vercel.app"),
  title: "Cronograma Espaço TCG • Arena Geek | FINC 2026",
  description:
    "Confira o cronograma de torneios e oficinas de Pokémon TCG, One Piece e Digimon no Espaço TCG da Arena Geek na FINC 2026 (21 e 22 de Outubro). Entrada exclusiva com pulseira oficial.",
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
    description: "Cronograma oficial dos torneios e oficinas de TCG nos dias 21 e 22 de Outubro. Entrada exclusiva com pulseira retirada na Atlântica Mais até 20/10.",
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
