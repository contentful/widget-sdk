const APPLICATION_DOM_CONTENT_LOADED = 'perf-dom-content-loaded';

export function track(Telemetry) {
  try {
    const [navigationTiming] = performance.getEntriesByType('navigation');

    Telemetry.record(APPLICATION_DOM_CONTENT_LOADED, navigationTiming.domContentLoadedEventEnd);
  } catch (error) {
    //ignore errors
  }
}
