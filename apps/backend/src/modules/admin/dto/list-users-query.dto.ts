import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '../../../database/enums';
import { TextSearchPaginationQueryDto } from '../../../common/dto/text-search-pagination-query.dto';

const USER_LIST_STATUSES = [UserStatus.ACTIVE, UserStatus.DEACTIVATED] as const;

export class ListUsersQueryDto extends TextSearchPaginationQueryDto {
  @ApiPropertyOptional({ enum: USER_LIST_STATUSES, description: 'Filter by account status' })
  @IsOptional()
  @IsIn(USER_LIST_STATUSES)
  status?: (typeof USER_LIST_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Filter users who have this role in user_roles' })
  @IsOptional()
  @IsString()
  roleKey?: string;
}
