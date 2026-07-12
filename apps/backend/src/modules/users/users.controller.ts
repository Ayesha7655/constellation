import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { LocaleAwareRequest } from '../../common/types/request.types';
import { ApiLocaleBearerController } from '../../swagger/api-controller';
import { ApiJwtProtectedRoute } from '../../swagger/api-routes';
import { CurrentUserProfileDto } from './dto/current-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@ApiLocaleBearerController('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiJwtProtectedRoute({
    summary: 'Current authenticated user profile',
    ok: { type: CurrentUserProfileDto },
    notFoundUser: true,
  })
  getCurrentUser(@Req() request: LocaleAwareRequest) {
    return this.usersService.getCurrentUserProfileForRequest(request.user?.sub, request.locale, request.user?.role);
  }

  @Patch('me')
  @ApiJwtProtectedRoute({
    summary: 'Update current user profile (name)',
    ok: { type: CurrentUserProfileDto },
    notFoundUser: true,
  })
  @ApiBadRequestResponse({ description: 'Validation failed or no profile fields to update' })
  updateCurrentUser(@Req() request: LocaleAwareRequest, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateProfile(request.user?.sub, dto, request.locale, request.user?.role);
  }
}
