import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROPOSAL_ATTACHMENT_MAX_COUNT, PROPOSAL_EXAMPLE_BODY_MAX_LENGTH } from '@constellation/shared';

export class CreateProposalExampleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @ApiProperty()
  @IsString()
  @MaxLength(PROPOSAL_EXAMPLE_BODY_MAX_LENGTH)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  jobContext?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Previously uploaded storage keys to attach' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PROPOSAL_ATTACHMENT_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  attachmentStorageKeys?: string[];
}

export class UpdateProposalExampleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(PROPOSAL_EXAMPLE_BODY_MAX_LENGTH)
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  jobContext?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;
}
