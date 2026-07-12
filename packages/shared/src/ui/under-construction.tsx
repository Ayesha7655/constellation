import { Construction } from 'lucide-react';
import { Badge } from './badge';
import { cn } from '../lib/utils';

type UnderConstructionProps = Readonly<{
  label: string;
  className?: string;
}>;

export function UnderConstruction({ label, className }: UnderConstructionProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2',
        className,
      )}
    >
      <Construction className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <Badge variant="muted">{label}</Badge>
    </div>
  );
}
