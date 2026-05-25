import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async seedDefaultSchedule() {
    const count = await this.prisma.workScheduleSetting.count();
    if (count > 0) return;

    const defaultSchedule = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWeekend: false, requestExpiryHours: 8 },
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWeekend: false, requestExpiryHours: 8 },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWeekend: false, requestExpiryHours: 8 },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWeekend: false, requestExpiryHours: 8 },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWeekend: false, requestExpiryHours: 8 },
      { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isWeekend: true, requestExpiryHours: 8 },
      { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", isWeekend: true, requestExpiryHours: 8 },
    ];

    await this.prisma.workScheduleSetting.createMany({ data: defaultSchedule });
    this.logger.log('✅ Загружены настройки рабочего дня по умолчанию');
  }

  async getCurrentSchedule() {
    const today = new Date().getDay();
    return this.prisma.workScheduleSetting.findUnique({
      where: { dayOfWeek: today },
    });
  }

  async updateSchedule(dayOfWeek: number, startTime: string, endTime: string, requestExpiryHours?: number) {
    return this.prisma.workScheduleSetting.upsert({
      where: { dayOfWeek },
      update: { 
        startTime, 
        endTime,
        ...(requestExpiryHours !== undefined && { requestExpiryHours })
      },
      create: { 
        dayOfWeek, 
        startTime, 
        endTime, 
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        requestExpiryHours: requestExpiryHours || 8
      },
    });
  }

  async getExpiredCount() {
    return this.prisma.accessRequest.count({
      where: { status: 'EXPIRED' }
    });
  }

  async getAllSchedules() {
    return this.prisma.workScheduleSetting.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
  }
}