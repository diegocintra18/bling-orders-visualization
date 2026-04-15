import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuário de teste...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@bling.com' },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email: 'admin@bling.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
      },
    });
    console.log(`✅ Usuário criado: ${user.email}`);
  } else {
    console.log('ℹ️ Usuário admin@bling.com já existe');
  }

  console.log('   Senha: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
