import Link from "next/link";
import { FooterLogoSvg } from "@/components/ui/BrandLogo";

interface FooterProps {
  linkWhatsApp?: string;
  linkInstagram?: string;
}

export function Footer({
  linkWhatsApp = "https://chat.whatsapp.com/EpUEb62hq1bKs6iDtQ3ena",
  linkInstagram = "https://www.instagram.com/atlanticamais/",
}: FooterProps) {
  return (
    <footer className="w-full border-t border-white/5 bg-slate-950/60 backdrop-blur-xl mt-14 sm:mt-18 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/5">
          {/* Logo e identificação discreta */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <FooterLogoSvg className="h-7 w-auto text-slate-300/80 hover:text-white transition-colors" />
            <span className="hidden sm:inline-block text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Circuito Competitivo Pokémon TCG • Feira de Santana
            </span>
          </div>

          {/* Links de Navegação Discretos */}
          <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center text-xs font-medium text-slate-400">
            <Link href="/ranking" className="hover:text-slate-200 transition-colors">
              Ranking
            </Link>
            <Link href="/metagame" className="hover:text-slate-200 transition-colors">
              Metagame
            </Link>
            <Link href="/calendario" className="hover:text-slate-200 transition-colors">
              Calendário
            </Link>
            <Link href="/campeoes" className="hover:text-slate-200 transition-colors">
              Campeões
            </Link>
            <Link href="/regras" className="hover:text-slate-200 transition-colors">
              Regras
            </Link>
          </nav>

          {/* Redes Sociais Discretas */}
          <div className="flex items-center gap-2">
            {linkWhatsApp && (
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="WhatsApp da Liga"
              >
                <svg className="w-3.5 h-3.5 fill-current text-emerald-400/80" viewBox="0 0 32 32">
                  <path d="M16.03 3C8.86 3 3.04 8.82 3.04 15.99c0 2.29.6 4.52 1.74 6.49L3 29l6.68-1.75a12.92 12.92 0 0 0 6.35 1.64h.01c7.16 0 12.98-5.82 12.98-12.99C29.02 8.82 23.2 3 16.03 3Zm0 23.69h-.01c-1.9 0-3.76-.51-5.38-1.47l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.71 10.71 0 0 1-1.65-5.78c0-5.84 4.75-10.59 10.59-10.59 2.83 0 5.49 1.1 7.49 3.1a10.53 10.53 0 0 1 3.1 7.49c0 5.84-4.75 10.7-10.6 10.7Zm5.81-7.93c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.53-.72-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
                </svg>
                WhatsApp
              </a>
            )}
            {linkInstagram && (
              <a
                href={linkInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Instagram da Atlântica"
              >
                <svg className="w-3.5 h-3.5 fill-current text-pink-400/80" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
                Instagram
              </a>
            )}
          </div>
        </div>

        {/* Linha inferior de copyright e disclaimer sutil */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Liga Atlântica TCG. Feito para a comunidade de Feira de Santana.</p>
          <p className="text-slate-400">
            Pokémon e Pokémon TCG são marcas registradas da Nintendo / Creatures Inc. / GAME FREAK inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
