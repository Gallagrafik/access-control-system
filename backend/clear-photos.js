const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      archivePhotoUrl: {
        not: null
      }
    },
    data: {
      archivePhotoUrl: null
    }
  });
  
  console.log(`✅ Очищено ${result.count} записей`);
  
  const users = await prisma.user.findMany();
  console.log('📋 Пользователи:');
  users.forEach(u => {
    console.log(`   ${u.fullName}: ${u.archivePhotoUrl || 'null'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());