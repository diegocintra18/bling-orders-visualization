# Bling Orders Dashboard

Sistema de gestão de pedidos do Bling ERP com Next.js.

## 🚀 Funcionalidades

- **Autenticação JWT**: Login e registro de usuários
- **Gestão Multi-Contas**: Conectar múltiplas contas do Bling
- **Listagem de Pedidos**: Filtros por conta, loja, transportadora, status
- **Pedidos Atrasados**: Visualização de pedidos >24h sem conferência
- **Relatórios**: Diário, por loja, por transportadora
- **Webhook**: Receber atualizações em tempo real do Bling
- **Sincronização**: Buscar pedidos da API do Bling

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, registro, refresh
│   │   ├── accounts/      # CRUD de contas Bling
│   │   ├── orders/        # CRUD de pedidos
│   │   ├── reports/       # Relatórios
│   │   └── webhooks/      # Webhook Bling
│   ├── (dashboard)/        # Páginas autenticadas
│   └── login/             # Página de login
├── lib/
│   ├── prisma.ts          # Cliente Prisma
│   ├── auth.ts            # Utilitários JWT
│   ├── authGuard.ts       # Middleware de auth
│   ├── bling.ts           # Cliente Bling API
│   └── crypto.ts          # Criptografia AES-GCM
└── prisma/
    └── schema.prisma      # Schema do banco
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` com:

```env
DATABASE_URL="mongodb+srv://usuario:senha@cluster.mongodb.net/bling-orders?retryWrites=true&w=majority"
JWT_SECRET="seu-jwt-secret-muito-seguro-aqui-32chars"
JWT_REFRESH_SECRET="seu-refresh-secret-muito-seguro-aqui-32chars"
ENCRYPTION_KEY="32byteshexkeyparacriptografia123"
```

### 2. Gerar chave de criptografia

```bash
openssl rand -hex 32
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Gerar Prisma Client

```bash
npx prisma generate
```

### 5. Criar collections no MongoDB

```bash
npx prisma db push
```

## 🏃 Executar

```bash
npm run dev
```

Acesse http://localhost:3000

## 📡 Webhook Bling

Configure no painel do Bling a URL do webhook:

```
https://seu-dominio.com/api/webhooks/bling/{account_id}
```

## 🔐 Segurança

- Tokens JWT com expiração (15min access, 7d refresh)
- API Keys do Bling criptografadas com AES-256-GCM
- Refresh tokens em httpOnly cookies
- Validação de webhook por assinatura HMAC
