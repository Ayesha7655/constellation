import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthProvider } from '../../../database/enums';
import { UserPermissionDto } from './user-permission.dto';
import { UserRoleMembershipDto } from './user-role-membership.dto';

export class CurrentUserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jane Admin' })
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  photoUrl!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ enum: AuthProvider, example: AuthProvider.PASSWORD, description: 'Sign-in provider for this account' })
  authProvider!: AuthProvider;

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  orgId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Acme Robotics' })
  orgName!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '123 Innovation Way' })
  orgAddress!: string | null;

  @ApiProperty({ example: false, description: 'True when org name and address are both set' })
  orgProfileComplete!: boolean;

  @ApiProperty({ example: 'Organization Admin', description: 'Localized active role display name' })
  role!: string;

  @ApiProperty({ example: 'org-admin', description: 'Stable active role key for this session (JWT role claim)' })
  roleCode!: string;

  @ApiProperty({ example: 'org-admin', description: 'Same as roleCode — active role key for this session' })
  activeRoleKey!: string;

  @ApiProperty({ example: 'org-admin', description: 'Stable primary role key stored on the user record' })
  primaryRoleCode!: string;

  @ApiProperty({ example: '/dashboard', description: 'Home path for the active role' })
  dashboardHomePath!: string;

  @ApiProperty({
    example: ['Organization Admin'],
    type: [String],
    description: 'Localized role display names (legacy — prefer roleMemberships)',
  })
  roles!: string[];

  @ApiProperty({
    type: [UserRoleMembershipDto],
    description: 'All roles assigned to this user',
  })
  roleMemberships!: UserRoleMembershipDto[];

  @ApiProperty({ type: [UserPermissionDto], description: 'Active role permissions resolved for request locale' })
  permissions!: UserPermissionDto[];
}
