import { Orbit } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function BrandHeader() {
  return (
    <header className="brand-header">
      <div className="brand-mark" aria-hidden="true">
        <Orbit size={21} strokeWidth={2} />
      </div>
      <div>
        <p className="brand-name">Constellation</p>
        <p className="brand-subtitle">Upwork profile sync</p>
      </div>
      <ThemeToggle />
    </header>
  );
}
