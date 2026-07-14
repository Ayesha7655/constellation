import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSearchFiltersDto {
  @ApiProperty({ description: 'Apify actor input JSON for blackfalcondata/upwork-scraper' })
  @IsObject()
  filters!: Record<string, unknown>;
}
