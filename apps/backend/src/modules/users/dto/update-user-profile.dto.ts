import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120, example: 'Jane Admin' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name required' })
  @MaxLength(120, { message: 'Too long' })
  name?: string;
}
