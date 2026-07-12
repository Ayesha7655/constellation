type DetailFieldProps = Readonly<{
  label: string;
  value: string;
}>;

/** Simple labeled read-only value — no border box. */
export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
