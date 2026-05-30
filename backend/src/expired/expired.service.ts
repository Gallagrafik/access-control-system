import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpiredService {
  private readonly logger = new Logger(ExpiredService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/1 * * * *')
  async markExpiredRequests() {
    this.logger.log('Проверка просроченных заявок...');

    try {
      const now = new Date();
      const currentDay = now.getDay();

      const settings = await this.prisma.workScheduleSetting.findUnique({
        where: { dayOfWeek: currentDay }
      });

      if (!settings) {
        this.logger.log('Настройки для сегодняшнего дня не найдены');
        return;
      }

      const expiryHours = settings.requestExpiryHours || 8;
      const [endHour, endMinute] = settings.endTime.split(':').map(Number);

      const workEndTime = new Date();
      workEndTime.setHours(endHour, endMinute, 0, 0);

      const expiryTimeByHours = new Date();
      expiryTimeByHours.setHours(expiryTimeByHours.getHours() - expiryHours);

      const isAfterWorkEnd = now > workEndTime;

      // === 1. СНАЧАЛА: Вошёл без выхода (IN = APPROVED, OUT = PENDING) ===
      if (isAfterWorkEnd) {
        const approvedIns = await this.prisma.accessRequest.findMany({
          where: {
            status: 'APPROVED',
            requestType: 'IN'
          },
          select: { code: true, userId: true, deviceId: true }
        });

        for (const approvedIn of approvedIns) {
          const outRequest = await this.prisma.accessRequest.findFirst({
            where: {
              userId: approvedIn.userId,
              code: approvedIn.code,
              requestType: 'OUT',
              status: 'PENDING'
            },
            select: { id: true, userId: true, deviceId: true, code: true }
          });

          if (outRequest) {
            await this.prisma.accessRequest.update({
              where: { id: outRequest.id },
              data: {
                status: 'ENTERED_WITHOUT_EXIT',
                processedAt: new Date(),
                processedBy: 'system'
              }
            });

            await this.prisma.accessLog.create({
              data: {
                requestId: outRequest.id,
                userId: outRequest.userId,
                action: 'EXPIRE',
                guardId: 'system',
                timestamp: new Date(),
                deviceInfo: outRequest.deviceId // записываем deviceId заявки
              }
            });

            this.logger.log(`Заявка OUT ${outRequest.code} помечена как вошёл без выхода (deviceId: ${outRequest.deviceId})`);
          }
        }
      }

      // === 2. ПОТОМ: Обычные просроченные заявки (PENDING, которые не были обработаны выше) ===
      const expiredRequests = await this.prisma.accessRequest.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { createdAt: { lt: expiryTimeByHours } },
            ...(isAfterWorkEnd ? [{ createdAt: { lt: workEndTime } }] : [])
          ]
        },
        select: { id: true, userId: true, deviceId: true, code: true }
      });

      if (expiredRequests.length > 0) {
        await this.prisma.accessRequest.updateMany({
          where: { id: { in: expiredRequests.map(r => r.id) } },
          data: { status: 'EXPIRED', processedAt: new Date(), processedBy: 'system' }
        });

        for (const request of expiredRequests) {
          await this.prisma.accessLog.create({
            data: {
              requestId: request.id,
              userId: request.userId,
              action: 'EXPIRE',
              guardId: 'system',
              timestamp: new Date(),
              deviceInfo: request.deviceId // записываем deviceId заявки
            }
          });
        }
        this.logger.log(`Помечено ${expiredRequests.length} просроченных заявок`);
      }
      
    } catch (error) {
      this.logger.error(`Ошибка: ${error.message}`);
    }
  }
}