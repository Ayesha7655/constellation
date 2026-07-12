import { ApiProperty } from '@nestjs/swagger';
import { SessionItemDto } from './session-item.dto';

export class CurrentSessionListDto {
  @ApiProperty({ type: [SessionItemDto], description: 'Active sessions for the authenticated user (current included)' })
  sessions!: SessionItemDto[];
}
