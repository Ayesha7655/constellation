import { useCallback, useEffect, useState } from 'react';
import { getActiveTab, scrapeActiveProfile } from '../lib/active-tab';
import {
  connectWithCode,
  disconnect,
  importProfileDraft,
  isAuthenticationError,
  restoreValidSession,
  toFriendlyError,
} from '../services/extension-api';
import type { ConnectionState, Feedback } from '../types';

export function useExtensionController() {
  const [connection, setConnection] = useState<ConnectionState>({ status: 'loading' });
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([restoreValidSession(), getActiveTab()]).then(([session, tab]) => {
      if (cancelled) return;
      setConnection(session ? { status: 'connected', session } : { status: 'disconnected' });
      setActiveTab(tab);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (code: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const session = await connectWithCode(code);
      setConnection({ status: 'connected', session });
      setActiveTab(await getActiveTab());
      setFeedback({ tone: 'success', message: 'Extension connected successfully.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: toFriendlyError(error, 'connect') });
    } finally {
      setBusy(false);
    }
  }, []);

  const sync = useCallback(async () => {
    if (connection.status !== 'connected' || !activeTab) return;

    setBusy(true);
    setFeedback({ tone: 'info', message: 'Reading the active Upwork profile…' });
    try {
      const profile = await scrapeActiveProfile(activeTab);
      const activeSession = await importProfileDraft(connection.session, profile);
      setConnection({ status: 'connected', session: activeSession });
      setFeedback({
        tone: 'success',
        message: 'Draft synced. Review and confirm it in Constellation.',
      });
    } catch (error) {
      const message = toFriendlyError(error, 'sync');
      setFeedback({ tone: 'error', message });
      if (isAuthenticationError(error)) {
        setConnection({ status: 'disconnected' });
      }
    } finally {
      setBusy(false);
    }
  }, [activeTab, connection]);

  const disconnectExtension = useCallback(async () => {
    if (connection.status !== 'connected') return;

    setBusy(true);
    setFeedback(null);
    try {
      await disconnect(connection.session);
      setConnection({ status: 'disconnected' });
      setFeedback({ tone: 'info', message: 'Extension disconnected.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: toFriendlyError(error, 'disconnect') });
    } finally {
      setBusy(false);
    }
  }, [connection]);

  return {
    connection,
    activeTab,
    busy,
    feedback,
    connect,
    sync,
    disconnect: disconnectExtension,
  };
}
