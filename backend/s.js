const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCommentColumn() {
  console.log('🔧 Добавляем колонку comment в таблицу access_logs...');
  
  try {
    // Выполняем raw SQL для добавления колонки
    await prisma.$executeRawUnsafe(`
      ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS comment TEXT;
    `);
    
    console.log('✅ Колонка comment успешно добавлена');
    
    // Проверяем результат
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'access_logs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Текущая структура access_logs:');
    console.table(result);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addCommentColumn();