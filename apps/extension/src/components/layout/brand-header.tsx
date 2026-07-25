import { ThemeToggle } from './theme-toggle';
import type { FreelancerProfileSummary } from '../../types';

type BrandHeaderProps = Readonly<{
  profiles?: readonly FreelancerProfileSummary[];
  defaultProfileId?: string | null;
  onDefaultProfileChange?: (profileId: string) => void;
  disabled?: boolean;
}>;

export function BrandHeader({
  profiles = [],
  defaultProfileId = null,
  onDefaultProfileChange,
  disabled = false,
}: BrandHeaderProps) {
  const hasProfiles = profiles.length > 0;

  return (
    <header className="brand-header">
      <div className="brand-mark" aria-hidden="true">
        <img src="/logo.png" alt="" width={36} height={36} className="brand-mark-image" />
      </div>
      <div className="brand-copy">
        <p className="brand-name">Constellation</p>
        <p className="brand-subtitle">Upwork sync & proposals</p>
        {hasProfiles && onDefaultProfileChange ? (
          <label className="default-profile-switch">
            <span className="default-profile-label">Default profile</span>
            <select
              data-testid="extension-default-profile"
              value={defaultProfileId ?? ''}
              disabled={disabled}
              onChange={(event) => {
                const next = event.target.value;
                if (next) onDefaultProfileChange(next);
              }}
            >
              {profiles.map((profile) => {
                const label = profile.label?.trim() || profile.title?.trim() || 'Untitled profile';
                return (
                  <option key={profile.id} value={profile.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
        ) : null}
      </div>
      <ThemeToggle />
    </header>
  );
}
