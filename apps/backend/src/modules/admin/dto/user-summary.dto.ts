import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../database/enums';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { UserRoleSummaryDto } from './user-role-summary.dto';

export class UserSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ type: UserRoleSummaryDto })
  primaryRole!: UserRoleSummaryDto;

  @ApiProperty({ type: [UserRoleSummaryDto] })
  roles!: UserRoleSummaryDto[];

  @ApiPropertyOptional({ nullable: true, format: 'uuid' })
  orgId!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  orgName!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  lastLoginAt!: string | null;
}

export class UserDetailDto extends UserSummaryDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  orgAddress!: string | null;
}

export class UsersListResponseDto {
  @ApiProperty({ type: [UserSummaryDto] })
  users!: UserSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
