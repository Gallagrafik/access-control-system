import { Controller, Post, Body, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
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
}