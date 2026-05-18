import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async registerDevice(body: { fullName: string; passportNumber: string; deviceId: string }) {
    // 1. Ищем сотрудника в базе по ФИО и паспорту (без пробелов)
    const cleanPassport = body.passportNumber.trim().replace(/\s/g, '');
    
    const user = await this.prisma.user.findFirst({
      where: {
        fullName: { equals: body.fullName.trim(), mode: 'insensitive' },
        passportNumber: cleanPassport,
      },
    });

    // Если сотрудника нет в системе личных дел — выкидываем ошибку
    if (!user) {
      throw new NotFoundException('Сотрудник с такими данными не найден в базе предприятия');
    }

    // 2. Проверяем, не привязано ли это устройство к КОМУ-ТО ДРУГОМУ
    const deviceOwner = await this.prisma.device.findUnique({
      where: { deviceId: body.deviceId },
    });

    if (deviceOwner && deviceOwner.userId !== user.id) {
      throw new ConflictException('Это устройство уже привязано к другому сотруднику');
    }

    // 3. Если устройство свободно, привязываем его к текущему сотруднику
    if (!deviceOwner) {
      await this.prisma.device.create({
        data: {
          deviceId: body.deviceId,
          userId: user.id,
          deviceName: 'Мобильное приложение (Web/Chrome)',
        },
      });
    }

    // Возвращаем данные пользователя для мобильного приложения
    return {
      message: 'Устройство успешно зарегистрировано',
      user: user,
    };
  }
}
