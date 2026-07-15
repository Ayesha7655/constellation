import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { FilterGenerationModule } from './modules/filter-generation/filter-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    FilterGenerationModule,
  ],
})
export class AppModule {}
