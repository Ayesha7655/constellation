import type { PaginationMeta } from '@constellation/shared';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ description: 'Current 1-based page' })
  page!: number;

  @ApiProperty({ description: 'Items per page (limit)' })
  limit!: number;

  @ApiProperty({ description: 'Total matching rows' })
  total!: number;

  @ApiProperty({ description: 'Total pages for the current limit' })
  totalPages!: number;
}
