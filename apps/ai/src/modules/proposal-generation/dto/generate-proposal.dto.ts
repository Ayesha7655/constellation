import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProposalStylePackDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lengthTarget?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  structureNotes?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(20)
  alwaysUse?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(20)
  neverUse?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rateMentionPolicy?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaStyle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  extraNotes?: string | null;
}

export class ProposalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title!: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  overview!: string | null;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(50)
  skills!: string[];

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(10000)
  hourlyRateMin!: number | null;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(10000)
  hourlyRateMax!: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country!: string | null;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @ArrayMaxSize(20)
  languages!: string[];
}

export class ProposalJobDto {
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

export class ProposalExampleDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title!: string | null;

  @IsString()
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  jobContext!: string | null;
}

export class ProposalPortfolioLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsString()
  @MaxLength(2000)
  url!: string;
}

export class ProposalPortfolioProjectDto {
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
  @Type(() => ProposalPortfolioLinkDto)
  @ArrayMaxSize(10)
  links!: ProposalPortfolioLinkDto[];
}

export class GenerateProposalDto {
  @ValidateNested()
  @Type(() => ProposalStylePackDto)
  stylePack!: ProposalStylePackDto;

  @ValidateNested()
  @Type(() => ProposalProfileDto)
  profile!: ProposalProfileDto;

  @ValidateNested()
  @Type(() => ProposalJobDto)
  job!: ProposalJobDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalExampleDto)
  @ArrayMaxSize(8)
  examples!: ProposalExampleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposalPortfolioProjectDto)
  @ArrayMaxSize(5)
  portfolio?: ProposalPortfolioProjectDto[];
}
