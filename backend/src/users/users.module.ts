import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Импортируем Prisma, чтобы была связь с PostgreSQL

@Module({
  imports: [PrismaModule], // Добавляем сюда PrismaModule
  controllers: [UsersController], // Регистрируем контроллер
  providers: [UsersService], // Регистрируем сервис
})
export class UsersModule {}
