import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class PortfolioRelevanceJobDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  @MaxLength(20000)
  description!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(50)
  skills!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  budget!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jobType!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  experienceLevel!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientLocation!: string | null;
}

class PortfolioRelevanceLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsString()
  @MaxLength(2000)
  url!: string;
}

class PortfolioRelevanceCandidateDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description!: string | null;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(30)
  technologies!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  projectUrl!: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioRelevanceLinkDto)
  @ArrayMaxSize(10)
  links!: PortfolioRelevanceLinkDto[];
}

export class FindRelevantPortfolioDto {
  @ValidateNested()
  @Type(() => PortfolioRelevanceJobDto)
  job!: PortfolioRelevanceJobDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioRelevanceCandidateDto)
  @ArrayMaxSize(50)
  portfolio!: PortfolioRelevanceCandidateDto[];
}
