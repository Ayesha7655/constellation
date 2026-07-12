'use client';

import { cn } from '../lib/utils';

const USE_CASE_PREVIEW_SEPARATOR = ' > ';

function renderUseCasePreviewLine(line: string, emphasized: boolean) {
  const separatorIndex = line.indexOf(USE_CASE_PREVIEW_SEPARATOR);
  if (separatorIndex === -1) {
    return <span className={emphasized ? 'font-medium text-foreground' : 'text-foreground'}>{line}</span>;
  }

  const parent = line.slice(0, separatorIndex);
  const children = line.slice(separatorIndex + USE_CASE_PREVIEW_SEPARATOR.length);

  return (
    <>
      <span className={emphasized ? 'font-medium text-foreground' : 'text-foreground'}>{parent}</span>
      <span className="mx-1 text-muted-foreground" aria-hidden>
        &gt;
      </span>
      <span className={emphasized ? 'font-medium text-foreground' : 'text-foreground'}>{children}</span>
    </>
  );
}

type UseCasePreviewLinesProps = Readonly<{
  lines: readonly string[];
  emphasized?: boolean;
  align?: 'start' | 'end';
  className?: string;
  getLineTestId?: (lineIndex: number, line: string) => string;
}>;

export function UseCasePreviewLines({
  lines,
  emphasized = false,
  align = 'end',
  className,
  getLineTestId,
}: UseCasePreviewLinesProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <ul className={cn('flex flex-col gap-2', align === 'end' ? 'text-end' : 'text-start', className)}>
      {lines.map((line, lineIndex) => (
        <li
          key={`${lineIndex}-${line}`}
          data-testid={getLineTestId?.(lineIndex, line)}
          className="rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm leading-snug"
        >
          {renderUseCasePreviewLine(line, emphasized)}
        </li>
      ))}
    </ul>
  );
}
