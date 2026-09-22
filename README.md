# 🏆 Liga Atlântica TCG — Plataforma Oficial (PokéFSANext)

Plataforma moderna, performática e responsiva para gestão e acompanhamento do ranking oficial da **Liga Atlântica TCG (Pokémon TCG)**.

Construído com **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Drizzle ORM** e banco de dados **SQLite / Turso (libSQL)**.

---

## ⚡ Stack Tecnológica

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Components & Server Actions)
- **UI & Interatividade**: [React 19](https://react.dev/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Visualização de Dados**: [Recharts](https://recharts.org/) (Donut Metagame com gradientes SVG de energia Pokémon)
- **Estilização & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) + Glassmorphism Premium + Tokens de Energia Pokémon
- **ORM & Banco de Dados**: [Drizzle ORM](https://orm.drizzle.team/) + SQLite local (`local.db`) / [Turso Cloud](https://turso.tech/) (libSQL serverless)

---

## 📂 Estrutura do Projeto

```text
pokefsanext/
├── src/
│   ├── app/                    # Rotas e APIs (Next.js App Router)
│   │   ├── page.tsx            # Home (Hero Hub, Próximo Evento, Pódio Top 4, Premiações, Metagame)
│   │   ├── ranking/            # Tabela completa de Ranking com Paginação + Seletor de Etapas
│   │   ├── metagame/           # Análise detalhada de Decks, Donut Chart e Carrossel 3D
│   │   ├── calendario/         # Calendário de Etapas e Próximos Torneios
│   │   ├── campeoes/           # Hall da Fama e Galeria de Fotos
│   │   ├── etapas/             # Detalhamento de cada etapa TDF
│   │   ├── regras/             # Regulamento oficial da Liga
│   │   ├── login/              # Página de Autenticação Segura do Organizador
│   │   ├── admin/              # Painel Administrativo de Gestão (TDF, Jogadores, Decks, Calendário, Configs, Fechador)
│   │   └── api/                # API Endpoints (Admin, Auth, Calendário, Fechamento de Temporada)
│   ├── components/             # Componentes Modulares e UI
│   │   ├── admin/              # Dashboard Administrativo com CRUD Completo
│   │   ├── home/               # HeroSeasonHub, NextEventCard
│   │   ├── layout/             # Navbar, Footer, TopBanner
│   │   ├── metagame/           # MetagameDashboard, MetagameChart, DeckCarousel
│   │   ├── ranking/            # RankingTable, PodiumSection, SeasonAwardsSection, PlayerModal
│   │   └── ui/                 # EnergyBadge, ThemeToggle, BrandLogo
│   ├── db/                     # Drizzle Schema, Migrations e Seeders
│   └── lib/                    # Queries SQL Otimizadas, Parser TDF TOM e Tokens de Energia
├── local.db                    # Banco de dados SQLite local
├── drizzle.config.ts           # Configuração de migração do Drizzle
├── .env.example                # Modelo de variáveis de ambiente
└── package.json                # Dependências e scripts
```

---

## 🚀 Como Rodar Localmente

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### 3. Acessar o Painel Administrativo
Acesse [http://localhost:3000/login](http://localhost:3000/login) (PIN padrão: `1234` ou `liga2026`).

---

## ☁️ Como Fazer Deploy no GitHub e na Vercel

### 1. Subir para o seu GitHub
```bash
git add .
git commit -m "feat: release oficial da liga atlantica tcg"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/pokefsa.git
git push -u origin main
```

### 2. Deploy na Vercel com Banco Turso Gratuito
1. Importe o repositório na [Vercel](https://vercel.com).
2. Crie um banco gratuito no [Turso](https://turso.tech) e execute `npm run db:push` e `npm run db:seed`.
3. Nas configurações da Vercel (**Environment Variables**), adicione:
   - `TURSO_DATABASE_URL`: `libsql://sua-liga.turso.io`
   - `TURSO_AUTH_TOKEN`: `seu_token_aqui`
4. Clique em **Deploy**! 🚀

---

## 🔒 Segurança e Privacidade
- **Sessão por Cookie HTTP-Only**: Rotas `/admin` e mutações de banco protegidas por verificação de sessão.
- **IDs e Dados Sensíveis**: POP IDs oficiais ficam acessíveis com segurança e controle administrativo.
