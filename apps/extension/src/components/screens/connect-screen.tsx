import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowUpRight, KeyRound, Link2 } from 'lucide-react';
import { getWebUrl } from '../../lib/extension-config';

type ConnectScreenProps = Readonly<{
  busy: boolean;
  onConnect: (code: string) => Promise<void>;
}>;

export function ConnectScreen({ busy, onConnect }: ConnectScreenProps) {
  const [code, setCode] = useState('');

  const handleCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void onConnect(code);
    },
    [code, onConnect],
  );

  return (
    <main className="content">
      <div className="hero-icon" aria-hidden="true">
        <Link2 size={23} />
      </div>
      <div className="intro">
        <h1>Connect to Constellation</h1>
        <p>Pair this browser with your organization before syncing Upwork profiles.</p>
      </div>

      <form className="card connect-card" onSubmit={handleSubmit}>
        <div className="card-heading">
          <div className="field-icon" aria-hidden="true">
            <KeyRound size={17} />
          </div>
          <div>
            <h2>Pairing code</h2>
            <p>Generate a code from the app’s Connect extension page.</p>
          </div>
        </div>
        <label htmlFor="pairing-code">6-digit code</label>
        <input
          id="pairing-code"
          data-testid="extension-pairing-code"
          className="code-input"
          value={code}
          onChange={handleCodeChange}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          aria-invalid={code.length > 0 && code.length !== 6}
        />
        <button
          data-testid="extension-connect"
          className="button button-primary"
          type="submit"
          disabled={busy || code.length !== 6}
        >
          {busy ? 'Connecting…' : 'Connect extension'}
        </button>
      </form>

      <a
        className="app-link"
        data-testid="extension-open-app"
        href={`${getWebUrl()}/dashboard/upwork/extension`}
        target="_blank"
        rel="noreferrer"
      >
        Open Constellation to get a code
        <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </main>
  );
}
