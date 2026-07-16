import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSearchFiltersDto {
  @ApiProperty({
    description: 'Apify actor input JSON for getdataforme/upwork-actor (queries, item_limit, job_posted, …)',
  })
  @IsObject()
  filters!: Record<string, unknown>;
}
