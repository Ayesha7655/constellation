export type PublicAuthTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  role: string;
  dashboardHomePath: string;
}>;

export type RefreshAccessTokenResult = Readonly<{
  accessToken: string;
}>;

export type LogoutResult = Readonly<{
  message: string;
}>;
