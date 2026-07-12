import { ApiProperty } from '@nestjs/swagger';
import { AUTH_RESULT_CODES } from '@constellation/shared';

export class AuthCodeResponseDto {
  @ApiProperty({
    example: AUTH_RESULT_CODES.PASSWORD_RESET_ACK,
    description: 'Stable result code — frontend resolves copy via i18n (`errors.${code}`)',
  })
  code!: string;
}
