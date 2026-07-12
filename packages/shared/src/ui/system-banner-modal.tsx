'use client';

import { useCallback } from 'react';
import { TEST_IDS } from '../test-ids';
import type { SystemBannerModalDto } from '../system-banners';
import { Button } from './button';
import { Dialog } from './dialog';
import { RichTextContent } from './rich-text-content';

type SystemBannerModalProps = Readonly<{
  banner: SystemBannerModalDto;
  dismissLabel: string;
  onDismiss: (id: string) => void;
  testId?: string;
}>;

export function SystemBannerModal({ banner, dismissLabel, onDismiss, testId }: SystemBannerModalProps) {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onDismiss(banner.id);
      }
    },
    [banner.id, onDismiss],
  );

  const onDismissClick = useCallback(() => {
    onDismiss(banner.id);
  }, [banner.id, onDismiss]);

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={banner.title}
      size="xl"
      testId={testId ?? TEST_IDS.systemBanners.modal}
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onDismissClick}>
            {dismissLabel}
          </Button>
        </div>
      }
    >
      <RichTextContent html={banner.bodyHtml} />
    </Dialog>
  );
}
