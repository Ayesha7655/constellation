import { UpworkProfileDetailView } from '@/components/org/upwork-profile-detail-view';

type UpworkProfileDetailPageProps = Readonly<{
  params: Promise<{ profileId: string }>;
}>;

export default async function UpworkProfileDetailPage({ params }: UpworkProfileDetailPageProps) {
  const { profileId } = await params;
  return <UpworkProfileDetailView key={profileId} profileId={profileId} />;
}
