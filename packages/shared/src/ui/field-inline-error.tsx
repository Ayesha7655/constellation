import { cn } from '../lib/utils';

type FieldInlineErrorProps = Readonly<{
  id: string;
  message: string;
}>;

/** Opaque muted danger alert — overlaps input bottom border without showing through. */
export function FieldInlineError({ id, message }: FieldInlineErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className={cn(
        'pointer-events-none absolute top-1 z-20 max-w-[calc(100%-1.5rem)] end-1',
        '-translate-y-[55%]',
      )}
    >
      <p
        className={cn(
          'relative z-20 rounded-md border border-destructive/30 bg-background px-2.5 py-1',
          'text-[11px] font-medium leading-snug text-destructive',
        )}
      >
        {message}
      </p>
    </div>
  );
}
