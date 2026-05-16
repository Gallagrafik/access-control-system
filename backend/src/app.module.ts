import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { GuardModule } from './guard/guard.module';
import { UsersModule } from './users/users.module';
import { AccessRequestModule } from './access-request/access-request.module';
import { SettingsModule } from './settings/settings.module';
import { JwtModule } from '@nestjs/jwt';
import { SettingsService } from './settings/settings.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GuardModule,
    UsersModule,
    AccessRequestModule,
    SettingsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-change-this-in-production-2026',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [SettingsService],   // для OnModuleInit
})
export class AppModule implements OnModuleInit {
  constructor(private settingsService: SettingsService) {}

  async onModuleInit() {
    await this.settingsService.seedDefaultSchedule();
  }
}