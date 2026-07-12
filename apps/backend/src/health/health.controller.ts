import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { ApiPublicRoute } from '../swagger/api-routes';
import { HealthCheckDto } from './dto/health-check.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiPublicRoute({ summary: 'Health check', ok: { type: HealthCheckDto } })
  check() {
    return this.healthService.check();
  }
}
