import Link from "next/link";
import { Trophy, ShieldCheck, Heart } from "lucide-react";
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
    <footer className="w-full border-t border-white/10 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-black backdrop-blur-2xl mt-24 shadow-2xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Coluna 1: Logo Oficial & Descrição */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <FooterLogoSvg className="h-10 sm:h-12 w-auto text-white/90 hover:text-white transition-colors" />
            </div>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              Circuito competitivo oficial de <strong>Pokémon Trading Card Game</strong> em Feira de Santana - BA. 
              Pontuação calculada diretamente via arquivos TOM, ranking unificado, metagame em tempo real e calendário de torneios.
            </p>

            {/* Redes Sociais com Glassmorphism */}
            <div className="flex items-center gap-3 pt-2">
              {linkWhatsApp && (
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  aria-label="Grupo Oficial do WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32">
                    <path d="M16.03 3C8.86 3 3.04 8.82 3.04 15.99c0 2.29.6 4.52 1.74 6.49L3 29l6.68-1.75a12.92 12.92 0 0 0 6.35 1.64h.01c7.16 0 12.98-5.82 12.98-12.99C29.02 8.82 23.2 3 16.03 3Zm0 23.69h-.01c-1.9 0-3.76-.51-5.38-1.47l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.71 10.71 0 0 1-1.65-5.78c0-5.84 4.75-10.59 10.59-10.59 2.83 0 5.49 1.1 7.49 3.1a10.53 10.53 0 0 1 3.1 7.49c0 5.84-4.75 10.7-10.6 10.7Zm5.81-7.93c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.53-.72-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
                  </svg>
                  Grupo do WhatsApp
                </a>
              )}
              {linkInstagram && (
                <a
                  href={linkInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-xs font-bold text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20 transition-all"
                  aria-label="Instagram da Atlântica"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                  Instagram Oficial
                </a>
              )}
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navegação Rápida</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/ranking" className="hover:text-blue-400 transition-colors">
                  Ranking & Etapas
                </Link>
              </li>
              <li>
                <Link href="/metagame" className="hover:text-blue-400 transition-colors">
                  Metagame Analítico
                </Link>
              </li>
              <li>
                <Link href="/calendario" className="hover:text-blue-400 transition-colors">
                  Calendário de Torneios
                </Link>
              </li>
              <li>
                <Link href="/campeoes" className="hover:text-blue-400 transition-colors">
                  Hall da Fama & Galeria
                </Link>
              </li>
              <li>
                <Link href="/regras" className="hover:text-blue-400 transition-colors">
                  Regulamento & Pontuações
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Padrões Competitivos & Marcas */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Padrão Oficial</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                Tournament Operations Manager (TOM)
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
                Formato Standard Play! Pokémon
              </li>
              <li className="text-[11px] text-slate-400 pt-2 leading-relaxed border-t border-white/5">
                Pokémon e Pokémon TCG são marcas registradas da Nintendo / Creatures Inc. / GAME FREAK inc.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Liga Atlântica TCG. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 inline" /> para a comunidade Pokémon TCG Feira de Santana
          </p>
        </div>
      </div>
    </footer>
  );
}
