import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum RequestTypeDto {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateAccessRequestDto {
  @IsEnum(RequestTypeDto)
  requestType: RequestTypeDto;

  @IsOptional()
  @IsString()
  deviceId?: string;        // fingerprint устройства
}