import { ApiProperty } from '@nestjs/swagger';
import { RoleSummaryDto } from './role-summary.dto';

export class RolesListResponseDto {
  @ApiProperty({ type: [RoleSummaryDto] })
  roles!: RoleSummaryDto[];
}
