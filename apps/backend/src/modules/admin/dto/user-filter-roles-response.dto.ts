import { ApiProperty } from '@nestjs/swagger';
import { UserRoleSummaryDto } from './user-role-summary.dto';

export class UserFilterRolesResponseDto {
  @ApiProperty({ type: [UserRoleSummaryDto] })
  roles!: UserRoleSummaryDto[];
}
