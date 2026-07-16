'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TEST_IDS } from '@constellation/shared';
import { Button, FormActions } from '@constellation/shared/ui';
import { AdminPageLayout } from '@/components/layout/admin-page-layout';
import { getAccessToken, getRefreshToken } from '@/lib/auth-session';
import { showUserErrorToast, showUserSuccessToast } from '@/i18n/translate-user-message';
import { translateAuthRequestError } from '@/lib/user-messages';
import { createExtensionPairingCode, markExtensionConnected } from '@/services/freelancer-api';

const DEFAULT_EXTENSION_ID = 'binnbooceccibooedcfekgeackgnkodh';

/** Chrome extension IDs are 32 chars in a–p; strip env-file corruption (e.g. literal `r`n). */
function resolveExtensionId(raw: string | undefined): string {
  const cleaned = (raw ?? '').replace(/[^a-p]/gi, '');
  return cleaned.length === 32 ? cleaned : DEFAULT_EXTENSION_ID;
}

const EXTENSION_ID = resolveExtensionId(process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID);

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          responseCallback?: (response: unknown) => void,
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

export function UpworkExtensionView() {
  const t = useTranslations('org.upwork.extension');
  const tErrors = useTranslations();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onGenerateCode = useCallback(async () => {
    setBusy(true);
    try {
      const result = await createExtensionPairingCode();
      setCode(result.code);
      setExpiresAt(result.expiresAt);
    } catch (error) {
      showUserErrorToast(translateAuthRequestError(error, tErrors));
    } finally {
      setBusy(false);
    }
  }, [tErrors]);

  const onCopy = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    showUserSuccessToast(t('copied'));
  }, [code, t]);

  const onOneClick = useCallback(() => {
    if (!EXTENSION_ID || !window.chrome?.runtime?.sendMessage) {
      showUserErrorToast(t('oneClickMissing'));
      return;
    }
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!accessToken || !refreshToken) {
      showUserErrorToast(t('oneClickMissing'));
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4050/api';
    window.chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        type: 'CONSTELLATION_PAIR',
        accessToken,
        refreshToken,
        apiUrl,
      },
      (response) => {
        if (window.chrome?.runtime?.lastError) {
          showUserErrorToast(t('oneClickMissing'));
          return;
        }
        const ok = typeof response === 'object' && response !== null && 'ok' in response && (response as { ok: unknown }).ok === true;
        if (ok) {
          void markExtensionConnected().catch(() => {
            /* best effort */
          });
          showUserSuccessToast(t('oneClickSuccess'));
        } else {
          showUserErrorToast(t('oneClickMissing'));
        }
      },
    );
  }, [t]);

  return (
    <AdminPageLayout title={t('title')} description={t('description')}>
      <section className="mb-8 space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">{t('oneClick')}</h2>
        <p className="text-sm text-muted-foreground">{t('oneClickHint')}</p>
        <FormActions className="justify-end">
          <Button type="button" onClick={onOneClick} testId={TEST_IDS.upworkExtension.oneClick} fullWidth={false}>
            {t('oneClick')}
          </Button>
        </FormActions>
      </section>

      <section className="mb-8 space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">{t('codeTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('codeHint')}</p>
        {code ? (
          <p className="font-mono text-3xl tracking-[0.3em] text-foreground" data-testid={TEST_IDS.upworkExtension.codeDisplay}>
            {code}
          </p>
        ) : null}
        {expiresAt ? <p className="text-xs text-muted-foreground">{expiresAt}</p> : null}
        <FormActions className="justify-end">
          <Button type="button" variant="outline" onClick={onGenerateCode} disabled={busy} testId={TEST_IDS.upworkExtension.generateCode} fullWidth={false}>
            {t('generateCode')}
          </Button>
          <Button type="button" onClick={onCopy} disabled={!code} testId={TEST_IDS.upworkExtension.copyCode} fullWidth={false}>
            {t('copyCode')}
          </Button>
        </FormActions>
      </section>
    </AdminPageLayout>
  );
}
