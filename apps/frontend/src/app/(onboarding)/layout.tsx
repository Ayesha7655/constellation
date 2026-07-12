import { OnboardingAuthGuard } from '@/components/onboarding/onboarding-auth-guard';

type OnboardingRouteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function OnboardingRouteLayout({ children }: OnboardingRouteLayoutProps) {
  return <OnboardingAuthGuard>{children}</OnboardingAuthGuard>;
}
