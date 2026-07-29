import { useCallback, useEffect, useState } from 'react';
import {
  assertValidScrapedProfile,
  getActiveTab,
  isUpworkJobTab,
  isUpworkPortfolioProjectTab,
  isUpworkProfileTab,
  scrapeActivePortfolioProject,
  scrapeActiveProfile,
} from '../lib/active-tab';
import {
  clearDefaultProfileId,
  getStoredDefaultProfileId,
  saveDefaultProfileId,
} from '../lib/extension-storage';
import {
  connectWithCode,
  disconnect,
  generateProposalFromJobUrl,
  importPortfolioProject,
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

function resolveDefaultProfileId(
  profiles: readonly FreelancerProfileSummary[],
  storedId: string | null,
): string | null {
  if (profiles.length === 0) return null;
  if (storedId && profiles.some((profile) => profile.id === storedId)) {
    return storedId;
  }
  return profiles[0]?.id ?? null;
}

export function useExtensionController() {
  const [connection, setConnection] = useState<ConnectionState>({ status: 'loading' });
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [profiles, setProfiles] = useState<FreelancerProfileSummary[]>([]);
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(null);
  const [proposalPreview, setProposalPreview] = useState<string | null>(null);
  const [action, setAction] = useState<ExtensionAction>('idle');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refreshProfiles = useCallback(async (session: StoredSession) => {
    const [result, storedDefault] = await Promise.all([
      listFreelancerProfiles(session),
      getStoredDefaultProfileId(),
    ]);
    const nextDefault = resolveDefaultProfileId(result.profiles, storedDefault);
    setProfiles(result.profiles);
    setDefaultProfileId(nextDefault);
    if (nextDefault && nextDefault !== storedDefault) {
      await saveDefaultProfileId(nextDefault);
    }
    if (!nextDefault && storedDefault) {
      await clearDefaultProfileId();
    }
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
        setDefaultProfileId(null);
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
          setDefaultProfileId(null);
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
        setDefaultProfileId(null);
      }
    } finally {
      setAction('idle');
    }
  }, [activeTab, connection, refreshProfiles]);

  const syncPortfolio = useCallback(async () => {
    if (connection.status !== 'connected' || !activeTab) return;
    if (!isUpworkPortfolioProjectTab(activeTab)) {
      setFeedback({ tone: 'error', message: 'Open an Upwork portfolio project (?p=), then try again.' });
      return;
    }

    setAction('syncing');
    setFeedback({ tone: 'info', message: 'Reading the portfolio project…' });
    try {
      const project = await scrapeActivePortfolioProject(activeTab);
      const result = await importPortfolioProject(connection.session, project);
      setConnection({ status: 'connected', session: result.session });
      setFeedback({
        tone: 'success',
        message: result.created
          ? `Saved “${result.title}” to the matching profile.`
          : `Updated “${result.title}” on the matching profile.`,
      });
    } catch (error) {
      const message = toFriendlyError(error, 'syncPortfolio');
      setFeedback({ tone: 'error', message });
      if (isAuthenticationError(error)) {
        setConnection({ status: 'disconnected' });
        setProfiles([]);
        setDefaultProfileId(null);
      }
    } finally {
      setAction('idle');
    }
  }, [activeTab, connection]);

  const setDefaultProfile = useCallback(async (profileId: string) => {
    if (!profiles.some((profile) => profile.id === profileId)) return;
    await saveDefaultProfileId(profileId);
    setDefaultProfileId(profileId);
    setFeedback({ tone: 'info', message: 'Default profile updated.' });
  }, [profiles]);

  const generateProposal = useCallback(async () => {
    if (connection.status !== 'connected' || !activeTab?.url) return;
    if (!isUpworkJobTab(activeTab)) {
      setFeedback({ tone: 'error', message: 'Open a valid Upwork job page, then try again.' });
      return;
    }
    if (!defaultProfileId) {
      setFeedback({ tone: 'error', message: 'Sync a freelancer profile before generating proposals.' });
      return;
    }

    setAction('generating');
    setFeedback({ tone: 'info', message: 'Generating proposal…' });
    try {
      const result = await generateProposalFromJobUrl(connection.session, defaultProfileId, activeTab.url);
      setConnection({ status: 'connected', session: result.session });
      setProposalPreview(result.body);
      try {
        await navigator.clipboard.writeText(result.body);
        setFeedback({ tone: 'success', message: 'Proposal generated, saved, and copied to clipboard.' });
      } catch {
        setFeedback({ tone: 'success', message: 'Proposal generated and saved. Use Copy in the preview.' });
      }
    } catch (error) {
      const message = toFriendlyError(error, 'generate');
      setFeedback({ tone: 'error', message });
      if (isAuthenticationError(error)) {
        setConnection({ status: 'disconnected' });
        setProfiles([]);
        setDefaultProfileId(null);
      }
    } finally {
      setAction('idle');
    }
  }, [activeTab, connection, defaultProfileId]);

  const copyProposalPreview = useCallback(async () => {
    if (!proposalPreview) return;
    try {
      await navigator.clipboard.writeText(proposalPreview);
      setFeedback({ tone: 'success', message: 'Copied to clipboard.' });
    } catch {
      setFeedback({ tone: 'error', message: 'Could not copy to clipboard.' });
    }
  }, [proposalPreview]);

  const closeProposalPreview = useCallback(() => {
    setProposalPreview(null);
  }, []);

  const disconnectExtension = useCallback(async () => {
    if (connection.status !== 'connected') return;

    setAction('disconnecting');
    setFeedback(null);
    try {
      await disconnect(connection.session);
      setConnection({ status: 'disconnected' });
      setProfiles([]);
      setDefaultProfileId(null);
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
    defaultProfileId,
    proposalPreview,
    action,
    busy: action !== 'idle',
    feedback,
    connect,
    sync,
    syncPortfolio,
    generateProposal,
    setDefaultProfile,
    copyProposalPreview,
    closeProposalPreview,
    disconnect: disconnectExtension,
  };
}
