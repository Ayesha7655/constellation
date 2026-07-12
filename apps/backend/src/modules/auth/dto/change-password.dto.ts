import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The account current password', maxLength: 128 })
  @IsString()
  @MinLength(1, { message: 'Current password required' })
  @MaxLength(128, { message: 'Too long' })
  currentPassword!: string;

  @ApiProperty({ minLength: 6, maxLength: 128 })
  @IsString()
  @MinLength(6, { message: 'Min 6 characters' })
  @MaxLength(128, { message: 'Too long' })
  newPassword!: string;
}
