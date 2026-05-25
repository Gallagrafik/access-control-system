import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpiredService {
  private readonly logger = new Logger(ExpiredService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Проверяем каждую минуту
  @Cron('*/1 * * * *')
  async markExpiredRequests() {
    this.logger.log('Проверка просроченных заявок...');

    try {
      const now = new Date();
      const currentDay = now.getDay();

      // Получаем настройки для сегодняшнего дня
      const settings = await this.prisma.workScheduleSetting.findUnique({
        where: { dayOfWeek: currentDay }
      });

      if (!settings) {
        this.logger.log('Настройки для сегодняшнего дня не найдены');
        return;
      }

      const expiryHours = settings.requestExpiryHours || 8;
      const [endHour, endMinute] = settings.endTime.split(':').map(Number);

      // Время окончания смены сегодня
      const workEndTime = new Date();
      workEndTime.setHours(endHour, endMinute, 0, 0);

      // Время, старше которого заявки считаются просроченными по часам
      const expiryTimeByHours = new Date();
      expiryTimeByHours.setHours(expiryTimeByHours.getHours() - expiryHours);

      // Проверяем, наступило ли время окончания смены
      const isAfterWorkEnd = now > workEndTime;

      // Формируем условие для просроченных заявок:
      // 1. Статус PENDING
      // 2. И (создана более expiryHours назад ИЛИ (после окончания смены И создана до окончания смены))
      const expiredRequests = await this.prisma.accessRequest.findMany({
        where: {
          status: 'PENDING',
          OR: [
            // Условие 1: заявка создана более X часов назад
            { createdAt: { lt: expiryTimeByHours } },
            // Условие 2: после окончания смены И заявка создана до окончания смены
            ...(isAfterWorkEnd ? [{ createdAt: { lt: workEndTime } }] : [])
          ]
        }
      });

      if (expiredRequests.length === 0) {
        this.logger.log('Просроченных заявок не найдено');
        return;
      }

      // Помечаем найденные заявки как EXPIRED
      const result = await this.prisma.accessRequest.updateMany({
        where: {
          id: { in: expiredRequests.map(r => r.id) }
        },
        data: {
          status: 'EXPIRED',
          processedAt: new Date(),
          processedBy: 'system'
        }
      });

      this.logger.log(`Помечено ${result.count} просроченных заявок`);
      
      // Создаём логи для каждой просроченной заявки
      for (const request of expiredRequests) {
        
        await this.prisma.accessLog.create({
          data: {
            requestId: request.id,
            userId: request.userId,
            action: 'EXPIRE',
            guardId: 'system',
            timestamp: new Date(),
          }
        });
        
        this.logger.log(`Заявка ${request.code} просрочена`);
      }
      
    } catch (error) {
      this.logger.error(`Ошибка: ${error.message}`);
    }
  }
}