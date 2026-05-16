import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Для SQLite в Prisma 7 это минимальная рабочая конфигурация
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Prisma успешно подключён к SQLite (dev.db)');
    } catch (error) {
      this.logger.error('❌ Ошибка подключения к базе', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}