export type ListingPhotoFormItem =
  | Readonly<{ type: 'existing'; storageKey: string; url: string }>
  | Readonly<{ type: 'pending'; file: File; previewUrl: string }>;

export type ListingPhotosFieldLabels = Readonly<{
  label: string;
  emptyHint: string;
  addPhotos: string;
  hint: string;
  mainBadge: string;
  moveEarlier: string;
  moveLater: string;
  remove: string;
}>;
