import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GuardService } from './guard.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('guard')
export class GuardController {
  constructor(
    private readonly guardService: GuardService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Post('fix-photos')
  async fixPhotos() {
    // Очищаем archivePhotoUrl у всех пользователей
    const result = await this.prisma.user.updateMany({
      where: {
        archivePhotoUrl: {
          not: null
        }
      },
      data: {
        archivePhotoUrl: null
      }
    });
    
    return { 
      message: `Очищено ${result.count} записей`,
      users: await this.prisma.user.findMany()
    };
  }
}
  