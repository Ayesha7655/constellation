import { ApiProperty } from '@nestjs/swagger';

/** Body emitted by `CodedExceptionFilter` — `{ statusCode, code }` (no user-facing prose). */
export class CodedErrorResponseDto {
  @ApiProperty({ example: 409, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    example: 'api.manufacturer.key_exists',
    description: 'Stable error code; client resolves `errors.<code>` to a localized message',
  })
  code!: string;
}
