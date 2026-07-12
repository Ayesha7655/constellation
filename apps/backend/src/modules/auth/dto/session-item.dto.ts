import { ApiProperty } from '@nestjs/swagger';
import { SessionPlatform } from '../../../database/enums';

export class SessionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, example: 'web-abc123' })
  deviceId!: string | null;

  @ApiProperty({ enum: SessionPlatform, example: SessionPlatform.WEB })
  platform!: SessionPlatform;

  @ApiProperty({ nullable: true, example: '203.0.113.4' })
  ipAddress!: string | null;

  @ApiProperty({ nullable: true, example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...' })
  userAgent!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Last sign-in / token refresh time (not per-request activity)',
  })
  lastActiveAt!: Date;

  @ApiProperty({ example: false, description: 'True for the session making this request' })
  isCurrent!: boolean;
}
