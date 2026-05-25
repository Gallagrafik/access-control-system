import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AccessRequestModule } from './access-request/access-request.module';
import { SettingsModule } from './settings/settings.module';
import { GuardModule } from './guard/guard.module';
import { AccessLogModule } from './access-log/access-log.module';
import { ExpiredModule } from './expired/expired.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule, 
    UsersModule, 
    AccessRequestModule, 
    SettingsModule,
    GuardModule,
    AccessLogModule,
    ExpiredModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
