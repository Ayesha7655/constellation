import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthSessionGuard } from '@/components/auth/auth-session-guard';
import { AppToaster } from '@/components/ui/app-toaster';
import { GlobalLoadingProvider } from '@/contexts/global-loading-provider';
import { localeDirection } from '@/i18n/config';
import { ThemeProvider } from '@/themes';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Constellation',
  description: 'Constellation organization platform',
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  const direction = localeDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col overflow-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AppToaster />
            <GlobalLoadingProvider>
              <AuthSessionGuard />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
            </GlobalLoadingProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
