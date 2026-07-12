import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CreateListingDraftResponse,
  ListingDraftFormValues,
  SaveListingDraftPayload,
} from '@/types/listing-drafts';

export type ListingDraftController<TValues> = Readonly<{
  draftId: string | null;
  isSaving: boolean;
  lastSavedAt: number | null;
  /**
   * Persist the current form state, lazily creating the draft on the first call. Sequenced.
   * Resolves `true` when the save was persisted, `false` when it failed (the error is also routed
   * to `onError`). Callers that block on the result (Save & exit) must check it before navigating.
   */
  saveStep: (values: TValues, resumeStepId: string) => Promise<boolean>;
  /**
   * Wait for any in-flight/queued save to finish and return the resolved draft id (or null if no
   * draft was ever created). Submit must await this so it never races a still-pending lazy-create
   * (which would leave an orphan draft) and never deletes a draft a concurrent PATCH is still writing.
   */
  settle: () => Promise<string | null>;
}>;

type Options<TValues> = Readonly<{
  initialDraftId?: string;
  onError?: (error: unknown) => void;
  /**
   * Resolve the authoritative `storageKeys` (every S3 key the form currently references) to send with
   * each save. Kept as an injected collector so the hook stays a pure sequencer (no knowledge of the
   * form's file/spec shape). Files are uploaded in the form *before* `saveStep`; this only reads keys.
   */
  collectStorageKeys?: (values: TValues) => readonly string[];
  /** Convert the form values into the JSON-safe persisted blob (kind-specific serializer). */
  serialize: (values: TValues) => ListingDraftFormValues;
  /** Lazy-create the draft (kind-specific API). */
  createDraft: (payload: SaveListingDraftPayload) => Promise<CreateListingDraftResponse>;
  /** Update an existing draft (kind-specific API). */
  updateDraft: (id: string, payload: SaveListingDraftPayload) => Promise<unknown>;
}>;

/**
 * Owns draft persistence for a listing wizard, decoupled from render and from the listing kind. Saves are
 * sequenced: never two PATCHes in flight; rapid Next clicks coalesce to the latest payload (last-write-wins
 * per the draft contract). The draft row is created lazily on the first save. The seller/partner wrappers
 * inject the kind-specific serializer + API calls; this hook stays a pure sequencer.
 */
export function useListingDraft<TValues>(options: Options<TValues>): ListingDraftController<TValues> {
  const [draftId, setDraftId] = useState<string | null>(options.initialDraftId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const draftIdRef = useRef<string | null>(options.initialDraftId ?? null);
  const pendingRef = useRef<SaveListingDraftPayload | null>(null);
  const flushPromiseRef = useRef<Promise<boolean> | null>(null);
  const onErrorRef = useRef(options.onError);
  const collectStorageKeysRef = useRef(options.collectStorageKeys);
  const serializeRef = useRef(options.serialize);
  const createDraftRef = useRef(options.createDraft);
  const updateDraftRef = useRef(options.updateDraft);
  useEffect(() => {
    onErrorRef.current = options.onError;
    collectStorageKeysRef.current = options.collectStorageKeys;
    serializeRef.current = options.serialize;
    createDraftRef.current = options.createDraft;
    updateDraftRef.current = options.updateDraft;
  }, [options.onError, options.collectStorageKeys, options.serialize, options.createDraft, options.updateDraft]);

  const runFlush = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    let lastOk = true;
    try {
      while (pendingRef.current) {
        const payload = pendingRef.current;
        pendingRef.current = null;
        try {
          if (draftIdRef.current) {
            await updateDraftRef.current(draftIdRef.current, payload);
          } else {
            const created = await createDraftRef.current(payload);
            draftIdRef.current = created.id;
            setDraftId(created.id);
          }
          setLastSavedAt(Date.now());
          lastOk = true;
        } catch (error) {
          onErrorRef.current?.(error);
          lastOk = false;
          // Keep draining; a later save resyncs the full snapshot (last-write-wins).
        }
      }
    } finally {
      setIsSaving(false);
    }
    return lastOk;
  }, []);

  const saveStep = useCallback(
    (values: TValues, resumeStepId: string): Promise<boolean> => {
      const storageKeys = collectStorageKeysRef.current?.(values);
      pendingRef.current = {
        formValues: serializeRef.current(values),
        resumeStepId,
        ...(storageKeys === undefined ? {} : { storageKeys }),
      };
      // If a flush is already running it will drain this just-queued payload (last-write-wins), so
      // return that same in-flight promise — its resolved boolean reflects the last payload actually
      // persisted (this one). Save & exit can therefore trust the result. Saves are user-click driven,
      // so a fresh click only lands after the prior flush settled and cleared the ref (no lost save).
      if (flushPromiseRef.current) {
        return flushPromiseRef.current;
      }
      const running = runFlush().finally(() => {
        flushPromiseRef.current = null;
      });
      flushPromiseRef.current = running;
      return running;
    },
    [runFlush],
  );

  const settle = useCallback(async (): Promise<string | null> => {
    // Drain any in-flight/queued flush so the lazy-create has resolved a draft id before submit
    // decides its path. The loop re-checks because a save could have been queued while awaiting.
    while (flushPromiseRef.current) {
      await flushPromiseRef.current;
    }
    return draftIdRef.current;
  }, []);

  return { draftId, isSaving, lastSavedAt, saveStep, settle };
}
