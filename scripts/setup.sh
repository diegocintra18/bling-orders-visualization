#!/bin/bash
# ===========================================
# BLING ORDERS - SCRIPT DE SETUP
# ===========================================

set -e

echo "🚀 Bling Orders - Setup"
echo "========================"

# Carregar variáveis de ambiente do .env
echo ""
echo "📁 Carregando variáveis de ambiente..."
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "   ✓ Variáveis carregadas"
else
    echo "   ⚠️ Arquivo .env não encontrado"
fi

# 1. Subir MongoDB
echo ""
echo "📦 1. Subindo MongoDB..."
docker-compose up -d

# 2. Aguardar MongoDB
echo ""
echo "⏳ 2. Aguardando MongoDB iniciar..."
sleep 5

# 3. Instalar dependências
echo ""
echo "📥 3. Instalando dependências..."
npm install

# 4. Gerar Prisma Client
echo ""
echo "🔧 4. Gerando Prisma Client..."
npx prisma generate

# 5. Criar banco de dados
echo ""
echo "🗄️  5. Criando banco de dados..."
npx prisma db push

# 6. Seed - Criar usuário admin
echo ""
echo "👤 6. Criando usuário admin..."
npx tsx prisma/seed.ts

echo ""
echo "========================"
echo "✅ Setup concluído!"
echo ""
echo "📝 Dados de acesso:"
echo "   Email: admin@bling.com"
echo "   Senha: admin123"
echo ""
echo "▶️  Execute: npm run dev"
echo "========================"
