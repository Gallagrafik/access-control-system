import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. Проверка существования сотрудника по ФИО и паспорту
  async checkEmployee(fullName: string, passportNumber: string) {
    const cleanPassport = passportNumber.trim().replace(/\s/g, '');
    
    const user = await this.prisma.user.findFirst({
      where: {
        fullName: { equals: fullName.trim(), mode: 'insensitive' },
        passportNumber: cleanPassport,
      },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      userId: user.id,
      fullName: user.fullName,
      passportNumber: user.passportNumber,
      hasPassword: user.passwordHash !== null && user.passwordHash !== '',
    };
  }

  // 2. Создание пароля (первая регистрация)
  async setPassword(passportNumber: string, password: string, deviceId: string, deviceName?: string) {
    const cleanPassport = passportNumber.trim().replace(/\s/g, '');
    
    const user = await this.prisma.user.findUnique({
      where: { passportNumber: cleanPassport },
    });

    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (user.passwordHash) {
      throw new ConflictException('Пароль уже установлен. Используйте вход по паролю.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Обновляем пользователя и привязываем устройство в транзакции
    const [updatedUser, device] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      }),
      this.prisma.device.upsert({
        where: { deviceId: deviceId },
        update: { userId: user.id, lastUsedAt: new Date() },
        create: {
          deviceId: deviceId,
          userId: user.id,
          deviceName: deviceName || 'Мобильное устройство',
        },
      }),
    ]);

    return {
      success: true,
      message: 'Пароль успешно создан',
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        passportNumber: updatedUser.passportNumber,
        position: updatedUser.position,
        archivePhotoUrl: updatedUser.archivePhotoUrl,
      },
    };
  }

  // 3. Вход по паролю (с привязкой устройства, если новое)
  async login(passportNumber: string, password: string, deviceId: string, deviceName?: string) {
    const cleanPassport = passportNumber.trim().replace(/\s/g, '');
    
    const user = await this.prisma.user.findUnique({
      where: { passportNumber: cleanPassport },
    });

    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Пароль не установлен. Сначала создайте пароль.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    // Привязываем или обновляем устройство
    const device = await this.prisma.device.upsert({
      where: { deviceId: deviceId },
      update: { userId: user.id, lastUsedAt: new Date() },
      create: {
        deviceId: deviceId,
        userId: user.id,
        deviceName: deviceName || 'Мобильное устройство',
      },
    });

    return {
      success: true,
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        fullName: user.fullName,
        passportNumber: user.passportNumber,
        position: user.position,
        archivePhotoUrl: user.archivePhotoUrl,
      },
    };
  }

  // 4. Проверка привязанного устройства (для быстрого входа)
  async checkDevice(deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId: deviceId },
      include: { user: true },
    });

    if (!device || !device.user) {
      return { exists: false };
    }

    return {
      exists: true,
      userId: device.user.id,
      fullName: device.user.fullName,
      passportNumber: device.user.passportNumber,
      position: device.user.position,
      archivePhotoUrl: device.user.archivePhotoUrl,
    };
  }

  // 5. Смена пароля (для авторизованных пользователей)
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new NotFoundException('Пользователь не найден или пароль не установлен');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Неверный старый пароль');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    return { success: true, message: 'Пароль успешно изменён' };
  }

  // 6. Отвязать устройство
  async unregisterDevice(deviceId: string) {
    await this.prisma.device.deleteMany({
      where: { deviceId: deviceId },
    });
    return { success: true, message: 'Устройство отвязано' };
  }

  // 7. Получить все устройства пользователя
  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: { userId: userId },
      select: {
        deviceId: true,
        deviceName: true,
        registeredAt: true,
        lastUsedAt: true,
      },
    });
  }

  // 8. Смена пароля по отпечатку (без проверки старого пароля)
  async changePasswordByPin(passportNumber: string, newPassword: string) {
    const cleanPassport = passportNumber.trim().replace(/\s/g, '');
    
    const user = await this.prisma.user.findUnique({
      where: { passportNumber: cleanPassport },
    });
    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword },
    });

    return { success: true, message: 'Пароль успешно изменён' };
  }
}