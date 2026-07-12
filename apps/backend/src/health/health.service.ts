import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

export type HealthCheckResult = Readonly<{
  status: 'ok';
  timestamp: string;
}>;

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async check(): Promise<HealthCheckResult> {
    await this.sequelize.query('SELECT 1');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
