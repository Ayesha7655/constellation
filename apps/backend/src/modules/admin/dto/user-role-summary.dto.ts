import { ApiProperty } from '@nestjs/swagger';

export class UserRoleSummaryDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;
}
