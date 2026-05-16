import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccessRequestDto, RequestTypeDto } from './dto/create-access-request.dto';
import { Client as MinioClient } from 'minio';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class AccessRequestService {
  private readonly logger = new Logger(AccessRequestService.name);
  private minioClient: MinioClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const host = this.configService.get<string>('MINIO_ENDPOINT')!.replace('http://', '').split(':')[0];
    this.minioClient = new MinioClient({
      endPoint: host,
      port: 9000,
      useSSL: false,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY')!,
    });
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async createRequest(
    dto: CreateAccessRequestDto,
    selfie: Express.Multer.File | undefined,
    req: any,
  ) {
    if (!selfie) throw new BadRequestException('Селфи обязательно');
    if (!dto.deviceId) throw new BadRequestException('Device ID обязателен');

    // Ищем устройство + пользователя
    const device = await this.prisma.device.findFirst({
      where: { deviceId: dto.deviceId },
      include: { user: true },
    });

    if (!device || !device.user) {
      throw new BadRequestException('Устройство не привязано к сотруднику или сотрудник не найден');
    }

    const user = device.user;

    // Генерируем один общий код для IN и OUT
    const code = this.generateCode();

    // Сохраняем селфи в MinIO
    const fileExtension = selfie.originalname.split('.').pop() || 'jpg';
    const fileName = `selfies/${randomUUID()}.${fileExtension}`;

    await this.minioClient.putObject(
      this.configService.get<string>('MINIO_BUCKET')!,
      fileName,
      selfie.buffer,
      selfie.size,
      { 'Content-Type': selfie.mimetype || 'image/jpeg' }
    );

    const selfieUrl = `${this.configService.get<string>('MINIO_ENDPOINT')}/${this.configService.get<string>('MINIO_BUCKET')}/${fileName}`;

    // Создаём сразу две заявки (IN + OUT) с одним кодом
    const [requestIn, requestOut] = await this.prisma.$transaction([
      this.prisma.accessRequest.create({
        data: {
          code,
          userId: user.id,
          deviceId: dto.deviceId,
          selfieUrl,
          requestType: 'IN',
          status: 'PENDING',
        },
      }),
      this.prisma.accessRequest.create({
        data: {
          code,
          userId: user.id,
          deviceId: dto.deviceId,
          selfieUrl,
          requestType: 'OUT',
          status: 'PENDING',
        },
      }),
    ]);

    this.logger.log(`✅ Создано 2 заявки с кодом ${code} для пользователя ${user.fullName}`);

    return {
      success: true,
      message: 'Заявка на вход и выход успешно создана',
      code: code,
      fullName: user.fullName,
      selfieUrl: selfieUrl,
    };
  }
}