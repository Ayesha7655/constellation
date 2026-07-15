import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UpdateFreelancerProfileDto } from './update-freelancer-profile.dto';

export class CreateFreelancerProfileDto extends UpdateFreelancerProfileDto {
  @ApiPropertyOptional({ description: 'Display label for this Upwork profile slot' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare label?: string | null;
}
