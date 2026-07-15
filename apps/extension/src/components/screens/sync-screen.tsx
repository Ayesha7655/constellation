import { useCallback } from 'react';
import { Check, ExternalLink, RefreshCw, Unplug, UserRound } from 'lucide-react';

type SyncScreenProps = Readonly<{
  busy: boolean;
  isProfilePage: boolean;
  tabTitle: string | null;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}>;

export function SyncScreen({ busy, isProfilePage, tabTitle, onSync, onDisconnect }: SyncScreenProps) {
  const handleSync = useCallback(() => {
    void onSync();
  }, [onSync]);

  const handleDisconnect = useCallback(() => {
    void onDisconnect();
  }, [onDisconnect]);

  return (
    <main className="content">
      <div className="connected-row">
        <span className="status-badge">
          <Check size={13} aria-hidden="true" />
          Connected
        </span>
        <button
          data-testid="extension-disconnect"
          className="text-button"
          type="button"
          onClick={handleDisconnect}
          disabled={busy}
        >
          <Unplug size={14} aria-hidden="true" />
          Disconnect
        </button>
      </div>

      <div className="intro intro-start">
        <h1>Sync an Upwork profile</h1>
        <p>Import the profile open in your active tab as a draft for review in Constellation.</p>
      </div>

      <section className={`card tab-card ${isProfilePage ? 'tab-ready' : ''}`}>
        <div className="profile-icon" aria-hidden="true">
          <UserRound size={19} />
        </div>
        <div className="tab-copy">
          <h2>{isProfilePage ? 'Profile ready to sync' : 'Open an Upwork profile'}</h2>
          <p>{isProfilePage ? tabTitle || 'Upwork freelancer profile' : 'Navigate to upwork.com/freelancers/…'}</p>
        </div>
        {isProfilePage ? <Check className="ready-check" size={18} aria-hidden="true" /> : null}
      </section>

      <button
        data-testid="extension-sync-profile"
        className="button button-primary sync-button"
        type="button"
        onClick={handleSync}
        disabled={busy || !isProfilePage}
      >
        <RefreshCw className={busy ? 'spin' : ''} size={17} aria-hidden="true" />
        {busy ? 'Syncing profile…' : 'Sync profile'}
      </button>

      {!isProfilePage ? (
        <a
          className="app-link"
          data-testid="extension-open-upwork"
          href="https://www.upwork.com/freelancers/"
          target="_blank"
          rel="noreferrer"
        >
          Open Upwork
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : null}
    </main>
  );
}
