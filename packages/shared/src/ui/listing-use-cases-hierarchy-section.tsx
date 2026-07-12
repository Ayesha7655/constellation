'use client';

import { formatUseCaseKeysPreview } from '../lib/normalize-listing-use-case-keys';
import type { RobotListingUseCaseRef } from '../robot-listings';
import { UseCasePreviewLines } from './use-case-preview-lines';

type ListingUseCasesHierarchySectionProps = Readonly<{
  title: string;
  useCases: readonly RobotListingUseCaseRef[];
  sectionTestId?: string;
  getLineTestId?: (lineIndex: number, line: string) => string;
}>;

export function ListingUseCasesHierarchySection({
  title,
  useCases,
  sectionTestId,
  getLineTestId,
}: ListingUseCasesHierarchySectionProps) {
  const lines = formatUseCaseKeysPreview(
    useCases.map((useCase) => useCase.key),
    useCases,
  );

  if (lines.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" data-testid={sectionTestId}>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <UseCasePreviewLines lines={lines} align="start" getLineTestId={getLineTestId} />
    </section>
  );
}
