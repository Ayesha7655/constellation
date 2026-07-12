import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildPaginationMeta,
  MAX_PAGE_SIZE,
  type PaginationMeta,
  type PaginationQuery,
  resolvePagination,
  type ResolvedPagination,
} from '@constellation/shared';

@Injectable()
export class PaginationService {
  constructor(private readonly configService: ConfigService) {}

  resolve(query: PaginationQuery): ResolvedPagination {
    return resolvePagination(query, this.getMaxLimit());
  }

  buildMeta(page: number, limit: number, total: number): PaginationMeta {
    return buildPaginationMeta(page, limit, total);
  }

  private getMaxLimit(): number {
    const configured = this.configService.get<string>('PAGINATION_MAX_LIMIT')?.trim();
    if (!configured) {
      return MAX_PAGE_SIZE;
    }
    const parsed = Number.parseInt(configured, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return MAX_PAGE_SIZE;
    }
    return parsed;
  }
}
