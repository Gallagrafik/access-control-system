import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('schedule')
  async getSchedule() {
    return this.settingsService.getCurrentSchedule();
  }

  @Get('schedules')
  async getAllSchedules() {
    return this.settingsService.getAllSchedules();
  }

  @Post('schedule')
  async updateSchedule(
    @Body() body: { dayOfWeek: number; startTime: string; endTime: string; requestExpiryHours?: number }
  ) {
    return this.settingsService.updateSchedule(
      body.dayOfWeek, 
      body.startTime, 
      body.endTime,
      body.requestExpiryHours
    );
  }

  @Get('expired/count')
  async getExpiredCount() {
    return this.settingsService.getExpiredCount();
  }
}