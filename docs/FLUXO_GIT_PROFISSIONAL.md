# 🛡️ Guia Oficial: Fluxo de Trabalho Git & Deploy Profissional
> **Liga Atlântica TCG** | Proteção da Branch `main`, Feature Branches e Deploy Contínuo (Vercel & CI/CD)

---

## 🎯 Por que usar este fluxo?
1. **Blindagem da Produção (`main`)**: Ninguém sobe código quebrado direto no site oficial.
2. **Ambientes de Preview Automáticos**: Ao abrir um Pull Request (PR), a Vercel gera um link exclusivo para você abrir no seu celular e testar antes de publicar para o público.
3. **Qualidade Garantida (GitHub Actions CI)**: O GitHub testa o build e tipos TypeScript antes de liberar o botão de merge.
4. **Comandos com 1 clique**: Não precisa digitar comandos complicados de Git.

---

## 🔄 O Ciclo de Vida de uma Alteração

```text
 1. main (Atualizada)
    │
    ▼ (npm run branch:new)
 2. feat/minha-feature (Desenvolva e teste localmente)
    │
    ▼ (npm run pr:create)
 3. Pull Request no GitHub
    ├──> GitHub Actions roda o Build de Teste
    └──> Vercel cria URL de Preview (Teste no celular)
    │
    ▼ (npm run pr:merge ou aprovar no GitHub)
 4. main (Deploy Oficial para Produção)
```

---

## ⚡ Comandos Rápidos no Terminal

| Comando | O que ele faz | Quando usar |
| :--- | :--- | :--- |
| `npm run branch:new` | Atualiza a `main` e cria uma branch nova (`feat/...` ou `fix/...`) | Ao começar qualquer nova tarefa ou ajuste |
| `npm run pr:create` | Roda `npm run build`, commita, sobe a branch e abre o Pull Request | Quando terminar o desenvolvimento e quiser testar/subir |
| `npm run pr:merge` | Faz o merge seguro no GitHub, deleta a branch temporária e volta para a `main` | Quando você já testou o Preview e quer publicar no site oficial |
| `npm run pr:sync` | Puxa as últimas atualizações da `main` para a sua branch atual | Se a `main` foi atualizada enquanto você trabalhava |

---

## 🛠️ Passo a Passo Prático (Exemplo Real)

### Cenário: Adicionar um novo filtro ou corrigir um visual

#### Passo 1: Criar a Branch
No terminal do projeto, execute:
```bash
npm run branch:new
```
- Escolha o tipo (`1` para `feat`, `2` para `fix`).
- Digite o nome: `ajuste-carrossel`.
- O script criará `feat/ajuste-carrossel` e já trocará para ela.

#### Passo 2: Fazer as alterações no código
Edite os arquivos normalmente e teste no navegador (`npm run dev`).

#### Passo 3: Enviar para Revisão / Preview
Quando terminar, execute:
```bash
npm run pr:create
```
- O script vai rodar o build para checar se há algum erro.
- Vai pedir uma mensagem para o commit.
- Vai enviar para o GitHub e abrir o **Pull Request**.

#### Passo 4: Testar o Preview no Celular
- No GitHub ou na dashboard da Vercel, clique no link de **Preview Deployment**.
- Abra no smartphone, navegue pelo site e valide.

#### Passo 5: Publicar no Site Oficial
Após aprovar, rode no terminal:
```bash
npm run pr:merge
```
- O PR será mesclado na `main`.
- A Vercel atualizará automaticamente o site oficial (`ligaatlantica.com.br`).
- Sua máquina voltará para a `main` limpa e atualizada.

---

## 🔒 Ativação de Regras de Proteção de Branch no GitHub

Para garantir que ninguém cometa commits por engano na `main`:
1. Acesse seu repositório no GitHub: `https://github.com/delipex/pokefsanext/settings/branches`
2. Clique em **Add branch ruleset** ou **Add rule**.
3. Em **Branch name pattern**, digite: `main`.
4. Marque:
   - ✅ **Require a pull request before merging** (Exigir Pull Request)
   - ✅ **Require status checks to pass before merging** (Selecione o check `Build & Typecheck` do GitHub Actions)
   - ✅ **Do not allow bypassing the above settings**
5. Salve as alterações.
