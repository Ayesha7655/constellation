export type ListingDraftKind = 'SELLER' | 'PARTNER';

/** Opaque form-values blob — the backend stores/returns it verbatim. */
export type ListingDraftFormValues = Record<string, unknown>;

export type ListingDraftSummary = Readonly<{
  id: string;
  listingKind: ListingDraftKind;
  formValues: ListingDraftFormValues;
  resumeStepId: string | null;
  formVersion: number;
  createdAt: string;
  updatedAt: string;
}>;

export type ListingDraftDetail = ListingDraftSummary &
  Readonly<{
    ownedStorageKeys: readonly string[];
  }>;

export type SaveListingDraftPayload = Readonly<{
  formValues?: ListingDraftFormValues;
  resumeStepId?: string;
  /** Accepted by the backend from Epic 2 (durable files); harmless to omit in Epic 1. */
  storageKeys?: readonly string[];
}>;

export type CreateListingDraftResponse = Readonly<{ id: string }>;

export type ListingDraftsListResponse = Readonly<{ drafts: readonly ListingDraftSummary[] }>;
