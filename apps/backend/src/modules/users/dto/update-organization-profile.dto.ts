import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOrganizationProfileDto {
  @ApiProperty({ minLength: 1, maxLength: 200, example: 'Acme Robotics' })
  @IsString()
  @MinLength(1, { message: 'Name required' })
  @MaxLength(200, { message: 'Too long' })
  name!: string;

  @ApiProperty({ minLength: 1, maxLength: 500, example: '123 Innovation Way, Dubai' })
  @IsString()
  @MinLength(1, { message: 'Address required' })
  @MaxLength(500, { message: 'Too long' })
  address!: string;
}
