'use client';

import { useCallback, useId, useMemo, useRef } from 'react';
import { useField } from 'formik';
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from 'lucide-react';
import { ROBOT_LISTING_MAX_PHOTOS } from '../robot-listings';
import type { ListingPhotoFormItem, ListingPhotosFieldLabels } from '../lib/listing-photos';
import { cn } from '../lib/utils';
import { FieldInlineError } from './field-inline-error';
import { FormField } from './form-field';

type ListingPhotosFieldProps = Readonly<{
  labels: ListingPhotosFieldLabels;
  disabled?: boolean;
}>;

type ListingPhotoThumbProps = Readonly<{
  photo: ListingPhotoFormItem;
  index: number;
  total: number;
  labels: ListingPhotosFieldLabels;
  disabled?: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}>;

type PhotoDropzoneProps = Readonly<{
  inputId: string;
  labels: ListingPhotosFieldLabels;
  disabled?: boolean;
  showError?: boolean;
  compact?: boolean;
  onClick: () => void;
}>;

function PhotoDropzone({ inputId, labels, disabled, showError, compact, onClick }: PhotoDropzoneProps) {
  return (
    <button
      type="button"
      id={compact ? undefined : inputId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 transition-colors',
        'hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        compact ? 'px-4 py-5' : 'px-4 py-10',
        showError && 'border-destructive/50',
      )}
    >
      <ImagePlus className={cn('text-muted-foreground', compact ? 'size-6' : 'size-8')} aria-hidden />
      <span className="text-sm font-medium text-foreground">{labels.addPhotos}</span>
      {!compact ? <span className="text-xs text-muted-foreground">{labels.emptyHint}</span> : null}
    </button>
  );
}

function ListingPhotoThumb({ photo, index, total, labels, disabled, onMove, onRemove }: ListingPhotoThumbProps) {
  const previewUrl = photo.type === 'existing' ? photo.url : photo.previewUrl;

  const onMoveEarlierClick = useCallback(() => {
    onMove(index, -1);
  }, [index, onMove]);

  const onMoveLaterClick = useCallback(() => {
    onMove(index, 1);
  }, [index, onMove]);

  const onRemoveClick = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  return (
    <li className="relative overflow-hidden rounded-xl bg-card shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="" className="aspect-square w-full object-cover" />
      {index === 0 ? (
        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-background/90 px-2 py-0.5 text-xs font-medium text-primary">
          <Star className="size-3" aria-hidden />
          {labels.mainBadge}
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-background/80 p-1.5 backdrop-blur-sm">
        <button
          type="button"
          disabled={disabled || index === 0}
          onClick={onMoveEarlierClick}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          aria-label={labels.moveEarlier}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          disabled={disabled || index === total - 1}
          onClick={onMoveLaterClick}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          aria-label={labels.moveLater}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemoveClick}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          aria-label={labels.remove}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function revokePendingPreview(photo: ListingPhotoFormItem): void {
  if (photo.type === 'pending') {
    URL.revokeObjectURL(photo.previewUrl);
  }
}

export function ListingPhotosField({ labels, disabled }: ListingPhotosFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [field, meta, helpers] = useField<readonly ListingPhotoFormItem[]>('photos');

  const photos = useMemo(() => field.value ?? [], [field.value]);
  const showError = Boolean(meta.touched && meta.error);
  const atMax = photos.length >= ROBOT_LISTING_MAX_PHOTOS;

  const onAddClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) {
        return;
      }

      const remaining = ROBOT_LISTING_MAX_PHOTOS - photos.length;
      const filesToAdd = Array.from(selectedFiles).slice(0, remaining);
      const nextPhotos: ListingPhotoFormItem[] = [
        ...photos,
        ...filesToAdd.map((file) => ({
          type: 'pending' as const,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];

      void helpers.setValue(nextPhotos, true);
      void helpers.setTouched(true, false);
      event.target.value = '';
    },
    [helpers, photos],
  );

  const onRemove = useCallback(
    (index: number) => {
      const removed = photos[index];
      if (removed) {
        revokePendingPreview(removed);
      }
      void helpers.setValue(
        photos.filter((_: ListingPhotoFormItem, photoIndex: number) => photoIndex !== index),
        true,
      );
      void helpers.setTouched(true, false);
    },
    [helpers, photos],
  );

  const onMove = useCallback(
    (index: number, direction: -1 | 1) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= photos.length) {
        return;
      }
      const nextPhotos = [...photos];
      const current = nextPhotos[index];
      const target = nextPhotos[targetIndex];
      if (!current || !target) {
        return;
      }
      nextPhotos[index] = target;
      nextPhotos[targetIndex] = current;
      void helpers.setValue(nextPhotos, true);
    },
    [helpers, photos],
  );

  return (
    <FormField
      id={inputId}
      label={labels.label}
      error={typeof meta.error === 'string' ? meta.error : undefined}
      touched={meta.touched}
    >
      <div className="space-y-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="sr-only"
          disabled={disabled || atMax}
          onChange={onInputChange}
          aria-invalid={showError}
        />

        {photos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo: ListingPhotoFormItem, index: number) => (
              <ListingPhotoThumb
                key={photo.type === 'existing' ? photo.storageKey : photo.previewUrl}
                photo={photo}
                index={index}
                total={photos.length}
                labels={labels}
                disabled={disabled}
                onMove={onMove}
                onRemove={onRemove}
              />
            ))}
          </ul>
        ) : null}

        {!atMax ? (
          <PhotoDropzone
            inputId={inputId}
            labels={labels}
            disabled={disabled}
            showError={showError}
            compact={photos.length > 0}
            onClick={onAddClick}
          />
        ) : null}

        <p className="text-xs text-muted-foreground">
          {labels.hint.replace('{max}', String(ROBOT_LISTING_MAX_PHOTOS))}
        </p>

        {showError && typeof meta.error === 'string' ? (
          <FieldInlineError id={`${inputId}-error`} message={meta.error} />
        ) : null}
      </div>
    </FormField>
  );
}
