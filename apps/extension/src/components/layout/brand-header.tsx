import { ThemeToggle } from './theme-toggle';

export function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-mark" aria-hidden="true">
        <img src="/logo.png" alt="" width={36} height={36} className="brand-mark-image" />
      </div>
      <div>
        <p className="brand-name">Constellation</p>
        <p className="brand-subtitle">Upwork profile sync</p>
      </div>
      <ThemeToggle />
    </header>
  );
}
