const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAll() {
  console.log('🧹 НАЧИНАЕМ ПОЛНУЮ ОЧИСТКУ...');
  
  try {
    // 1. Удаляем ВСЕ устройства
    console.log('\n📱 Удаляем все устройства...');
    const devicesBefore = await prisma.device.count();
    console.log(`   Было устройств: ${devicesBefore}`);
    
    const deletedDevices = await prisma.device.deleteMany({});
    console.log(`   ✅ Удалено устройств: ${deletedDevices.count}`);
    
    // 2. Удаляем пароли у всех пользователей
    console.log('\n🔐 Удаляем пароли у всех пользователей...');
    
    // Обновляем всех пользователей, убираем passwordHash
    const usersWithPassword = await prisma.user.findMany({
      where: {
        passwordHash: {
          not: null
        }
      }
    });
    
    console.log(`   Пользователей с паролями: ${usersWithPassword.length}`);
    console.log('   Список:', usersWithPassword.map(u => u.fullName));
    
    const updatedUsers = await prisma.user.updateMany({
      where: {
        passwordHash: {
          not: null
        }
      },
      data: {
        passwordHash: null
      }
    });
    
    console.log(`   ✅ Обновлено пользователей: ${updatedUsers.count}`);
    
    // 3. Опционально: удаляем все заявки и логи
    console.log('\n📝 Удаляем все заявки и логи...');
    
    const logsBefore = await prisma.accessLog.count();
    console.log(`   Было логов: ${logsBefore}`);
    const deletedLogs = await prisma.accessLog.deleteMany({});
    console.log(`   ✅ Удалено логов: ${deletedLogs.count}`);
    
    const requestsBefore = await prisma.accessRequest.count();
    console.log(`   Было заявок: ${requestsBefore}`);
    const deletedRequests = await prisma.accessRequest.deleteMany({});
    console.log(`   ✅ Удалено заявок: ${deletedRequests.count}`);
    
    // 4. Финальная проверка
    console.log('\n📊 ФИНАЛЬНОЕ СОСТОЯНИЕ:');
    console.log(`   Устройств: ${await prisma.device.count()}`);
    console.log(`   Пользователей с паролями: ${await prisma.user.count({
      where: { passwordHash: { not: null } }
    })}`);
    console.log(`   Заявок: ${await prisma.accessRequest.count()}`);
    console.log(`   Логов: ${await prisma.accessLog.count()}`);
    
    console.log('\n✅ ПОЛНАЯ ОЧИСТКА ЗАВЕРШЕНА!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAll();