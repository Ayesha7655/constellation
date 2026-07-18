import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class StyleExtractExampleDto {
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

export class ExtractStylePackDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StyleExtractExampleDto)
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  examples!: StyleExtractExampleDto[];
}
