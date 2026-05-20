import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GuardService {
  private readonly logger = new Logger(GuardService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async seedAdmin() {
    const existing = await this.prisma.guard.findUnique({ where: { username: 'admin' } });
    if (existing) {
      return { message: 'Админ уже существует' };
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await this.prisma.guard.create({
      data: {
        fullName: 'Главный Администратор',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    this.logger.log('✅ Создан администратор: логин "admin", пароль "admin123"');
    return { message: 'Админ успешно создан' };
  }

  async login(username: string, password: string) {
    const guard = await this.prisma.guard.findUnique({ where: { username } });

    if (!guard || !(await bcrypt.compare(password, guard.password))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const payload = { 
      sub: guard.id, 
      username: guard.username, 
      role: guard.role 
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      access_token: token,
      guard: {
        id: guard.id,
        fullName: guard.fullName,
        role: guard.role,
      },
    };
  }

  async seedUsers() {
    // Путь к файлу сотрудников (выходим из dist/guard/ в корень проекта backend, затем в mobile_employee)
    const jsonPath = 'D:\\access-control-system\\mobile_employee\\assets\\employees.json';
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Файл сотрудников не найден по пути: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const employees = JSON.parse(rawData);

    let createdCount = 0;

    for (const emp of employees) {
      // Очищаем паспорт от пробелов для точного поиска
      const cleanPassport = emp.passportNumber.toString().replace(/\s/g, '');

      const existing = await this.prisma.user.findUnique({
        where: { passportNumber: cleanPassport }
      });

      if (!existing) {
        await this.prisma.user.create({
          data: {
            fullName: emp.fullName,
            passportNumber: cleanPassport,
            position: emp.position,
            archivePhotoUrl: emp.archivePhotoUrl,
            isActive: true,
          }
        });
        createdCount++;
      }
    }

    return {
      message: `Синхронизация сотрудников завершена успешно!`,
      inserted: createdCount,
      totalInJson: employees.length
    };
  }
}