import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase ID token from the client SDK' })
  @IsString({ message: 'Sign-in could not be verified. Please try again.' })
  @MinLength(10, {
    message: 'Sign-in could not be verified. Please try again.',
  })
  idToken!: string;

  @ApiPropertyOptional({ description: 'Display name for new users' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
