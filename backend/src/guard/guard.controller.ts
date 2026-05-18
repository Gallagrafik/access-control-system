import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GuardService } from './guard.service';

@Controller('guard')
export class GuardController {
  constructor(private readonly guardService: GuardService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.guardService.login(body.username, body.password);
  }

  // Один раз можно вызвать для создания админа
  @Post('seed-admin')
  async seedAdmin() {
    return this.guardService.seedAdmin();
  }
  
  // Метод для массовой загрузки сотрудников из JSON
  @Post('seed-users')
  async seedUsers() {
    return this.guardService.seedUsers();
  }
}
  