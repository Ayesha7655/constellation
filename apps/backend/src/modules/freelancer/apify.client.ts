import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { API_ERROR_CODES } from '@constellation/shared';
import { codedBadRequest } from '../../common/exceptions/coded-http.exception';

type ApifyRunStatus =
  | 'READY'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMING-OUT'
  | 'TIMED-OUT'
  | 'ABORTING'
  | 'ABORTED';

type ApifyRunResponse = {
  data?: {
    id?: string;
    status?: ApifyRunStatus;
    defaultDatasetId?: string;
    statusMessage?: string;
  };
};

@Injectable()
export class ApifyClient {
  private readonly logger = new Logger(ApifyClient.name);

  constructor(private readonly configService: ConfigService) {}

  requireToken(): string {
    const token = this.configService.get<string>('APIFY_TOKEN')?.trim();
    if (!token) {
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_NOT_CONFIGURED);
    }
    return token;
  }

  async startActorRun(actorId: string, input: Record<string, unknown>): Promise<{ runId: string }> {
    const token = this.requireToken();
    if (!actorId?.trim()) {
      this.logger.warn('Apify startActorRun called without actorId');
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
    }
    const encodedActorId = encodeURIComponent(actorId);
    if (this.debugEnabled()) {
      this.logger.debug(
        `Starting Apify actor ${actorId} with input keys=${Object.keys(input).join(',')}`,
      );
    }
    const response = await this.fetchJson<ApifyRunResponse>(
      `https://api.apify.com/v2/acts/${encodedActorId}/runs?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    );

    const runId = response.data?.id;
    if (!runId) {
      if (this.debugEnabled()) {
        this.logger.debug(`Apify start response missing run id: ${JSON.stringify(response).slice(0, 500)}`);
      }
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
    }
    return { runId };
  }

  async waitForRunDataset(runId: string): Promise<{ datasetId: string; status: ApifyRunStatus }> {
    const token = this.requireToken();
    const timeoutMs = this.getTimeoutMs();
    const pollMs = this.getPollMs();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const response = await this.fetchJson<ApifyRunResponse>(
        `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`,
      );
      const status = response.data?.status;
      const datasetId = response.data?.defaultDatasetId;

      if (status === 'SUCCEEDED' && datasetId) {
        return { datasetId, status };
      }

      if (
        status === 'FAILED' ||
        status === 'TIMED-OUT' ||
        status === 'ABORTED' ||
        status === 'ABORTING'
      ) {
        const message = response.data?.statusMessage?.trim() || `Apify run ${status ?? 'failed'}`;
        this.logger.warn(`Apify run ${runId} ended with ${status}: ${message}`);
        throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
      }

      await sleep(pollMs);
    }

    this.logger.warn(`Apify run ${runId} timed out after ${timeoutMs}ms`);
    throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
  }

  async listDatasetItems(datasetId: string): Promise<unknown[]> {
    const token = this.requireToken();
    if (!datasetId?.trim()) {
      this.logger.warn('Apify listDatasetItems called without datasetId');
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
    }
    const items: unknown[] = [];
    let offset = 0;
    const limit = 250;

    for (;;) {
      const batch = await this.fetchJson<unknown>(
        `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&clean=true&format=json&offset=${offset}&limit=${limit}`,
      );
      const rows = Array.isArray(batch)
        ? batch
        : batch &&
            typeof batch === 'object' &&
            Array.isArray((batch as { data?: unknown }).data)
          ? ((batch as { data: unknown[] }).data)
          : null;

      if (!rows || rows.length === 0) {
        if (this.debugEnabled() && offset === 0 && batch != null && !Array.isArray(batch)) {
          this.logger.debug(
            `Unexpected Apify dataset payload shape: ${JSON.stringify(batch).slice(0, 400)}`,
          );
        }
        break;
      }
      items.push(...rows);
      if (rows.length < limit) {
        break;
      }
      offset += limit;
    }

    if (this.debugEnabled()) {
      this.logger.debug(`Apify dataset ${datasetId} fetched ${items.length} item(s)`);
    }
    return items;
  }

  private debugEnabled(): boolean {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }

  private getTimeoutMs(): number {
    const configured = this.configService.get<string>('APIFY_RUN_TIMEOUT_MS')?.trim();
    const parsed = configured ? Number.parseInt(configured, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 600_000;
  }

  private getPollMs(): number {
    const configured = this.configService.get<string>('APIFY_POLL_INTERVAL_MS')?.trim();
    const parsed = configured ? Number.parseInt(configured, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 5000;
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'network error';
      this.logger.warn(`Apify request failed: ${message}`);
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.warn(`Apify HTTP ${response.status}: ${body.slice(0, 300)}`);
      throw codedBadRequest(API_ERROR_CODES.SCRAPE_RUN_APIFY_FAILED);
    }

    return (await response.json()) as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
