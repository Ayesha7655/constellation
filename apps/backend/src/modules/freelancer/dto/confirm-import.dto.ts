import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmImportDto {
  @ApiPropertyOptional({ description: 'Label for the new profile created from the draft' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}
