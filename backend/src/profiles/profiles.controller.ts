import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/user-context.type';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.profilesService.getProfile(user.id);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: { full_name?: string },
  ) {
    return this.profilesService.updateProfile(user.id, body);
  }
}
