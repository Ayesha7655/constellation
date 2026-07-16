import { UpworkJobDetailView } from '@/components/org/upwork-job-detail-view';

type UpworkJobDetailPageProps = Readonly<{
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ profileId?: string }>;
}>;

export default async function UpworkJobDetailPage({ params, searchParams }: UpworkJobDetailPageProps) {
  const { jobId } = await params;
  const { profileId } = await searchParams;
  return (
    <UpworkJobDetailView
      key={`${profileId ?? ''}:${jobId}`}
      profileId={profileId ?? ''}
      jobId={jobId}
    />
  );
}
