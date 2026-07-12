'use client';

import { RichTextContent } from './rich-text-content';
import { RichTextDisplayBody } from './rich-text-display';
import { isRichTextEmpty } from '../lib/rich-text-utils';
import { cn } from '../lib/utils';

type ListingDescriptionBodyProps = Readonly<{
  html: string;
  testId?: string;
  className?: string;
}>;

/** Rendered listing description body — plain rich text on detail pages. */
export function ListingDescriptionBody({ html, testId, className }: ListingDescriptionBodyProps) {
  return <RichTextContent html={html} testId={testId} className={className} />;
}

type ListingDescriptionSectionProps = Readonly<{
  title: string;
  html: string | null | undefined;
  testId?: string;
  className?: string;
  titleClassName?: string;
  bodyClassName?: string;
}>;

/** Detail-page description block — hidden when empty. */
export function ListingDescriptionSection({
  title,
  html,
  testId,
  className,
  titleClassName,
  bodyClassName,
}: ListingDescriptionSectionProps) {
  if (!html || isRichTextEmpty(html)) {
    return null;
  }

  return (
    <section className={cn('space-y-2', className)}>
      <h3 className={cn('text-sm font-medium text-foreground', titleClassName)}>{title}</h3>
      <ListingDescriptionBody html={html} testId={testId} className={bodyClassName} />
    </section>
  );
}

type ListingDescriptionPreviewRowProps = Readonly<{
  label: string;
  html: string;
  emptyValue?: string;
  testId?: string;
}>;

/** Form wizard step preview — same rendered description as detail pages. */
export function ListingDescriptionPreviewRow({
  label,
  html,
  emptyValue = '—',
  testId,
}: ListingDescriptionPreviewRowProps) {
  const isEmpty = isRichTextEmpty(html);

  return (
    <div className="space-y-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>
        {isEmpty ? (
          <span className="text-sm font-medium text-foreground">{emptyValue}</span>
        ) : (
          <RichTextDisplayBody html={html} testId={testId} className="p-3" />
        )}
      </dd>
    </div>
  );
}
