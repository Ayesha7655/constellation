import { ApiPropertyOptional } from '@nestjs/swagger';
import { LIST_TEXT_SEARCH_MAX_LENGTH } from '@constellation/shared';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

/** Optional case-insensitive substring search (`q`) on paginated list endpoints. */
export class TextSearchPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive substring search across list-specific fields',
    maxLength: LIST_TEXT_SEARCH_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(LIST_TEXT_SEARCH_MAX_LENGTH)
  q?: string;
}
