import { ApiProperty } from '@nestjs/swagger';
import { RolePermissionItemDto } from './role-permission-item.dto';

export class RoleSummaryDto {
  @ApiProperty({ example: 'admin' })
  key!: string;

  @ApiProperty({ example: 'Admin' })
  displayName!: string;

  @ApiProperty({ example: 48 })
  permissionCount!: number;

  @ApiProperty({ type: [RolePermissionItemDto] })
  permissions!: RolePermissionItemDto[];
}
