@echo off
REM ==========================================
REM BLING ORDERS - SCRIPT DE SETUP (Windows)
REM ==========================================

echo.
echo 🚀 Bling Orders - Setup
echo =========================

REM 1. Subir MongoDB
echo.
echo 📦 1. Subindo MongoDB...
docker-compose up -d

REM 2. Aguardar MongoDB
echo.
echo ⏳ 2. Aguardando MongoDB iniciar...
timeout /t 3 /nobreak > nul

REM 3. Instalar dependências
echo.
echo 📥 3. Instalando dependências...
call npm install

REM 4. Gerar Prisma Client
echo.
echo 🔧 4. Gerando Prisma Client...
call npx prisma generate

REM 5. Criar banco de dados
echo.
echo 🗄️  5. Criando banco de dados...
call npx prisma db push

REM 6. Seed - Criar usuário admin
echo.
echo 👤 6. Criando usuário admin...
call npx tsx prisma\seed.ts

echo.
echo =========================
echo ✅ Setup concluído!
echo.
echo 📝 Dados de acesso:
echo    Email: admin@bling.com
echo    Senha: admin123
echo.
echo ▶️  Execute: npm run dev
echo =========================

pause
