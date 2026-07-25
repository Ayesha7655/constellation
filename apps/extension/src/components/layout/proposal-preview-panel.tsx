import { useCallback } from 'react';
import { Copy, X } from 'lucide-react';

type ProposalPreviewPanelProps = Readonly<{
  body: string;
  onCopy: () => void;
  onClose: () => void;
}>;

export function ProposalPreviewPanel({ body, onCopy, onClose }: ProposalPreviewPanelProps) {
  const handleCopy = useCallback(() => {
    onCopy();
  }, [onCopy]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className="proposal-preview" data-testid="extension-proposal-preview" role="dialog" aria-modal="true">
      <div className="proposal-preview-header">
        <div>
          <h2 className="proposal-preview-title">Proposal preview</h2>
          <p className="proposal-preview-subtitle">Saved to Constellation. Copy into Upwork when ready.</p>
        </div>
        <button
          type="button"
          className="proposal-preview-icon-btn"
          onClick={handleClose}
          data-testid="extension-proposal-preview-close"
          aria-label="Close preview"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="proposal-preview-body" data-testid="extension-proposal-preview-body">
        {body}
      </div>
      <div className="proposal-preview-footer">
        <button
          type="button"
          className="button button-primary"
          onClick={handleCopy}
          data-testid="extension-proposal-preview-copy"
        >
          <Copy size={15} aria-hidden="true" />
          Copy
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleClose}
          data-testid="extension-proposal-preview-done"
        >
          Done
        </button>
      </div>
    </div>
  );
}
