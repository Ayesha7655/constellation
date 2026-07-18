import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROPOSAL_ATTACHMENT_MAX_COUNT } from '@constellation/shared';

export class UploadProposalAttachmentDto {
  @ApiProperty({ description: 'Raw base64 or data-URL base64 payload' })
  @IsString()
  @MaxLength(40_000_000)
  base64!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;
}

export class RevertProposalAttachmentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(PROPOSAL_ATTACHMENT_MAX_COUNT)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  keys!: string[];
}

export class AttachProposalStorageKeyDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  storageKey!: string;
}
