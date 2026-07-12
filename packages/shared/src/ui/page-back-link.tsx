import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export const pageBackLinkClassName =
  'inline-flex w-fit shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground';

type PageBackLinkAnchorProps = Readonly<{
  href: string;
  className?: string;
  children: ReactNode;
  'data-testid'?: string;
}>;

type PageBackLinkProps = Readonly<{
  href: string;
  label: string;
  testId?: string;
  className?: string;
  /** Pass Next.js / next-intl `Link` for client navigation; defaults to a plain anchor. */
  LinkComponent?: ComponentType<PageBackLinkAnchorProps>;
}>;

export function PageBackLink({ href, label, testId, className, LinkComponent }: PageBackLinkProps) {
  const mergedClassName = cn(pageBackLinkClassName, className);
  const content = (
    <>
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </>
  );

  if (LinkComponent) {
    return (
      <LinkComponent href={href} className={mergedClassName} data-testid={testId}>
        {content}
      </LinkComponent>
    );
  }

  return (
    <a href={href} className={mergedClassName} data-testid={testId}>
      {content}
    </a>
  );
}
