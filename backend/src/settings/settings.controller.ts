import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';   // позже создадим

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Получить текущие настройки рабочего дня
  @Get('schedule')
  async getSchedule() {
    return this.settingsService.getCurrentSchedule();
  }

  // Обновить настройки (только для админа)
  @Post('schedule')
  async updateSchedule(
    @Body() body: { dayOfWeek: number; startTime: string; endTime: string }
  ) {
    return this.settingsService.updateSchedule(body.dayOfWeek, body.startTime, body.endTime);
  }
}