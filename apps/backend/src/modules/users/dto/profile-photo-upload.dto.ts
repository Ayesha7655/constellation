import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProfilePhotoUploadDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Base64 encoded image with optional data URL prefix' })
  base64!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'avatar.png' })
  fileName!: string;
}
