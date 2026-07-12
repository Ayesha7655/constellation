import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'One-time code from the reset email link' })
  @IsString()
  @MinLength(10)
  oobCode!: string;

  @ApiProperty({ minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6, { message: 'Min 6 characters' })
  @MaxLength(128, { message: 'Too long' })
  password!: string;
}
