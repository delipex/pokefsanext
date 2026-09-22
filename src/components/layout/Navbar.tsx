"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Trophy, Flame, Calendar, BookOpen, Menu, X, Shield, User } from "lucide-react";
import { PokeballIcon, HeaderLogoSvg } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavbarProps {
  temporada?: number;
  statusTemporada?: string;
}

export function Navbar({ temporada = 5, statusTemporada = "ativa" }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Início", icon: Trophy },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/metagame", label: "Metagame", icon: Flame },
    { href: "/calendario", label: "Calendário", icon: Calendar },
    { href: "/campeoes", label: "Campeões", icon: Shield },
    { href: "/regras", label: "Regras", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl transition-all shadow-lg shadow-black/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo & Marca Oficial */}
        <Link href="/" className="group flex items-center gap-2.5 sm:gap-3">
          <PokeballIcon className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,66,22,0.6)]" />
          <HeaderLogoSvg className="h-6 sm:h-7 w-auto text-white group-hover:text-blue-400 transition-colors" />
        </Link>

        {/* Links de Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/60 p-1 backdrop-blur-md shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Controles da Direita: Botão de Login do Atleta & Alternador de Tema */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Login / Portal do Treinador */}
          <Link
            href="/portal"
            className="flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-blue-300 hover:text-white transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            <User className="h-3.5 w-3.5" />
            <span>Login / Atleta</span>
          </Link>

          <ThemeToggle />

          {/* Botão Menu Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-slate-950/95 px-4 py-4 md:hidden backdrop-blur-2xl">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-white/10 mt-1">
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30"
              >
                <User className="h-4 w-4" />
                <span>Portal do Treinador / Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
