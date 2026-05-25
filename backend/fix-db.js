const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const prisma = new PrismaClient();

async function fix() {
  try {
    // Выполняем SQL через raw query
    await prisma.$executeRawUnsafe(`ALTER TABLE work_schedule_settings ADD COLUMN IF NOT EXISTS "requestExpiryHours" INTEGER DEFAULT 8`);
    console.log('✅ Колонка requestExpiryHours добавлена');
    
    await prisma.$executeRawUnsafe(`ALTER TABLE work_schedule_settings ADD COLUMN IF NOT EXISTS "checkExpiredAt" TIMESTAMP(3)`);
    console.log('✅ Колонка checkExpiredAt добавлена');
    
    await prisma.$executeRawUnsafe(`UPDATE work_schedule_settings SET "requestExpiryHours" = 8 WHERE "requestExpiryHours" IS NULL`);
    console.log('✅ Значения обновлены');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'EXPIRED'`);
    console.log('✅ Значение EXPIRED добавлено в RequestStatus');
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'EXPIRE'`);
    console.log('✅ Значение EXPIRE добавлено в ActionType');
    
    console.log('🎉 Все изменения успешно применены!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();