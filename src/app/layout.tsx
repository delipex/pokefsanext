import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { TopBanner } from "@/components/layout/TopBanner";
import { Footer } from "@/components/layout/Footer";
import { getConfigMap } from "@/lib/queries";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-exo2",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export const metadata: Metadata = {
  title: "Liga Atlântica TCG | Ranking Oficial Pokémon Feira de Santana",
  description: "Acompanhe o ranking oficial, histórico de etapas, pódios e metagame do Pokémon Trading Card Game em Feira de Santana - BA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getConfigMap();

  return (
    <html lang="pt-BR" className="dark">
      <body className={`${exo2.className} min-h-screen flex flex-col antialiased selection:bg-blue-500 selection:text-white relative font-sans`}>
        {/* Blobs Atmosféricos de Fundo */}
        <div className="bg-blobs" aria-hidden="true">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        <TopBanner
          avisoTopo={config.avisoTopo}
          linkWhatsApp={config.linkWhatsApp}
          ativo={config.exibirBannerAvisoTopo !== "false" && !!config.avisoTopo}
        />
        <Navbar
          temporada={Number(config.temporadaAtual) || 5}
          statusTemporada={config.statusTemporada || "ativa"}
          exibirPortal={config.exibirPortalAtleta !== "false"}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-16 sm:pb-20 lg:pb-24 relative z-10">
          {children}
        </main>
        <Footer
          linkWhatsApp={config.linkWhatsApp}
          linkInstagram={config.linkInstagram}
          linkTwitch={config.linkTwitch}
          linkYouTube={config.linkYouTube}
        />
      </body>
    </html>
  );
}
