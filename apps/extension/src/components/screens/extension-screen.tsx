import { isUpworkProfileTab } from '../../lib/active-tab';
import type { ConnectionState } from '../../types';
import { ConnectScreen } from './connect-screen';
import { LoadingScreen } from './loading-screen';
import { SyncScreen } from './sync-screen';

type ExtensionScreenProps = Readonly<{
  connection: ConnectionState;
  activeTab: chrome.tabs.Tab | null;
  busy: boolean;
  onConnect: (code: string) => Promise<void>;
  onSync: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}>;

export function ExtensionScreen({
  connection,
  activeTab,
  busy,
  onConnect,
  onSync,
  onDisconnect,
}: ExtensionScreenProps) {
  switch (connection.status) {
    case 'loading':
      return <LoadingScreen />;
    case 'disconnected':
      return <ConnectScreen busy={busy} onConnect={onConnect} />;
    case 'connected':
      return (
        <SyncScreen
          busy={busy}
          isProfilePage={isUpworkProfileTab(activeTab)}
          tabTitle={activeTab?.title ?? null}
          onSync={onSync}
          onDisconnect={onDisconnect}
        />
      );
  }
}
