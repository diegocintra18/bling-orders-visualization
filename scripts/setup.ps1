# ===========================================
# BLING ORDERS - SCRIPT DE SETUP (Windows)
# ===========================================

$ErrorActionPreference = "Continue"

Write-Host "🚀 Bling Orders - Setup" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

# Carregar variáveis de ambiente do .env
Write-Host ""
Write-Host "📁 Carregando variáveis de ambiente..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "   ✓ $name" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   ⚠️ Arquivo .env não encontrado" -ForegroundColor Yellow
}

# 1. Subir MongoDB
Write-Host ""
Write-Host "📦 1. Subindo MongoDB..." -ForegroundColor Cyan
docker-compose up -d

# 2. Aguardar MongoDB
Write-Host ""
Write-Host "⏳ 2. Aguardando MongoDB iniciar..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 3. Instalar dependências
Write-Host ""
Write-Host "📥 3. Instalando dependências..." -ForegroundColor Cyan
npm install

# 4. Gerar Prisma Client
Write-Host ""
Write-Host "🔧 4. Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# 5. Criar banco de dados
Write-Host ""
Write-Host "🗄️  5. Criando banco de dados..." -ForegroundColor Cyan
npx prisma db push

# 6. Seed - Criar usuário admin
Write-Host ""
Write-Host "👤 6. Criando usuário admin..." -ForegroundColor Cyan
npx tsx prisma/seed.ts

Write-Host ""
Write-Host "========================" -ForegroundColor Green
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Dados de acesso:" -ForegroundColor Yellow
Write-Host "   Email: admin@bling.com" -ForegroundColor White
Write-Host "   Senha: admin123" -ForegroundColor White
Write-Host ""
Write-Host "▶️  Execute: npm run dev" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Green
