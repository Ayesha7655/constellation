import { ApiProperty } from '@nestjs/swagger';

export class UserRoleMembershipDto {
  @ApiProperty({ example: 'org-admin' })
  key!: string;

  @ApiProperty({ example: 'Organization Admin' })
  label!: string;

  @ApiProperty({ example: '/dashboard' })
  dashboardHomePath!: string;
}
