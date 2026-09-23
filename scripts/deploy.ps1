# ==============================================================================
# ⚡ LIGA ATLÂNTICA TCG - SCRIPT OFICIAL DE PUBLICAÇÃO E DEPLOY AUTOMATIZADO ⚡
# ==============================================================================
# Este script realiza a validação pré-deploy, compilação de produção e envio
# para o repositório GitHub, acionando a esteira CI/CD da Vercel.
# ==============================================================================

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🏆 LIGA ATLÂNTICA TCG • PUBLICADOR AUTOMATIZADO DE MUDANÇAS" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Validação Prévia de Integridade & TypeScript
Write-Host "[1/4] 🔍 Validando integridade do código e executando build de teste..." -ForegroundColor White

$buildResult = npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ [ERRO] O build de teste falhou! A subida foi cancelada para evitar bugs em produção." -ForegroundColor Red
    Write-Host "Verifique os erros apontados acima antes de tentar novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ [OK] Código 100% íntegro e compilado com sucesso pelo Turbopack!" -ForegroundColor Green
Write-Host ""

# 2. Verificação de Arquivos Modificados
Write-Host "[2/4] 📂 Analisando arquivos alterados..." -ForegroundColor White
git status -s

$statusOutput = git status --porcelain
if ([string]::IsNullOrWhiteSpace($statusOutput)) {
    Write-Host ""
    Write-Host "ℹ️  Nenhuma alteração pendente detectada no repositório. O site já está atualizado!" -ForegroundColor Cyan
    exit 0
}

Write-Host ""

# 3. Solicitação da Mensagem de Atualização
$defaultMsg = "feat: atualizacoes no ranking, metagame e configuracoes (" + (Get-Date -Format "yyyy-MM-dd HH:mm") + ")"
Write-Host "[3/4] 💬 Descreva o que você alterou (ou pressione ENTER para usar o padrão):" -ForegroundColor White
Write-Host "Padrão: $defaultMsg" -ForegroundColor DarkGray
$customMsg = Read-Host "Mensagem"

if ([string]::IsNullOrWhiteSpace($customMsg)) {
    $commitMsg = $defaultMsg
} else {
    $commitMsg = $customMsg
}

# 4. Commit e Envio para o GitHub / Vercel
Write-Host ""
Write-Host "[4/4] 🚀 Enviando mudanças para o GitHub (Disparando Deploy na Vercel)..." -ForegroundColor White

git add .
git commit -m "$commitMsg"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "  🎉 SUCESSO! MUDANÇAS PUBLICADAS COM SUCESSO!" -ForegroundColor Green
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚡ O que acontece agora:" -ForegroundColor White
    Write-Host "  1. O GitHub recebeu seus arquivos atualizados." -ForegroundColor Gray
    Write-Host "  2. A Vercel detectou o novo commit e está compilando a nova versão em produção." -ForegroundColor Gray
    Write-Host "  3. Em menos de 1 minuto, o site oficial estará no ar com todas as novidades!" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠️  Houve um aviso ou erro durante o git push. Verifique suas credenciais do GitHub." -ForegroundColor Yellow
}
