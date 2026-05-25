import { Controller, Get } from '@nestjs/common';
import { AccessLogService } from './access-log.service';

@Controller('access-logs') // Эндпоинт будет доступен по пути /access-logs
export class AccessLogController {
  constructor(private readonly accessLogService: AccessLogService) {}

  @Get()
  async findAll() {
    return this.accessLogService.findAll();
  }
}