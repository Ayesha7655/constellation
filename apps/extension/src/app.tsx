import { ExtensionScreen } from './components/screens/extension-screen';
import { BrandHeader } from './components/layout/brand-header';
import { FeedbackBanner } from './components/layout/feedback-banner';
import { useExtensionController } from './hooks/use-extension-controller';

export function App() {
  const controller = useExtensionController();

  return (
    <div className="popup-shell">
      <BrandHeader />
      <ExtensionScreen
        connection={controller.connection}
        activeTab={controller.activeTab}
        busy={controller.busy}
        onConnect={controller.connect}
        onSync={controller.sync}
        onDisconnect={controller.disconnect}
      />
      {controller.feedback ? (
        <div className="feedback-wrap">
          <FeedbackBanner feedback={controller.feedback} />
        </div>
      ) : null}
      <footer>Constellation · Secure profile sync</footer>
    </div>
  );
}
