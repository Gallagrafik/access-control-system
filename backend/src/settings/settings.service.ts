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
      { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWeekend: false }, // Пн
      { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWeekend: false },
      { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWeekend: false },
      { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWeekend: false },
      { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWeekend: false }, // Пт
      { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", isWeekend: true },  // Сб
      { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", isWeekend: true },  // Вс
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

  async updateSchedule(dayOfWeek: number, startTime: string, endTime: string) {
    return this.prisma.workScheduleSetting.upsert({
      where: { dayOfWeek },
      update: { startTime, endTime },
      create: { dayOfWeek, startTime, endTime, isWeekend: dayOfWeek === 0 || dayOfWeek === 6 },
    });
  }
}