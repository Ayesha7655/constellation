import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE } from '@constellation/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Reusable query params for paginated list endpoints (`page` + `limit` → offset server-side). */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: MIN_PAGE, minimum: MIN_PAGE, description: '1-based page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE)
  page?: number = MIN_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    description: 'Items per page; capped by PAGINATION_MAX_LIMIT on the server',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = DEFAULT_PAGE_SIZE;
}
