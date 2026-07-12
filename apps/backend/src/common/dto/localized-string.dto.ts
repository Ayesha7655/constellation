import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LocalizedStringDto {
  @ApiPropertyOptional({ example: 'United Arab Emirates' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  en?: string;

  @ApiPropertyOptional({ example: 'الإمارات العربية المتحدة' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  ar?: string;
}
