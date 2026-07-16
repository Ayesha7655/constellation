import { Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpworkScoringWeightsDto {
  @ApiProperty({ example: 40, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  skills!: number;

  @ApiProperty({ example: 25, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  keywords!: number;

  @ApiProperty({ example: 15, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  budget!: number;

  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  location!: number;

  @ApiProperty({ example: 5, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  clientRating!: number;

  @ApiProperty({ example: 5, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  proposals!: number;
}

export class UpworkScoringThresholdsDto {
  @ApiProperty({ example: 80, description: 'Score at or above this is green' })
  @IsInt()
  @Min(0)
  @Max(100)
  green!: number;

  @ApiProperty({ example: 60, description: 'Score at or above this (below green) is orange' })
  @IsInt()
  @Min(0)
  @Max(100)
  orange!: number;

  @ApiProperty({ example: 40, description: 'Score at or above this (below orange) is yellow; below is red' })
  @IsInt()
  @Min(0)
  @Max(100)
  yellow!: number;
}

export class UpdateUpworkScoringConfigDto {
  @ApiProperty({ type: UpworkScoringWeightsDto })
  @ValidateNested()
  @Type(() => UpworkScoringWeightsDto)
  weights!: UpworkScoringWeightsDto;

  @ApiProperty({ type: UpworkScoringThresholdsDto })
  @ValidateNested()
  @Type(() => UpworkScoringThresholdsDto)
  thresholds!: UpworkScoringThresholdsDto;
}
