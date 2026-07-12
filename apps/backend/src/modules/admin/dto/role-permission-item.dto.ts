import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RolePermissionItemDto {
  @ApiProperty({ example: 'admin.control_panel_overview' })
  key!: string;

  @ApiProperty({ example: 'Control panel overview' })
  name!: string;

  @ApiProperty({ example: 'admin_controls' })
  category!: string;

  @ApiProperty({ example: 'Admin controls' })
  categoryLabel!: string;

  @ApiPropertyOptional({ example: 'View the admin control panel home' })
  description?: string;
}
