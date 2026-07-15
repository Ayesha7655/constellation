import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class FilterGenerationProfileDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone!: string | null;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  languages!: string[];

  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  exclusions!: string[];
}

export class GenerateFiltersDto {
  @ValidateNested()
  @Type(() => FilterGenerationProfileDto)
  profile!: FilterGenerationProfileDto;
}
