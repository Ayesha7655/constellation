/** Reset the dashboard main scroll region after wizard step changes. */
export function resetDashboardMainScroll(): void {
  const scrollEl = document.querySelector('[data-dashboard-main-scroll]');
  if (scrollEl instanceof HTMLElement) {
    scrollEl.scrollTop = 0;
  }
}

/** Keep dashboard scroll position stable across a state update (e.g. wizard checkbox toggles). */
export function preserveDashboardMainScroll(action: () => void): void {
  const scrollEl = document.querySelector('[data-dashboard-main-scroll]');
  const scrollTop = scrollEl instanceof HTMLElement ? scrollEl.scrollTop : null;
  action();
  if (scrollTop === null || !(scrollEl instanceof HTMLElement)) {
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollTop;
    });
  });
}
