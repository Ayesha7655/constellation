import { useSyncExternalStore } from 'react';

/** True after client hydration. Use to avoid SSR/client mismatches without setState in effects. */
export function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
