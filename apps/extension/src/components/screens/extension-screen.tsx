import { isUpworkJobTab, isUpworkPortfolioProjectTab, isUpworkProfileTab } from '../../lib/active-tab';
import type { ConnectionState, ExtensionAction, FreelancerProfileSummary } from '../../types';
import { ConnectScreen } from './connect-screen';
import { LoadingScreen } from './loading-screen';
import { SyncScreen } from './sync-screen';

type ExtensionScreenProps = Readonly<{
  connection: ConnectionState;
  activeTab: chrome.tabs.Tab | null;
  profiles: readonly FreelancerProfileSummary[];
  defaultProfileId: string | null;
  action: ExtensionAction;
  onConnect: (code: string) => Promise<void>;
  onSync: () => Promise<void>;
  onSyncPortfolio: () => Promise<void>;
  onGenerateProposal: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}>;

export function ExtensionScreen({
  connection,
  activeTab,
  profiles,
  defaultProfileId,
  action,
  onConnect,
  onSync,
  onSyncPortfolio,
  onGenerateProposal,
  onDisconnect,
}: ExtensionScreenProps) {
  switch (connection.status) {
    case 'loading':
      return <LoadingScreen />;
    case 'disconnected':
      return <ConnectScreen busy={action === 'connecting'} onConnect={onConnect} />;
    case 'connected':
      return (
        <SyncScreen
          action={action}
          isProfilePage={isUpworkProfileTab(activeTab)}
          isPortfolioPage={isUpworkPortfolioProjectTab(activeTab)}
          isJobPage={isUpworkJobTab(activeTab)}
          tabTitle={activeTab?.title ?? null}
          activeTabUrl={activeTab?.url ?? null}
          profiles={profiles}
          defaultProfileId={defaultProfileId}
          onSync={onSync}
          onSyncPortfolio={onSyncPortfolio}
          onGenerateProposal={onGenerateProposal}
          onDisconnect={onDisconnect}
        />
      );
  }
}
