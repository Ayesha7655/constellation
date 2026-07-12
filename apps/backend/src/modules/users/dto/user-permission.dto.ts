import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPermissionDto {
  @ApiProperty({ example: 'browsing.browse_listings' })
  key!: string;

  @ApiProperty({ example: 'Browse robot listings' })
  name!: string;

  @ApiProperty({ example: 'browsing_discovery' })
  category!: string;

  @ApiProperty({ example: 'Browsing & Discovery' })
  categoryLabel!: string;

  @ApiPropertyOptional({ example: 'Search and view robots listed on the marketplace' })
  description?: string;
}
