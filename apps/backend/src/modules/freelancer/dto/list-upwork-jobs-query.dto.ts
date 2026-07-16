import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListUpworkJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search title/description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ description: 'Minimum relevancy score (0–100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @ApiPropertyOptional({ enum: ['score', 'date'], default: 'score' })
  @IsOptional()
  @IsIn(['score', 'date'])
  sort?: 'score' | 'date';

  @ApiPropertyOptional({ description: 'Inclusive scraped-at start (ISO date or datetime)' })
  @IsOptional()
  @IsDateString()
  scrapedFrom?: string;

  @ApiPropertyOptional({ description: 'Inclusive scraped-at end (ISO date or datetime)' })
  @IsOptional()
  @IsDateString()
  scrapedTo?: string;

  @ApiPropertyOptional({ description: 'Limit to jobs seen in this scrape run' })
  @IsOptional()
  @IsUUID()
  scrapeRunId?: string;

  @ApiPropertyOptional({ description: 'When scrapeRunId is set, only jobs first seen in that run' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  newOnly?: boolean;
}
