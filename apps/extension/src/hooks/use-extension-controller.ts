import { useCallback, useEffect, useState } from 'react';
import {
  assertValidScrapedProfile,
  getActiveTab,
  isUpworkProfileTab,
  scrapeActiveProfile,
} from '../lib/active-tab';
import {
  connectWithCode,
  disconnect,
  importProfileDraft,
  isAuthenticationError,
  listFreelancerProfiles,
  restoreValidSession,
  toFriendlyError,
} from '../services/extension-api';
import type {
  ConnectionState,
  ExtensionAction,
  Feedback,
  FreelancerProfileSummary,
  StoredSession,
} from '../types';

export function useExtensionController() {
  const [connection, setConnection] = useState<ConnectionState>({ status: 'loading' });
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [profiles, setProfiles] = useState<FreelancerProfileSummary[]>([]);
  const [action, setAction] = useState<ExtensionAction>('idle');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshProfiles = useCallback(async (session: StoredSession) => {
    const result = await listFreelancerProfiles(session);
    setProfiles(result.profiles);
    return result.session;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([restoreValidSession(), getActiveTab()]).then(async ([session, tab]) => {
      if (cancelled) return;
      setActiveTab(tab);
      if (!session) {
        setConnection({ status: 'disconnected' });
        setProfiles([]);
        return;
      }
      try {
        const activeSession = await refreshProfiles(session);
        if (cancelled) return;
        setConnection({ status: 'connected', session: activeSession });
      } catch (error) {
        if (cancelled) return;
        if (isAuthenticationError(error)) {
          setConnection({ status: 'disconnected' });
          setProfiles([]);
          return;
        }
        setConnection({ status: 'connected', session });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshProfiles]);

  const connect = useCallback(
    async (code: string) => {
      setAction('connecting');
      setFeedback(null);
      try {
        const session = await connectWithCode(code);
        const activeSession = await refreshProfiles(session);
        setConnection({ status: 'connected', session: activeSession });
        setActiveTab(await getActiveTab());
        setFeedback({ tone: 'success', message: 'Extension connected successfully.' });
      } catch (error) {
        setFeedback({ tone: 'error', message: toFriendlyError(error, 'connect') });
      } finally {
        setAction('idle');
      }
    },
    [refreshProfiles],
  );

  const sync = useCallback(async () => {
    if (connection.status !== 'connected' || !activeTab) return;
    if (!isUpworkProfileTab(activeTab)) {
      setFeedback({ tone: 'error', message: 'Not a valid Upwork profile page.' });
      return;
    }

    setAction('syncing');
    setFeedback({ tone: 'info', message: 'Reading the active Upwork profile…' });
    try {
      const profile = await scrapeActiveProfile(activeTab);
      assertValidScrapedProfile(profile);
      const result = await importProfileDraft(connection.session, profile);
      setConnection({ status: 'connected', session: result.session });
      try {
        await refreshProfiles(result.session);
      } catch {
        // Keep the draft success message even if the list refresh fails.
      }
      setFeedback({
        tone: 'success',
        message: result.targetProfileId
          ? 'Draft saved to update a matched profile. Review and confirm in Constellation.'
          : 'Draft saved for a new profile. Review and confirm in Constellation.',
      });
    } catch (error) {
      const message = toFriendlyError(error, 'sync');
      setFeedback({ tone: 'error', message });
      if (isAuthenticationError(error)) {
        setConnection({ status: 'disconnected' });
        setProfiles([]);
      }
    } finally {
      setAction('idle');
    }
  }, [activeTab, connection, refreshProfiles]);

  const disconnectExtension = useCallback(async () => {
    if (connection.status !== 'connected') return;

    setAction('disconnecting');
    setFeedback(null);
    try {
      await disconnect(connection.session);
      setConnection({ status: 'disconnected' });
      setProfiles([]);
      setFeedback({ tone: 'info', message: 'Extension disconnected.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: toFriendlyError(error, 'disconnect') });
    } finally {
      setAction('idle');
    }
  }, [connection]);

  return {
    connection,
    activeTab,
    profiles,
    action,
    busy: action !== 'idle',
    feedback,
    connect,
    sync,
    disconnect: disconnectExtension,
  };
}
