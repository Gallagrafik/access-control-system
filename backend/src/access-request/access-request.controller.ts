import { Controller, Post, Get, Body, UseInterceptors, UploadedFile, Req, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessRequestService } from './access-request.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';

@Controller('access-request')
export class AccessRequestController {
  constructor(private readonly accessRequestService: AccessRequestService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('selfie'))
  async create(
    @Body() createDto: CreateAccessRequestDto,
    @UploadedFile() selfie: Express.Multer.File | undefined,
    @Req() req: any,
  ) {
    return this.accessRequestService.createRequest(createDto, selfie, req);
  }

  @Get('active')
  async getActiveRequests() {
    return this.accessRequestService.getActiveRequests();
  }

  // Получение активных заявок конкретного сотрудника по ID устройства
  @Get('user/:deviceId')
  async getUserRequests(@Param('deviceId') deviceId: string) {
    return this.accessRequestService.getUserRequests(deviceId);
  }

  @Post('process/:id')
  async processRequest(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; comment?: string },
  ) {
    return this.accessRequestService.processRequest(id, body.action, body.comment);
  }
}
