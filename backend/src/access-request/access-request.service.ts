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
    // Автоматическая настройка публичного доступа на скачивание фото
    const bucketName = this.configService.get<string>('MINIO_BUCKET') || 'access-photos';
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
      .then(() => this.logger.log(`✅ Доступ к бакету ${bucketName} успешно открыт (PUBLIC)`))
      .catch((err) => this.logger.error(`❌ Ошибка настройки прав бакета: ${err.message}`));
  }

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

    // Получение активных заявок со статусом PENDING
  async getActiveRequests() {
    return this.prisma.accessRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: true, // Обязательно подтягиваем данные сотрудника из таблицы users
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Изменение статуса заявки (гашение по кнопке "Пропустить")
  async processRequest(id: string, action: 'APPROVE' | 'REJECT') {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Находим текущую заявку
    const currentRequest = await this.prisma.accessRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentRequest) {
      throw new BadRequestException('Заявка не найдена');
    }

    // Если отклоняем ВХОД — автоматически отклоняем и ВЫХОД с тем же кодом
    if (action === 'REJECT' && currentRequest.requestType === 'IN') {
      await this.prisma.accessRequest.updateMany({
        where: {
          code: currentRequest.code,
          userId: currentRequest.userId,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: 'admin',
        },
      });
    }

    // Обновляем текущую заявку
    const updatedRequest = await this.prisma.accessRequest.update({
      where: { id },
      data: {
        status: status,
        processedAt: new Date(),
        processedBy: 'admin',
      },
    });

    // Логируем действие
    await this.prisma.accessLog.create({
      data: {
        requestId: id,
        userId: updatedRequest.userId,
        action: action === 'APPROVE' ? 'PASS' : 'REJECT',
        guardId: 'admin',
        timestamp: new Date(),
      },
    });

    return { 
      message: `Заявка успешно переведена в статус ${status}`,
      autoRejectedOut: action === 'REJECT' && currentRequest.requestType === 'IN'
    };
  }

  // Поиск активных заявок сотрудника в PostgreSQL
  async getUserRequests(deviceId: string) {
    return this.prisma.accessRequest.findMany({
      where: {
        deviceId: deviceId,
        status: 'PENDING', // Показываем только те, что еще не обработал охранник
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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