import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { applyTheme, getSystemTheme, initializeExtensionTheme } from './lib/extension-theme';
import './styles.css';

async function bootstrap(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) throw new Error('Extension root element was not found');

  await initializeExtensionTheme().catch(() => {
    applyTheme(getSystemTheme());
  });

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
