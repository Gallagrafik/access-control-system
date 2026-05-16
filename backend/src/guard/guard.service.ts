import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

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
}