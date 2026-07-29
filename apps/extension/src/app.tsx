import { ExtensionScreen } from './components/screens/extension-screen';
import { BrandHeader } from './components/layout/brand-header';
import { FeedbackBanner } from './components/layout/feedback-banner';
import { ProposalPreviewPanel } from './components/layout/proposal-preview-panel';
import { useExtensionController } from './hooks/use-extension-controller';

export function App() {
  const controller = useExtensionController();
  const connected = controller.connection.status === 'connected';

  return (
    <div className="popup-shell">
      <BrandHeader
        profiles={connected ? controller.profiles : []}
        defaultProfileId={controller.defaultProfileId}
        onDefaultProfileChange={connected ? controller.setDefaultProfile : undefined}
        disabled={controller.busy}
      />
      {controller.proposalPreview ? (
        <ProposalPreviewPanel
          body={controller.proposalPreview}
          onCopy={controller.copyProposalPreview}
          onClose={controller.closeProposalPreview}
        />
      ) : (
        <ExtensionScreen
          connection={controller.connection}
          activeTab={controller.activeTab}
          profiles={controller.profiles}
          defaultProfileId={controller.defaultProfileId}
          action={controller.action}
          onConnect={controller.connect}
          onSync={controller.sync}
          onSyncPortfolio={controller.syncPortfolio}
          onGenerateProposal={controller.generateProposal}
          onDisconnect={controller.disconnect}
        />
      )}
      {controller.feedback ? (
        <div className="feedback-wrap">
          <FeedbackBanner feedback={controller.feedback} />
        </div>
      ) : null}
      <footer>Constellation · Profile sync & proposals</footer>
    </div>
  );
}
