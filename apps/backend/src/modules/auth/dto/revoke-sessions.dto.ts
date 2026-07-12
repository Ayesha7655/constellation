import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class RevokeSessionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Session IDs to revoke. The current session is ignored if included.',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Select at least one session' })
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  sessionIds!: string[];
}
