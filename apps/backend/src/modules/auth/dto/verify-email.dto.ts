import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'One-time code from the verification email link' })
  @IsString()
  @MinLength(10)
  oobCode!: string;

  @ApiPropertyOptional({
    description: 'Email from the verification link query (enables idempotent verify)',
  })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Invalid email' })
  @MaxLength(320)
  email?: string;
}
