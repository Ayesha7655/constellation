import { ApiProperty } from '@nestjs/swagger';

export class PublicAuthTokensDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;

  @ApiProperty({ example: 'org-admin' })
  role!: string;

  @ApiProperty({ example: '/dashboard' })
  dashboardHomePath!: string;
}

export class RefreshAccessTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out' })
  message!: string;
}
