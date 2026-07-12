import { UserDetailPageView } from '@/components/admin/user-detail-page-view';

type UserDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  return <UserDetailPageView key={id} userId={id} />;
}
