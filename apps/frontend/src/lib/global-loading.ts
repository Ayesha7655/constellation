type GlobalLoadingListener = () => void;

let activeRequestCount = 0;
const listeners = new Set<GlobalLoadingListener>();

function notifyGlobalLoadingListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getGlobalLoadingActive(): boolean {
  return activeRequestCount > 0;
}

export function subscribeGlobalLoading(listener: GlobalLoadingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function incrementGlobalLoading(): void {
  activeRequestCount += 1;
  notifyGlobalLoadingListeners();
}

export function decrementGlobalLoading(): void {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  notifyGlobalLoadingListeners();
}

export async function trackFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  incrementGlobalLoading();
  try {
    return await fetch(input, init);
  } finally {
    decrementGlobalLoading();
  }
}

/** All frontend API wrappers must use `trackFetch` so loading is shown once via `GlobalLoadingProvider`. */
