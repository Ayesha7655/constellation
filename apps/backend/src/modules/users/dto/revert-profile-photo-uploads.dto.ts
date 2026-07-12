import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class RevertProfilePhotoUploadsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ApiProperty({ type: [String], description: 'S3 storage keys to delete (must belong to this user)' })
  keys!: string[];
}
