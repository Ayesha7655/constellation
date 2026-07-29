import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PortfolioProjectLinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  url!: string;
}

export class ImportPortfolioProjectDto {
  @ApiProperty({ description: 'Upwork portfolio project id from ?p=' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  externalId!: string;

  @ApiProperty({ description: 'Normalized freelancer profile URL' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  profileUrl!: string;

  @ApiPropertyOptional({ description: 'Full Upwork portfolio project URL including ?p=' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  projectUrl?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  technologies?: string[];

  @ApiPropertyOptional({ type: [PortfolioProjectLinkDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PortfolioProjectLinkDto)
  links?: PortfolioProjectLinkDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  publishedOn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rawSnapshot?: Record<string, unknown>;
}
