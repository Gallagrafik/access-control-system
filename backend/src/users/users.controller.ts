import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register-device')
  async registerDevice(
    @Body() body: { fullName: string; passportNumber: string; deviceId: string; pin: string },
  ) {
    return this.usersService.registerDevice(body);
  }
}
