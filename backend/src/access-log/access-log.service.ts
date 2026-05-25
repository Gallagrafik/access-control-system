import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type AccessRequestWithUser = Prisma.AccessRequestGetPayload<{
  include: { user: true }
}>;

@Injectable()
export class AccessLogService {
  constructor(private readonly prisma: PrismaService) {}

  // Функция для перевода русских букв в английские (для инициалов)
  private transliterateChar(char: string): string {
    const dict: { [key: string]: string } = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH',
      'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'KH', 'Ц': 'TS',
      'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SHCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
    };
    return dict[char.toUpperCase()] || char.toUpperCase();
  }

  // Функция для сборки имени файла по шаблону: Инициалы + номер паспорта + .jpg
  private generateArchiveFileName(user: any): string | null {
    if (!user || !user.fullName || !user.passportNumber) return null;

    // 1. Получаем части ФИО ["Иванов", "Сергей", "Александрович"]
    const nameParts = user.fullName.trim().split(/\s+/);
    
    // 2. Берём только первую букву каждого слова и переводим в транслит
    const initials = nameParts
      .map(part => {
        const firstChar = part?.charAt(0).toUpperCase();
        return this.transliterateChar(firstChar);
      })
      .join(''); // Например: "ИСА" -> "ISA"

    // 3. Очищаем номер паспорта от возможных пробелов
    const passportClean = user.passportNumber.replace(/\s+/g, '');

    // 4. Формируем итоговый путь
    return `http://localhost:9000/access-photos/archive/${initials}${passportClean}.jpg`;
  }

  async findAll() {
    const logs = await this.prisma.accessLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    const requestIds: string[] = logs
      .map(l => l.requestId)
      .filter((id): id is string => id !== null && id !== undefined);

    const requests = await this.prisma.accessRequest.findMany({
      where: { id: { in: requestIds } },
      include: { user: true }
    });

    return logs.map(log => {
      const associatedRequest = requests.find(r => r.id === log.requestId);
      
      if (!associatedRequest) {
        return { ...log, request: null };
      }

      // ВАЖНО: Игнорируем archivePhotoUrl из БД, генерируем заново!
      const archiveUrl = this.generateArchiveFileName(associatedRequest.user);

      return {
        ...log,
        request: {
          id: associatedRequest.id,
          code: associatedRequest.code,
          requestType: associatedRequest.requestType,
          status: associatedRequest.status,
          createdAt: associatedRequest.createdAt,
          selfieUrl: associatedRequest.selfieUrl,
          archivePhotoUrl: archiveUrl,  // ← используем сгенерированный
          user: associatedRequest.user ? {
            id: associatedRequest.user.id,
            fullName: associatedRequest.user.fullName,
            passportNumber: associatedRequest.user.passportNumber,
            position: associatedRequest.user.position,
            department: associatedRequest.user.department,
            archivePhotoUrl: archiveUrl,  // ← и здесь тоже
            isActive: associatedRequest.user.isActive
          } : null
        }
      };
    });
  }
}