import { useCallback } from 'react';
import { Briefcase, Check, ExternalLink, PenLine, RefreshCw, Unplug, UserRound } from 'lucide-react';
import { normalizeUpworkFreelancerProfileUrl } from '../../lib/active-tab';
import { getWebUrl } from '../../lib/extension-config';
import type { ExtensionAction, FreelancerProfileSummary } from '../../types';

type SyncScreenProps = Readonly<{
  action: ExtensionAction;
  isProfilePage: boolean;
  isPortfolioPage: boolean;
  isJobPage: boolean;
  tabTitle: string | null;
  activeTabUrl: string | null;
  profiles: readonly FreelancerProfileSummary[];
  defaultProfileId: string | null;
  onSync: () => Promise<void>;
  onSyncPortfolio: () => Promise<void>;
  onGenerateProposal: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}>;

function truncateUrl(url: string, max = 42): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

function formatUpdatedAt(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SyncScreen({
  action,
  isProfilePage,
  isPortfolioPage,
  isJobPage,
  tabTitle,
  activeTabUrl,
  profiles,
  defaultProfileId,
  onSync,
  onSyncPortfolio,
  onGenerateProposal,
  onDisconnect,
}: SyncScreenProps) {
  const busy = action !== 'idle';
  const hasProfiles = profiles.length > 0;
  const normalizedTabUrl = normalizeUpworkFreelancerProfileUrl(activeTabUrl);
  const syncing = action === 'syncing';
  const generating = action === 'generating';
  const isApplyPage = Boolean(activeTabUrl && /\/proposals\/job\/~0*\d+\/apply\/?/i.test(activeTabUrl));
  const canGenerate = isJobPage && Boolean(defaultProfileId);
  const tabReady = isProfilePage || isJobPage || isPortfolioPage;

  const handleSync = useCallback(() => {
    void onSync();
  }, [onSync]);

  const handleSyncPortfolio = useCallback(() => {
    void onSyncPortfolio();
  }, [onSyncPortfolio]);

  const handleGenerate = useCallback(() => {
    void onGenerateProposal();
  }, [onGenerateProposal]);

  const handleDisconnect = useCallback(() => {
    void onDisconnect();
  }, [onDisconnect]);

  const heading = isJobPage
    ? 'Generate a proposal'
    : isPortfolioPage
      ? 'Sync a portfolio project'
      : isProfilePage && hasProfiles
        ? 'Resync an Upwork profile'
        : 'Sync an Upwork profile';

  const intro = isJobPage
    ? 'Use your default profile to draft a proposal for this job, copy it, and save it in Constellation.'
    : isPortfolioPage
      ? 'Scrape the open portfolio project and create or update it on the matching freelancer profile in Constellation.'
      : isProfilePage && hasProfiles
        ? 'Scrape the profile in your active tab. Matched profiles update after you confirm in Constellation.'
        : 'Import the profile open in your active tab as a draft for review in Constellation.';

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
        <h1>{heading}</h1>
        <p>{intro}</p>
      </div>

      {hasProfiles ? (
        <section className="profile-list" data-testid="extension-profile-list" aria-label="Saved profiles">
          <h2 className="profile-list-heading">Saved profiles</h2>
          <ul className="profile-list-items">
            {profiles.map((profile) => {
              const displayName = profile.label?.trim() || profile.title?.trim() || 'Untitled profile';
              const normalizedProfileUrl = normalizeUpworkFreelancerProfileUrl(profile.profileUrl);
              const isMatch =
                normalizedTabUrl !== null &&
                normalizedProfileUrl !== null &&
                normalizedTabUrl === normalizedProfileUrl;
              const isDefault = profile.id === defaultProfileId;
              const updated = formatUpdatedAt(profile.updatedAt);
              return (
                <li
                  key={profile.id}
                  className={`profile-list-row${isMatch ? ' profile-list-row-match' : ''}`}
                  data-testid={`extension-profile-row-${profile.id}`}
                >
                  <div className="profile-list-copy">
                    <p className="profile-list-name">
                      {displayName}
                      {isDefault ? <span className="profile-match-pill">Default</span> : null}
                      {isMatch ? <span className="profile-match-pill">Current tab</span> : null}
                    </p>
                    {profile.profileUrl ? (
                      <p className="profile-list-url">{truncateUrl(profile.profileUrl)}</p>
                    ) : null}
                    {updated ? <p className="profile-list-meta">Updated {updated}</p> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className={`card tab-card ${tabReady ? 'tab-ready' : ''}`}>
        <div className="profile-icon" aria-hidden="true">
          {isJobPage ? <PenLine size={19} /> : isPortfolioPage ? <Briefcase size={19} /> : <UserRound size={19} />}
        </div>
        <div className="tab-copy">
          <h2>
            {isJobPage
              ? isApplyPage
                ? 'Apply page ready'
                : 'Job ready'
              : isPortfolioPage
                ? 'Portfolio project ready'
                : isProfilePage
                  ? 'Profile ready'
                  : 'Open an Upwork profile, portfolio, or job'}
          </h2>
          <p>
            {isJobPage
              ? isApplyPage
                ? 'Generate a proposal for this application'
                : tabTitle || 'Upwork job page'
              : isPortfolioPage
                ? tabTitle || 'Upwork portfolio project'
                : isProfilePage
                  ? tabTitle || 'Upwork freelancer profile'
                  : 'Navigate to a freelancer profile, portfolio project, job, or apply page'}
          </p>
        </div>
        {tabReady ? <Check className="ready-check" size={18} aria-hidden="true" /> : null}
      </section>

      {isJobPage ? (
        <button
          data-testid="extension-generate-proposal"
          className="button button-primary sync-button"
          type="button"
          onClick={handleGenerate}
          disabled={busy || !canGenerate}
        >
          <PenLine className={generating ? 'spin' : ''} size={17} aria-hidden="true" />
          {generating ? 'Generating…' : 'Generate proposal'}
        </button>
      ) : isPortfolioPage ? (
        <button
          data-testid="extension-sync-portfolio"
          className="button button-primary sync-button"
          type="button"
          onClick={handleSyncPortfolio}
          disabled={busy}
        >
          <Briefcase className={syncing ? 'spin' : ''} size={17} aria-hidden="true" />
          {syncing ? 'Syncing portfolio…' : 'Sync portfolio project'}
        </button>
      ) : (
        <button
          data-testid={isProfilePage && hasProfiles ? 'extension-resync-profile' : 'extension-sync-profile'}
          className="button button-primary sync-button"
          type="button"
          onClick={handleSync}
          disabled={busy || !isProfilePage}
        >
          <RefreshCw className={syncing ? 'spin' : ''} size={17} aria-hidden="true" />
          {syncing
            ? isProfilePage && hasProfiles
              ? 'Resyncing…'
              : 'Syncing profile…'
            : isProfilePage && hasProfiles
              ? 'Resync current tab'
              : 'Sync profile'}
        </button>
      )}

      <a
        className="app-link"
        data-testid="extension-open-draft"
        href={`${getWebUrl()}/dashboard/upwork/profile/draft`}
        target="_blank"
        rel="noreferrer"
      >
        Review drafts in Constellation
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      {!tabReady ? (
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
