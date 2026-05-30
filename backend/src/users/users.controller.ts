import { Controller, Post, Body, Get, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Проверка существования сотрудника
  @Post('check-employee')
  async checkEmployee(@Body() body: { fullName: string; passportNumber: string }) {
    return this.usersService.checkEmployee(body.fullName, body.passportNumber);
  }

  // 2. Создание пароля (первая регистрация)
  @Post('set-password')
  async setPassword(
    @Body() body: { passportNumber: string; password: string; deviceId: string; deviceName?: string },
  ) {
    return this.usersService.setPassword(body.passportNumber, body.password, body.deviceId, body.deviceName);
  }

  // 3. Вход по паролю
  @Post('login')
  async login(
    @Body() body: { passportNumber: string; password: string; deviceId: string; deviceName?: string },
  ) {
    return this.usersService.login(body.passportNumber, body.password, body.deviceId, body.deviceName);
  }

  // 4. Проверка устройства (для быстрого входа)
  @Post('check-device')
  async checkDevice(@Body() body: { deviceId: string }) {
    return this.usersService.checkDevice(body.deviceId);
  }

  // 5. Отвязать текущее устройство
  @Delete('device/:deviceId')
  async unregisterDevice(@Param('deviceId') deviceId: string) {
    return this.usersService.unregisterDevice(deviceId);
  }

  // 6. Смена пароля (требует авторизации)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: any,
  ) {
    // req.user.sub — это ID пользователя из JWT токена
    return this.usersService.changePassword(req.user.sub, body.oldPassword, body.newPassword);
  }

  // 7. Получить все устройства пользователя
  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getUserDevices(@Req() req: any) {
    return this.usersService.getUserDevices(req.user.sub);
  }

  // 8. Смена пароля по отпечатку (без старого пароля)
  @Post('change-password-by-pin')
  async changePasswordByPin(
    @Body() body: { passportNumber: string; newPassword: string },
  ) {
    return this.usersService.changePasswordByPin(body.passportNumber, body.newPassword);
  }
}