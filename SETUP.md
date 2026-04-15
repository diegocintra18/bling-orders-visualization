# 🎯 Setup Rápido

## Opção 1: Script Automatizado (Recomendado)

### Windows
```bash
# Execute no PowerShell
.\scripts\setup.ps1
```

### Linux/Mac
```bash
# Torne executável e execute
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

## Opção 2: Manual

### 1. Subir MongoDB
```bash
docker-compose up -d
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Gerar Prisma
```bash
npx prisma generate
```

### 4. Criar banco
```bash
npx prisma db push
```

### 5. Criar usuário admin
```bash
npm run db:seed
```

### 6. Executar
```bash
npm run dev
```

---

## 🔐 Dados de Login

| Campo | Valor |
|-------|-------|
| Email | `admin@bling.com` |
| Senha | `admin123` |

---

## 📁 Estrutura de Arquivos

```
scripts/
├── setup.sh      # Linux/Mac
├── setup.ps1     # PowerShell
└── setup.bat     # CMD
```

---

## 🛠️ Comandos Úteis

```bash
# Ver banco no Prisma Studio
npm run db:studio

# Resetar banco
npx prisma db push --force-reset

# Recriar usuário admin
npm run db:seed
```
