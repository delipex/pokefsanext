# 🚀 Guia Oficial de Publicação e Deploy • Liga Atlântica TCG

Este guia documenta o fluxo simplificado e seguro de subida de mudanças, atualizações de ranking, etapas e novas funcionalidades no site oficial.

---

## ⚡ 1. Publicação em 1 Comando (Recomendado)

Sempre que fizer alterações no código, nos arquivos TDF ou em configurações locais, basta abrir o terminal na pasta do projeto e rodar:

```bash
npm run deploy
```

### O que este comando faz automaticamente por você:
1. **Validação Prévia de Build**: Roda `npm run build` com Turbopack e checa o TypeScript. Se houver qualquer erro de digitação ou quebra de tipo, ele cancela a subida na hora para **nunca quebrar o site em produção**.
2. **Resumo de Arquivos**: Mostra a lista exata dos arquivos que foram modificados.
3. **Commit Inteligente**: Pergunta a mensagem de atualização (ou gera uma automática com data/hora caso você dê Enter).
4. **Envio para o GitHub & Vercel**: Realiza o `git push origin main`, acionando o build e publicação instantânea na Vercel (geralmente concluído em ~40 segundos).

---

## 🛠️ 2. Fluxo Manual (Caso Queira Fazer Passo a Passo)

Caso prefira executar cada etapa manualmente:

```bash
# 1. Testar se o build compila sem erros
npm run build

# 2. Adicionar as mudanças ao versionamento
git add .

# 3. Criar o commit descritivo
git commit -m "feat: atualizacoes da etapa #5 e novos arquétipos"

# 4. Enviar para o repositório principal
git push origin main
```

---

## 🌐 3. Como a Vercel Funciona em Produção

- **Gatilho Automático**: A Vercel está conectada ao repositório GitHub da Liga.
- **Ambiente Imutável**: A cada push no branch `main`, a Vercel gera uma nova versão em contêiner otimizado, sem downtime (queda de conexão) para os jogadores.
- **Cache Inteligente**: Rotas estáticas e imagens são servidas via CDN global para carregamento ultra-rápido em smartphones.

---

## 🔒 4. Boas Práticas e Regras de Segurança

1. **Nunca force push com `--force`** no branch `main`.
2. **Arquivos Privados / Locais**: `.agents/`, `docs/`, `scripts/` e notas de organização estão protegidos no `.gitignore` e não são expostos publicamente.
3. **Painel do Organizador (`/admin`)**: O painel já grava as etapas e configurações diretamente no banco de dados ativo.
