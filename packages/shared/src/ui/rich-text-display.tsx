'use client';

import { RichTextContent } from './rich-text-content';
import { isRichTextEmpty, looksLikeRichTextHtml } from '../lib/rich-text-utils';
import { cn } from '../lib/utils';

type RichTextDisplayBodyProps = Readonly<{
  html: string;
  testId?: string;
  className?: string;
  /** When false, render prose only — no inner card border (use inside an existing section). @default true */
  bordered?: boolean;
}>;

/** Container for rendered rich text. Use `bordered` for standalone blocks; nest with `bordered={false}`. */
export function RichTextDisplayBody({ html, testId, className, bordered = true }: RichTextDisplayBodyProps) {
  if (!bordered) {
    return <RichTextContent html={html} testId={testId} className={cn('text-sm text-foreground', className)} />;
  }

  return (
    <div className={cn('rounded-lg border border-border bg-muted/20 p-4', className)}>
      <RichTextContent html={html} testId={testId} />
    </div>
  );
}

type RichTextDisplaySectionProps = Readonly<{
  title: string;
  html: string | null | undefined;
  testId?: string;
  className?: string;
}>;

/** Labeled rich-text block — hidden when empty. */
export function RichTextDisplaySection({ title, html, testId, className }: RichTextDisplaySectionProps) {
  if (!html || isRichTextEmpty(html)) {
    return null;
  }

  return (
    <section className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <RichTextDisplayBody html={html} testId={testId} />
    </section>
  );
}

type RichTextMessageContentProps = Readonly<{
  content: string;
  testId?: string;
  className?: string;
  plainClassName?: string;
}>;

/** Renders stored message content — HTML from the editor or legacy plain text. */
export function RichTextMessageContent({
  content,
  testId,
  className,
  plainClassName,
}: RichTextMessageContentProps) {
  if (isRichTextEmpty(content)) {
    return null;
  }

  if (looksLikeRichTextHtml(content)) {
    return <RichTextDisplayBody html={content} testId={testId} bordered={false} className={className} />;
  }

  return (
    <p className={cn('whitespace-pre-wrap text-sm text-foreground', plainClassName, className)} data-testid={testId}>
      {content}
    </p>
  );
}
