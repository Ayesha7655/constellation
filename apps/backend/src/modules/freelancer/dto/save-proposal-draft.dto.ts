import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROPOSAL_BODY_MAX_LENGTH } from '@constellation/shared';

export class SaveProposalDraftDto {
  @ApiProperty()
  @IsString()
  @MaxLength(PROPOSAL_BODY_MAX_LENGTH)
  body!: string;

  @ApiPropertyOptional({ description: 'When true, also save this body as a starred library example' })
  @IsOptional()
  @IsBoolean()
  addToLibrary?: boolean;
}
