"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Calendar, BookOpen, Menu, X, Shield, User } from "lucide-react";
import { PokeballIcon, HeaderLogoSvg } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface NavbarProps {
  temporada?: number;
  statusTemporada?: string;
  exibirPortal?: boolean;
}

export function Navbar({ temporada = 5, statusTemporada = "ativa", exibirPortal = true }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedInAthlete, setLoggedInAthlete] = useState<{ popId: string; nome: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/portal/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.loggedIn && data?.popId) {
          setLoggedInAthlete({ popId: data.popId, nome: data.nome });
        } else if (isMounted && !data?.loggedIn) {
          setLoggedInAthlete(null);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Início", icon: null },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/metagame", label: "Metagame", icon: Flame },
    { href: "/calendario", label: "Calendário", icon: Calendar },
    { href: "/campeoes", label: "Campeões", icon: Shield },
    { href: "/regras", label: "Regras", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#090e1a]/85 backdrop-blur-2xl transition-all shadow-xl shadow-black/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        {/* Logo & Marca Oficial Ampliada com Alto Contraste, Glow e Spring Press */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Link href="/" className="group flex items-center gap-3 sm:gap-3.5">
            <PokeballIcon className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 drop-shadow-[0_0_12px_rgba(255,66,22,0.55)] transition-transform group-hover:rotate-45" />
            <HeaderLogoSvg className="h-7 sm:h-8 lg:h-9 w-auto text-white group-hover:text-amber-400 transition-colors drop-shadow-md" />
          </Link>
        </motion.div>

        {/* Links de Navegação Desktop em Pílula Centralizada com Efeito iOS Sliding Pill */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/[0.06] bg-[#0f172a]/70 p-1.5 backdrop-blur-xl shadow-inner relative">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold tracking-tight transition-colors duration-200"
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-full bg-blue-600 shadow-md shadow-blue-600/40"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 ${
                    isActive ? "text-white font-bold" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Controles da Direita: Botão de Login do Atleta & Alternador de Tema */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Botão de Login do Atleta / Perfil com Feedback iOS */}
          {exibirPortal && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
              <Link
                href="/portal"
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer ${
                  loggedInAthlete
                    ? "border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 shadow-emerald-500/20"
                    : "border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600 hover:border-blue-500 text-blue-300 hover:text-white shadow-blue-600/20"
                }`}
                title={loggedInAthlete ? `Conectado como ${loggedInAthlete.nome}` : "Entrar no Portal do Treinador"}
              >
                {loggedInAthlete ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-mono tracking-tight">ID: {loggedInAthlete.popId}</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span>Login</span>
                  </>
                )}
              </Link>
            </motion.div>
          )}

          <ThemeToggle />

          {/* Botão Menu Mobile */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>
      </div>

      {/* Menu Mobile Drawer com Animação iOS Spring */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="overflow-hidden border-b border-white/10 bg-[#090e1a]/95 px-5 py-5 lg:hidden backdrop-blur-2xl shadow-2xl"
          >
            <div className="flex flex-col gap-2.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span>{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {exibirPortal && (
                <div className="pt-3 border-t border-white/10 mt-1">
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Link
                      href="/portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold shadow-lg ${
                        loggedInAthlete
                          ? "bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 shadow-emerald-600/20"
                          : "bg-blue-600 text-white shadow-blue-600/30"
                      }`}
                    >
                      {loggedInAthlete ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span>Meu Perfil (ID: {loggedInAthlete.popId})</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4" />
                          <span>Login</span>
                        </>
                      )}
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
