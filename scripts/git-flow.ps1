param (
    [string]$Action = "help",
    [string]$Type = "",
    [string]$Name = ""
)

$ErrorActionPreference = "Stop"

function Show-Header {
    Write-Host "`n=======================================================" -ForegroundColor Cyan
    Write-Host "   Liga Atlantica TCG - Git Flow Profissional         " -ForegroundColor Yellow
    Write-Host "=======================================================`n" -ForegroundColor Cyan
}

function Assert-Git {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git nao esta instalado ou acessivel no PATH."
    }
}

function Get-CurrentBranch {
    return (git branch --show-current).Trim()
}

Show-Header
Assert-Git

$currentBranch = Get-CurrentBranch

switch ($Action.ToLower()) {
    "new" {
        Write-Host "[1/4] Preparando nova branch a partir da main..." -ForegroundColor Cyan
        
        # Garante que a main local esta atualizada se existir remote
        git checkout main 2>$null
        if ($LASTEXITCODE -ne 0) {
            git checkout -b main 2>$null
        }
        
        $hasRemote = (git remote) -contains "origin"
        if ($hasRemote) {
            Write-Host "Sincronizando com a main remota..." -ForegroundColor Gray
            git pull origin main --rebase 2>$null
        }

        # Pergunta Tipo de Branch
        if (-not $Type) {
            Write-Host "`nSelecione o tipo de alteracao:" -ForegroundColor Yellow
            Write-Host "  1) feat  (Nova funcionalidade, tela ou componente)" -ForegroundColor White
            Write-Host "  2) fix   (Correcao de bug ou ajuste visual)" -ForegroundColor White
            Write-Host "  3) chore (Manutencao, dependencias ou configs)" -ForegroundColor White
            $tipoChoice = Read-Host "Digite a opcao (1, 2 ou 3) [Padrao: 1]"
            switch ($tipoChoice) {
                "2" { $Type = "fix" }
                "3" { $Type = "chore" }
                default { $Type = "feat" }
            }
        }

        # Pergunta Nome da Branch
        if (-not $Name) {
            $rawName = Read-Host "`nDigite o nome da branch (ex: novo-modal, fix-banner)"
            if (-not $rawName) {
                $rawName = "update-" + (Get-Date -Format "yyyyMMdd-HHmm")
            }
            # Formata slug simples
            $Name = $rawName.ToLower().Replace(" ", "-").Replace("/", "-")
        }

        $branchName = "$Type/$Name"
        Write-Host "`nCriando e alternando para a branch: $branchName" -ForegroundColor Green
        git checkout -b $branchName

        Write-Host "`n[SUCESSO] Voce esta na branch '$branchName'." -ForegroundColor Green
        Write-Host "Desenvolva suas mudancas normalmente. Quando terminar, rode:" -ForegroundColor Yellow
        Write-Host "  npm run pr:create`n" -ForegroundColor White
    }

    "pr" {
        if ($currentBranch -eq "main" -or $currentBranch -eq "master") {
            Write-Host "`n[AVISO DE SEGURANCA] Voce esta na branch '$currentBranch'!" -ForegroundColor Red
            Write-Host "O fluxo profissional proibe commits diretos na main." -ForegroundColor Yellow
            Write-Host "Para criar uma branch segura, execute:" -ForegroundColor Cyan
            Write-Host "  npm run branch:new`n" -ForegroundColor White
            exit 1
        }

        Write-Host "[1/5] Verificando integridade do projeto (npm run build)..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n[ERRO] O build falhou! Corrija os erros acima antes de subir o PR." -ForegroundColor Red
            exit 1
        }
        Write-Host ">> Build passou com 100% de sucesso!" -ForegroundColor Green

        Write-Host "`n[2/5] Analisando status dos arquivos..." -ForegroundColor Cyan
        git status -s

        Write-Host "`n[3/5] Preparando Commit..." -ForegroundColor Cyan
        $commitMsg = Read-Host "Digite a mensagem do commit [Pressione Enter para padrao]"
        if (-not $commitMsg) {
            $commitMsg = "$currentBranch: atualizacoes e melhorias (" + (Get-Date -Format "dd/MM/yyyy HH:mm") + ")"
        }

        git add .
        git commit -m "$commitMsg"
        if ($LASTEXITCODE -ne 0 -and (git status --porcelain).Length -gt 0) {
            Write-Host "Nada para commitar ou erro no commit." -ForegroundColor Yellow
        }

        Write-Host "`n[4/5] Enviando branch para o GitHub (push)..." -ForegroundColor Cyan
        git push -u origin $currentBranch

        Write-Host "`n[5/5] Abrindo / Atualizando Pull Request..." -ForegroundColor Cyan
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            # Tenta criar PR via GitHub CLI
            gh pr create --base main --head $currentBranch --title "$commitMsg" --body "## Descricao das Alteracoes`n`n- Branch: \`$currentBranch\` `n- Build validado localmente com sucesso.\n- Testes e Preview Vercel vinculados automaticamente." 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "`n>> Pull Request criado com sucesso no GitHub!" -ForegroundColor Green
            } else {
                Write-Host "`n>> Branch enviada! Se o PR ja existe, ele foi atualizado com o novo commit." -ForegroundColor Green
                gh pr view --web 2>$null
            }
        } else {
            Write-Host "`n>> Branch enviada para o GitHub com sucesso!" -ForegroundColor Green
            Write-Host "Acesse o GitHub para revisar e aprovar o Pull Request." -ForegroundColor Yellow
        }

        Write-Host "`n[PRONTO] A Vercel vai gerar a URL de Preview para voce testar no celular." -ForegroundColor Cyan
        Write-Host "Quando estiver tudo 100%, aprove o PR no GitHub ou rode:" -ForegroundColor Yellow
        Write-Host "  npm run pr:merge`n" -ForegroundColor White
    }

    "merge" {
        if ($currentBranch -eq "main" -or $currentBranch -eq "master") {
            Write-Host "Voce ja esta na branch main." -ForegroundColor Yellow
            exit 0
        }

        Write-Host "[1/3] Fazendo Merge seguro do PR para a main via GitHub..." -ForegroundColor Cyan
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            gh pr merge $currentBranch --squash --delete-branch
            if ($LASTEXITCODE -eq 0) {
                Write-Host ">> Merge concluido e branch remota excluida!" -ForegroundColor Green
            }
        } else {
            Write-Host "GitHub CLI nao detectado. Faca o merge pela interface web do GitHub." -ForegroundColor Yellow
        }

        Write-Host "`n[2/3] Retornando e atualizando a main local..." -ForegroundColor Cyan
        git checkout main
        git pull origin main

        Write-Host "`n[3/3] Removendo branch local antiga ($currentBranch)..." -ForegroundColor Cyan
        git branch -D $currentBranch 2>$null

        Write-Host "`n[SUCESSO] Producao (main) atualizada e limpa!`n" -ForegroundColor Green
    }

    "sync" {
        Write-Host "Sincronizando branch atual ($currentBranch) com a main mais recente..." -ForegroundColor Cyan
        git fetch origin main
        git merge origin/main
        Write-Host ">> Sincronizacao concluida!" -ForegroundColor Green
    }

    default {
        Write-Host "Comandos disponiveis:" -ForegroundColor Yellow
        Write-Host "  npm run branch:new   -> Cria uma nova branch a partir da main atualizada" -ForegroundColor White
        Write-Host "  npm run pr:create    -> Testa build, commita, sobe branch e abre Pull Request" -ForegroundColor White
        Write-Host "  npm run pr:merge     -> Realiza o merge seguro para a main e limpa a branch" -ForegroundColor White
        Write-Host "  npm run pr:sync      -> Puxa as novidades da main para a sua branch atual`n" -ForegroundColor White
    }
}
