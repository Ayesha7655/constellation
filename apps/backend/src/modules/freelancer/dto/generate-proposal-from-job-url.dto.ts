import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateProposalFromJobUrlDto {
  @ApiProperty({ example: 'https://www.upwork.com/jobs/~01abcdef…' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  jobUrl!: string;
}
