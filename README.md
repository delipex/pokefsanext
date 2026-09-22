# 🏆 Liga Atlântica TCG — Modern Platform (PokéFSANext)

Plataforma moderna, performática e responsiva para gestão e acompanhamento do ranking da **Liga Atlântica TCG (Pokémon TCG)**.

Construído com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM** e banco de dados **SQLite / Turso (libSQL)**.

---

## ⚡ Stack Tecnológica

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Server Actions)
- **UI & Interatividade**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/), [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Visualização de Dados**: [Recharts](https://recharts.org/) (Donut Metagame com gradientes SVG de energia Pokémon)
- **Estilização & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) + Tipografia oficial **Exo 2** (`next/font/google`) + Glassmorphism Premium
- **ORM & Banco de Dados**: [Drizzle ORM](https://orm.drizzle.team/) + SQLite local (`local.db`) / [Turso Cloud](https://turso.tech/) (libSQL serverless)

---

## 📂 Estrutura do Projeto

```text
pokefsanext/
├── src/
│   ├── app/                    # App Router (Rotas e APIs)
│   │   ├── page.tsx            # Home (Próximo Evento, Pódio Top 4, Premiações, Metagame)
│   │   ├── ranking/            # Tabela completa de Ranking + Seletor de Etapas + Scores Antigos
│   │   ├── metagame/           # Análise detalhada de Decks e Distribuição
│   │   ├── calendario/         # Calendário de Etapas e Próximos Torneios
│   │   ├── campeoes/           # Hall da Fama e Campeões Históricos
│   │   ├── etapas/             # Detalhamento de cada etapa TDF
│   │   ├── regras/             # Regulamento oficial da Liga
│   │   ├── admin/              # Painel Administrativo de Gestão
│   │   └── api/                # API Endpoints (Admin, Sincronização, TDFs)
│   ├── components/             # Componentes Modulares
│   │   ├── ui/                 # Navbar, BrandLogo, ThemeToggle, Cards, Modals
│   │   ├── podium/             # Pódio Top 4 com Holographic Foil no 1º lugar
│   │   ├── metagame/           # Donut Chart e Carrossel 3D de Decks
│   │   ├── ranking/            # Tabela Interativa de Classificação
│   │   ├── admin/              # Dashboard de Administração
│   │   └── campeoes/           # Cards e Linha do Tempo dos Campeões
│   ├── db/                     # Drizzle Schema, Migrations e Seeders
│   └── lib/                    # Helpers, Formatters e Configurações
├── local.db                    # Banco de dados SQLite local
└── drizzle.config.ts           # Configuração de migração do Drizzle
```

---

## 🚀 Como Rodar o Projeto

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Configuração do Banco de Dados
O banco SQLite local já vem configurado e pronto para uso:
```bash
# Executar migrações
npm run db:push

# Popular com dados da Temporada Atual (opcional)
npm run db:seed
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 4. Build de Produção
```bash
npm run build
npm run start
```

---

## 🔒 Segurança e Privacidade
- **IDs Ocultos**: IDs de jogador (POP ID) são completamente restritos ao painel `/admin`, não sendo expostos na interface pública do ranking ou dos pódios.
- **Painel Administrativo Isolado**: Rota `/admin` protegida com ações do servidor seguras.

---

## 🎨 Identidade Visual e Features
- **Fonte Oficial**: Tipografia da loja **Exo 2** com suporte a pesos 300 a 900.
- **Modo Escuro / Claro**: Alternância de tema com persistência em `localStorage` e tokens CSS dedicados.
- **Efeitos Visuais**: Glassmorphism (`backdrop-filter: blur`), gradientes temáticos das 10 energias Pokémon e animações fluidas.
