import { Global, Module } from '@nestjs/common';
import { AuthActionRateLimitService } from './services/auth-action-rate-limit.service';
import { PaginationService } from './services/pagination.service';

@Global()
@Module({
  providers: [AuthActionRateLimitService, PaginationService],
  exports: [AuthActionRateLimitService, PaginationService],
})
export class CommonServicesModule {}
