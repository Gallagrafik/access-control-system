const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    // Добавляем значение EXPIRE в enum ActionType
    await prisma.$executeRawUnsafe(`ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'EXPIRE'`);
    console.log('✅ Значение EXPIRE добавлено в ActionType');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();