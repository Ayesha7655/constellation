import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UserStatus } from '../../../database/enums';

const USER_MANAGEABLE_STATUSES = [UserStatus.ACTIVE, UserStatus.DEACTIVATED] as const;

export type UserManageableStatus = (typeof USER_MANAGEABLE_STATUSES)[number];

export class UpdateUserStatusDto {
  @ApiProperty({ enum: USER_MANAGEABLE_STATUSES, example: UserStatus.DEACTIVATED })
  @IsIn(USER_MANAGEABLE_STATUSES)
  status!: UserManageableStatus;
}
