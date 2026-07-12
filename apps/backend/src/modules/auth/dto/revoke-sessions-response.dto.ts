import { ApiProperty } from '@nestjs/swagger';
import { AUTH_RESULT_CODES } from '@constellation/shared';

export class RevokeSessionsResponseDto {
  @ApiProperty({ example: 2 })
  revokedCount!: number;

  @ApiProperty({ example: true, description: 'True when no other active session remains after this operation' })
  revokedAllOtherSessions!: boolean;

  @ApiProperty({
    example: AUTH_RESULT_CODES.SESSIONS_REVOKED,
    description: 'Stable result code — frontend resolves copy via i18n (`errors.${code}`)',
  })
  code!: string;
}
