const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'ENTERED_WITHOUT_EXIT'`);
    console.log('✅ ENTERED_WITHOUT_EXIT добавлен в RequestStatus');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'INCIDENT'`);
    console.log('✅ INCIDENT добавлен в RequestStatus');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'INCIDENT'`);
    console.log('✅ INCIDENT добавлен в ActionType');
  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();