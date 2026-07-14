import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { generateUpworkFilters } from './generate';

loadEnv({ path: resolve(process.cwd(), '.env') });

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function requireInternalKey(req: IncomingMessage): boolean {
  const expected = process.env.FILTER_AI_INTERNAL_KEY?.trim();
  if (!expected) {
    return false;
  }
  const provided = req.headers['x-internal-key'];
  return typeof provided === 'string' && provided === expected;
}

const port = Number(process.env.PORT ?? 4060);

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/generate-filters') {
      if (!requireInternalKey(req)) {
        sendJson(res, 401, { error: 'unauthorized' });
        return;
      }

      const raw = await readBody(req);
      let parsed: { profile?: Record<string, unknown> };
      try {
        parsed = JSON.parse(raw) as { profile?: Record<string, unknown> };
      } catch {
        sendJson(res, 400, { error: 'invalid_json' });
        return;
      }

      if (!parsed.profile || typeof parsed.profile !== 'object') {
        sendJson(res, 400, { error: 'profile_required' });
        return;
      }

      const filters = await generateUpworkFilters(parsed.profile);
      sendJson(res, 200, { filters });
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error('[filter-ai]', error);
    sendJson(res, 500, { error: 'generate_failed' });
  }
});

server.listen(port, () => {
  console.log(`[filter-ai] listening on :${port}`);
});
