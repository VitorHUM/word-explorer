import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth.type';

@Controller('user')
export class UserController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): AuthenticatedUser {
    return authenticatedUser;
  }
}
